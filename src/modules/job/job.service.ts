import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';

@Injectable()
export class JobService {
  constructor(private readonly prisma: PrismaService) {}

  // 创建心动岗位
  async create(dto: CreateJobDto, userId: string) {
    return this.prisma.jobPosition.create({
      data: { ...dto, userId },
    });
  }

  // 列表：过滤 + 排序，不分页，返回全部
  async findAll(query: QueryJobDto, userId: string) {
    const { keyword, status, sourcePlatform, sortBy = 'updatedAt', sortOrder = 'desc' } = query;

    // 构建过滤条件
    const where: any = { userId };

    if (keyword) {
      where.OR = [
        { jobName: { contains: keyword } },
        { companyName: { contains: keyword } },
      ];
    }
    if (status) where.status = status;
    if (sourcePlatform) where.sourcePlatform = sourcePlatform;

    // 构建排序
    const orderBy: any = { [sortBy]: sortOrder };

    const [list, total] = await Promise.all([
      this.prisma.jobPosition.findMany({ where, orderBy }),
      this.prisma.jobPosition.count({ where }),
    ]);

    return { list, total };
  }

  // 岗位详情（含归属校验）
  async findOne(id: string, userId: string) {
    const job = await this.prisma.jobPosition.findFirst({
      where: { id, userId },
    });
    if (!job) {
      throw new NotFoundException('岗位不存在');
    }
    return job;
  }

  // 编辑岗位（含归属校验）
  async update(id: string, dto: UpdateJobDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.jobPosition.update({
      where: { id },
      data: dto,
    });
  }

  // 快捷更新状态（含归属校验）
  async updateStatus(id: string, dto: UpdateJobStatusDto, userId: string) {
    await this.findOne(id, userId);
    return this.prisma.jobPosition.update({
      where: { id },
      data: { status: dto.status },
    });
  }

  // 批量删除岗位
  async batchDelete(ids: string[], userId: string) {
    const result = await this.prisma.jobPosition.deleteMany({
      where: { id: { in: ids }, userId },
    });
    return { message: `已删除 ${result.count} 条记录` };
  }

  // 删除岗位（含归属校验）
  async remove(id: string, userId: string) {
    await this.findOne(id, userId);
    await this.prisma.jobPosition.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
