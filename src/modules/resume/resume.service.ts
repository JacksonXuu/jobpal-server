import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { QueryResumeDto } from './dto/query-resume.dto';

@Injectable()
export class ResumeService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建简历
  async create(dto: CreateResumeDto, userId: string) {
    return this.prisma.resume.create({
      data: { ...dto, userId },
    });
  }

  // 简历列表：搜索 + 排序，全部返回
  async findAll(query: QueryResumeDto, userId: string) {
    const { keyword, sortBy = 'updatedAt', sortOrder = 'desc' } = query;

    const where: any = { userId };

    if (keyword) {
      where.title = { contains: keyword };
    }

    const orderBy: any = { [sortBy]: sortOrder };

    const [list, total] = await Promise.all([
      this.prisma.resume.findMany({ where, orderBy }),
      this.prisma.resume.count({ where }),
    ]);

    return { list, total };
  }

  // 简历详情（含归属校验）
  async findOne(id: string, userId: string) {
    const resume = await this.prisma.resume.findFirst({
      where: { id, userId },
    });
    if (!resume) {
      throw new NotFoundException('简历不存在');
    }
    return resume;
  }

  // 编辑简历（含归属校验）
  async update(id: string, dto: UpdateResumeDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.resume.update({
      where: { id },
      data: dto,
    });
  }

  // 删除简历（含归属校验）
  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.resume.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
