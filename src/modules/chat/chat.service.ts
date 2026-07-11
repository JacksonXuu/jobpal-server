import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';
import { ChatPromptTemplate, MessagesPlaceholder } from '@langchain/core/prompts';
import { ChatOpenAI } from '@langchain/openai';
import { StringOutputParser } from '@langchain/core/output_parsers';
import { AIMessage, HumanMessage } from '@langchain/core/messages';
import type { Response } from 'express';

// 面试相关状态
const INTERVIEW_STATUSES = ['待面试', '面试中', '面试结果待反馈', '面试通过', '面试失败'];

const SYSTEM_PROMPT = `你是 JobPal 求职助手的 AI 助手。你掌握用户的全部求职数据，包括简历、心动岗位、面试进度和备注。

## 用户画像
- 共有 {resumeCount} 份简历
- 共有 {jobCount} 个心仪岗位，其中 {interviewCount} 个已进入面试流程

## 与当前问题相关的数据
{ragContext}

## 回答规则
1. 基于用户的真实数据回答，不编造信息
2. 引用具体数据（如岗位名、公司名、面试状态、简历内容）
3. 如果用户数据不足以回答，诚实说明
4. 回答简洁有条理，使用 Markdown 格式
5. 用中文回答`;

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);
  private llm: ChatOpenAI;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.llm = new ChatOpenAI({
      modelName: this.configService.get<string>('dashscope.model', 'qwen-plus'),
      temperature: 0.7,
      streaming: true,
      apiKey: this.configService.get<string>('dashscope.apiKey'),
      configuration: {
        baseURL: this.configService.get<string>('dashscope.baseURL'),
      },
    });
  }

  // 对话列表
  async getConversations(userId: string) {
    const [list, total] = await Promise.all([
      this.prisma.conversation.findMany({
        where: { userId },
        select: { id: true, title: true, createdAt: true, updatedAt: true },
        orderBy: { updatedAt: 'desc' },
      }),
      this.prisma.conversation.count({ where: { userId } }),
    ]);
    return { list, total };
  }

  // 对话详情
  async getConversation(id: string, userId: string) {
    const conversation = await this.prisma.conversation.findFirst({
      where: { id, userId },
      select: { id: true, title: true, createdAt: true },
    });
    if (!conversation) throw new NotFoundException('对话不存在');

    const messages = await this.prisma.chatMessage.findMany({
      where: { conversationId: id },
      select: { id: true, role: true, content: true, createdAt: true },
      orderBy: { createdAt: 'asc' },
    });

    return { conversation, messages };
  }

  // 删除对话
  async deleteConversation(id: string, userId: string) {
    const conv = await this.prisma.conversation.findFirst({ where: { id, userId } });
    if (!conv) throw new NotFoundException('对话不存在');
    await this.prisma.conversation.delete({ where: { id } });
    return { message: '删除成功' };
  }

  // 发送消息（SSE 流式回答）
  async sendMessage(dto: SendMessageDto, userId: string, res: Response) {
    // 1. 确定对话
    let conversationId = dto.conversationId;
    if (conversationId) {
      const conv = await this.prisma.conversation.findFirst({
        where: { id: conversationId, userId },
      });
      if (!conv) throw new NotFoundException('对话不存在');
    } else {
      const conv = await this.prisma.conversation.create({
        data: {
          userId,
          title: dto.message.slice(0, 30) + (dto.message.length > 30 ? '...' : ''),
        },
      });
      conversationId = conv.id;
    }

    // 2. 保存用户消息
    await this.prisma.chatMessage.create({
      data: { conversationId, role: 'user', content: dto.message },
    });

    // 3. 每日限制检查：每个用户每天最多 3 个问题
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await this.prisma.chatMessage.count({
      where: {
        conversation: { userId },
        role: 'user',
        createdAt: { gte: today },
      },
    });
    const limitReached = todayCount > 3;

    // 4. 设置 SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');

    // 5. 每日限制：超出时直接返回提示，不调用 AI
    if (limitReached) {
      const tip = '您今日的提问次数已达上限（3次），请明天再来哦~';
      const assistantMsg = await this.prisma.chatMessage.create({
        data: { conversationId, role: 'assistant', content: tip },
      });
      this.sendSSE(res, 'start', { conversationId, messageId: assistantMsg.id });
      this.sendSSE(res, 'token', { token: tip });
      this.sendSSE(res, 'complete', { conversationId, messageId: assistantMsg.id });
      res.end();
      return;
    }

    // 6. 收集用户资产 + RAG 检索
    const { resumeCount, jobCount, interviewCount, ragContext } =
      await this.buildRagContext(dto.message, userId);

    // 5. 加载对话历史
    const historyMessages = await this.prisma.chatMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      take: 10, // 最近 10 条
    });
    // 去掉最后一条（刚存的用户消息），避免重复
    const history = historyMessages.slice(0, -1).map((m) =>
      m.role === 'user'
        ? new HumanMessage(m.content)
        : new AIMessage(m.content),
    );

    // 6. 发送 start 事件
    const assistantMsg = await this.prisma.chatMessage.create({
      data: { conversationId, role: 'assistant', content: '' },
    });
    this.sendSSE(res, 'start', { conversationId, messageId: assistantMsg.id });

    // 7. 构建 Prompt + LangChain 流式执行
    const prompt = ChatPromptTemplate.fromMessages([
      ['system', SYSTEM_PROMPT],
      new MessagesPlaceholder('history'),
      ['user', '{question}'],
    ]);

    const chain = prompt.pipe(this.llm).pipe(new StringOutputParser());

    let fullContent = '';
    try {
      const stream = await chain.stream({
        resumeCount,
        jobCount,
        interviewCount,
        ragContext: ragContext || '暂无与当前问题高度相关的数据，请根据用户画像和对话历史回答',
        question: dto.message,
        history,
      });

      for await (const chunk of stream) {
        fullContent += chunk;
        this.sendSSE(res, 'token', { token: chunk });
      }

      // 8. 更新助手消息
      await this.prisma.chatMessage.update({
        where: { id: assistantMsg.id },
        data: { content: fullContent },
      });

      // 9. 更新对话时间
      await this.prisma.conversation.update({
        where: { id: conversationId },
        data: { updatedAt: new Date() },
      });

      this.sendSSE(res, 'complete', { conversationId, messageId: assistantMsg.id });
    } catch (error) {
      // 保存已生成的部分内容
      if (fullContent) {
        await this.prisma.chatMessage.update({
          where: { id: assistantMsg.id },
          data: { content: fullContent + '\n\n[生成中断]' },
        });
      }
      this.logger.error(
        `SSE 流式生成失败 (userId=${userId}, conversationId=${conversationId})`,
        error instanceof Error ? error.stack : error,
      );
      this.sendSSE(res, 'error', { message: 'AI 服务异常，请稍后重试' });
    }

    res.end();
  }

  // RAG：向量检索用户资产
  private async buildRagContext(question: string, userId: string) {
    // 收集资产
    const [resumes, jobs] = await Promise.all([
      this.prisma.resume.findMany({
        where: { userId },
        select: { title: true, content: true },
      }),
      this.prisma.jobPosition.findMany({
        where: { userId, status: { not: '已归档' } },
        select: {
          jobName: true,
          companyName: true,
          status: true,
          requirements: true,
          responsibilities: true,
          attractiveness: true,
          remark: true,
        },
      }),
    ]);

    const resumeCount = resumes.length;
    const jobCount = jobs.length;
    const interviewCount = jobs.filter((j) => INTERVIEW_STATUSES.includes(j.status)).length;

    // 构建文档片段
    const documents: string[] = [];
    for (const r of resumes) {
      documents.push(`[简历] ${r.title}\n${r.content}`);
    }
    for (const j of jobs) {
      const statusLabel = INTERVIEW_STATUSES.includes(j.status) ? `[${j.status}]` : '';
      const parts = [`[岗位${statusLabel}] ${j.jobName} - ${j.companyName}`];
      if (j.requirements) parts.push(`要求：${j.requirements}`);
      if (j.responsibilities) parts.push(`职责：${j.responsibilities}`);
      if (j.attractiveness) parts.push(`吸引力：${j.attractiveness}`);
      if (j.remark) parts.push(`备注：${j.remark}`);
      documents.push(parts.join('\n'));
    }

    // 嵌入 + 语义检索
    const topDocs = await this.semanticSearch(question, documents);

    // 额外补充：全部岗位的状态汇总（确保 LLM 知道全局分布）
    const statusSummary = jobs.length > 0
      ? jobs.map((j) => `- [${j.status}] ${j.jobName} - ${j.companyName}`).join('\n')
      : '暂无岗位';

    const ragContext = [
      '## 全量岗位状态汇总',
      statusSummary,
      '',
      '## 语义检索到的相关内容（Top-' + Math.min(5, topDocs.length) + '）',
      ...topDocs,
    ].join('\n');

    return { resumeCount, jobCount, interviewCount, ragContext };
  }

  // 语义向量检索
  private async semanticSearch(question: string, documents: string[]) {
    if (documents.length === 0) return [];

    try {
      const apiKey = this.configService.get<string>('dashscope.apiKey');
      const baseURL = this.configService.get<string>('dashscope.baseURL');

      // 获取 question 的 embedding
      const qEmbed = await this.embed(question, apiKey!, baseURL!);

      // 获取所有 documents 的 embeddings（批量）
      const dEmbeds = await this.embedMany(documents, apiKey!, baseURL!);

      // 计算余弦相似度
      const scored = dEmbeds.map((emb, i) => ({
        doc: documents[i],
        score: this.cosineSim(qEmbed, emb),
      }));

      scored.sort((a, b) => b.score - a.score);
      return scored.slice(0, 5).map((s) => s.doc);
    } catch {
      // embedding 失败时降级为关键词匹配
      return this.keywordSearch(question, documents).slice(0, 5);
    }
  }

  // 调用百炼 Embedding API（单条）
  private async embed(text: string, apiKey: string, baseURL: string): Promise<number[]> {
    const url = `${baseURL}/embeddings`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-v1', input: [text] }),
    });
    const json: any = await res.json();
    return json.data?.[0]?.embedding ?? [];
  }

  // 调用百炼 Embedding API（批量）
  private async embedMany(texts: string[], apiKey: string, baseURL: string): Promise<number[][]> {
    const url = `${baseURL}/embeddings`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: 'text-embedding-v1', input: texts }),
    });
    const json: any = await res.json();
    return (json.data ?? []).map((d: any) => d.embedding ?? []);
  }

  // 余弦相似度
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

  // 降级：关键词匹配
  private keywordSearch(question: string, documents: string[]): string[] {
    const keywords = question.split(/[\s,，。？?！!]+/).filter((k) => k.length > 1);
    const scored = documents.map((doc) => {
      let score = 0;
      for (const kw of keywords) {
        if (doc.includes(kw)) score++;
      }
      return { doc, score };
    });
    scored.sort((a, b) => b.score - a.score);
    return scored.filter((s) => s.score > 0).map((s) => s.doc);
  }

  // 写入 SSE 事件
  private sendSSE(res: Response, event: string, data: Record<string, unknown>) {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  }

  // 智能推荐提问
  async getSuggestions(userId: string) {
    const [resumes, jobs] = await Promise.all([
      this.prisma.resume.findMany({ where: { userId }, select: { title: true } }),
      this.prisma.jobPosition.findMany({
        where: { userId, status: { not: '已归档' } },
        select: { jobName: true, companyName: true, status: true },
      }),
    ]);

    const statusCounts: Record<string, number> = {};
    for (const j of jobs) {
      statusCounts[j.status] = (statusCounts[j.status] || 0) + 1;
    }

    const prompt = `用户当前求职数据：
- ${resumes.length} 份简历
- ${jobs.length} 个心仪岗位
- 状态分布：${JSON.stringify(statusCounts)}

请基于以上数据，生成 3~5 条用户可能想问的个性化提问建议。
要求：
1. 问题围绕用户的真实数据展开
2. 涉及面试准备、求职策略、简历优化、岗位分析等方向
3. 问题口语化，像用户自己会问的
4. 纯 JSON 数组返回，不要其他内容

示例格式：["帮我分析目前的求职短板","接下来一周怎么安排面试？"]`;

    try {
      const llm = new ChatOpenAI({
        modelName: 'qwen-turbo',
        temperature: 0.8,
        apiKey: this.configService.get<string>('dashscope.apiKey'),
        configuration: {
          baseURL: this.configService.get<string>('dashscope.baseURL'),
        },
      });

      const response = await llm.invoke(prompt);
      const text = typeof response.content === 'string' ? response.content : '';

      // 解析 JSON 数组
      try {
        const suggestions = JSON.parse(text);
        return { suggestions: Array.isArray(suggestions) ? suggestions : [] };
      } catch {
        // 解析失败则按行分割
        const lines = text
          .replace(/^\[|\]$/g, '')
          .split(/[,\n]/)
          .map((s) => s.replace(/^["']|["']$/g, '').trim())
          .filter((s) => s.length > 2);
        return { suggestions: lines.slice(0, 5) };
      }
    } catch (error) {
      this.logger.error(
        `建议生成失败 (userId=${userId}, resumes=${resumes.length}, jobs=${jobs.length})`,
        error instanceof Error ? error.stack : error,
      );
      return { suggestions: [] };
    }
  }
}
