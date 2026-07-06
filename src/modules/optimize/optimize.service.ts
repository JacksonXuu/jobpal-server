import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { OptimizeDto } from './dto/optimize.dto';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import type { Response } from 'express';

const SYSTEM_PROMPT = `你是一位资深简历优化专家。你的任务是根据目标岗位的要求，对用户的简历进行专项优化。

## 优化原则
1. **诚实** — 绝不编造经历、技能、学历，只基于用户已有的真实经历优化
2. **关键词匹配** — 分析 JD 中的关键词和技术栈，在简历中自然突出对应经历
3. **STAR 法则** — Situation-Task-Action-Result 结构描述项目，量化成果
4. **简洁有力** — 去除冗余表述，每句话有信息量
5. **针对性提炼** — 最相关的技能和经历放最前面

## 参考范例（历史相似优化记录）
{ragContext}

## 输出格式
直接输出优化后的完整简历（Markdown 格式），开头不要加任何解释。
末尾必须附加「## 优化说明」章节，逐条列出本次的关键改动及理由。`;

const USER_PROMPT = `## 目标岗位
- 岗位名称：{jobName}
- 公司：{companyName}
- 薪资：{salary}k
- 要求：{requirements}
- 职责：{responsibilities}
- 吸引力：{attractiveness}

## 我的简历
{resumeContent}`;

@Injectable()
export class OptimizeService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  // 优化历史
  async getHistory(userId: string, keyword?: string) {
    const where: any = { userId };
    if (keyword) {
      where.OR = [
        { resume: { title: { contains: keyword } } },
        { jobPosition: { jobName: { contains: keyword } } },
      ];
    }
    const [list, total] = await Promise.all([
      this.prisma.resumeOptimization.findMany({
        where,
        select: {
          id: true,
          resume: { select: { title: true } },
          jobPosition: { select: { jobName: true, companyName: true } },
          tokensUsed: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.resumeOptimization.count({ where }),
    ]);
    return { list, total };
  }

  // 优化详情
  async findOne(id: string, userId: string) {
    const record = await this.prisma.resumeOptimization.findFirst({
      where: { id, userId },
      include: {
        resume: { select: { title: true } },
        jobPosition: { select: { jobName: true, companyName: true } },
      },
    });
    if (!record) throw new NotFoundException('优化记录不存在');
    return record;
  }

  // 流式优化
  async optimize(dto: OptimizeDto, userId: string, res: Response) {
    // 1. 查简历和岗位
    const [resume, job] = await Promise.all([
      this.prisma.resume.findFirst({ where: { id: dto.resumeId, userId } }),
      this.prisma.jobPosition.findFirst({ where: { id: dto.jobPositionId, userId } }),
    ]);
    if (!resume) throw new NotFoundException('简历不存在');
    if (!job) throw new NotFoundException('岗位不存在');

    // 2. 创建优化记录
    const record = await this.prisma.resumeOptimization.create({
      data: {
        userId,
        resumeId: resume.id,
        jobPositionId: job.id,
        originalText: resume.content,
      },
    });

    // 3. RAG 检索历史范例
    const ragContext = await this.buildRagContext(job, userId);

    // 4. SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    this.sendSSE(res, 'start', { recordId: record.id });

    // 5. 构建 LangChain 链
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      ['user', USER_PROMPT],
    ]);

    const llm = new ChatOpenAI({
      modelName: this.configService.get<string>('dashscope.model', 'qwen-plus'),
      temperature: 0.7,
      streaming: true,
      configuration: {
        baseURL: this.configService.get<string>('dashscope.baseURL'),
        apiKey: this.configService.get<string>('dashscope.apiKey'),
      },
    });

    const chain = prompt.pipe(llm).pipe(new StringOutputParser());

    let fullContent = '';
    try {
      const stream = await chain.stream({
        ragContext: ragContext || '暂无历史优化记录',
        jobName: job.jobName,
        companyName: job.companyName,
        salary: String(job.salary),
        requirements: job.requirements || '未填写',
        responsibilities: job.responsibilities || '未填写',
        attractiveness: job.attractiveness || '未填写',
        resumeContent: resume.content,
      });

      for await (const chunk of stream) {
        fullContent += chunk;
        this.sendSSE(res, 'token', { token: chunk });
      }

      // 6. 保存结果 + 嵌入
      const embedding = await this.embedText(fullContent);
      await this.prisma.resumeOptimization.update({
        where: { id: record.id },
        data: {
          optimizedText: fullContent,
          embedding: embedding ? JSON.stringify(embedding) : null,
        },
      });

      this.sendSSE(res, 'complete', { recordId: record.id });
    } catch (error) {
      if (fullContent) {
        await this.prisma.resumeOptimization.update({
          where: { id: record.id },
          data: { optimizedText: fullContent + '\n\n[生成中断]' },
        });
      }
      this.sendSSE(res, 'error', { message: 'AI 服务异常，请稍后重试' });
    }

    res.end();
  }

  // RAG：检索历史优化范例
  private async buildRagContext(
    job: { requirements?: string | null; responsibilities?: string | null },
    userId: string,
  ) {
    const pastRecords = await this.prisma.resumeOptimization.findMany({
      where: { userId, embedding: { not: null } },
      select: { optimizedText: true, embedding: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    if (pastRecords.length === 0) return '';

    const query = [job.requirements, job.responsibilities].filter(Boolean).join(' ');
    if (!query.trim()) return '';

    try {
      const apiKey = this.configService.get<string>('dashscope.apiKey');
      const baseURL = this.configService.get<string>('dashscope.baseURL');
      const qEmbed = await this.embed(query, apiKey!, baseURL!);

      const scored = pastRecords.map((r) => {
        const emb = r.embedding ? JSON.parse(r.embedding) : [];
        return { text: r.optimizedText!.slice(0, 500), score: this.cosineSim(qEmbed, emb) };
      });

      scored.sort((a, b) => b.score - a.score);
      return scored
        .slice(0, 3)
        .map((s, i) => `### 范例${i + 1}\n${s.text}...`)
        .join('\n\n');
    } catch {
      return '';
    }
  }

  // Embedding API
  private async embed(text: string, apiKey: string, baseURL: string): Promise<number[]> {
    const res = await fetch(`${baseURL}/embeddings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-v1', input: [text] }),
    });
    const json: any = await res.json();
    return json.data?.[0]?.embedding ?? [];
  }

  private async embedText(text: string): Promise<number[] | null> {
    try {
      const apiKey = this.configService.get<string>('dashscope.apiKey');
      const baseURL = this.configService.get<string>('dashscope.baseURL');
      return await this.embed(text.slice(0, 2000), apiKey!, baseURL!);
    } catch {
      return null;
    }
  }

  private cosineSim(a: number[], b: number[]): number {
    if (a.length === 0 || b.length === 0) return 0;
    let dot = 0, na = 0, nb = 0;
    for (let i = 0; i < a.length; i++) {
      dot += a[i] * b[i];
      na += a[i] * a[i];
      nb += b[i] * b[i];
    }
    return na === 0 || nb === 0 ? 0 : dot / (Math.sqrt(na) * Math.sqrt(nb));
  }

  private sendSSE(res: Response, event: string, data: Record<string, unknown>) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }
}
