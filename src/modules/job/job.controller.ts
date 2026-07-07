import { Controller, Get, Post, Put, Patch, Delete, Body, Param, Query } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { UpdateJobStatusDto } from './dto/update-job-status.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';
import { QueryJobDto } from './dto/query-job.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('jobs')
export class JobController {
  constructor(private readonly jobService: JobService) {}

  // 创建心动岗位
  @Post()
  create(@Body() dto: CreateJobDto, @CurrentUser() user: { id: string }) {
    return this.jobService.create(dto, user.id);
  }

  // 岗位列表
  @Get()
  findAll(@Query() query: QueryJobDto, @CurrentUser() user: { id: string }) {
    return this.jobService.findAll(query, user.id);
  }

  // 岗位详情
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.jobService.findOne(id, user.id);
  }

  // 快捷更新状态
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateJobStatusDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.jobService.updateStatus(id, dto, user.id);
  }

  // 编辑岗位
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto, @CurrentUser() user: { id: string }) {
    return this.jobService.update(id, dto, user.id);
  }

  // 批量删除岗位（必须在 :id 之前）
  @Delete('batch')
  batchDelete(@Body() dto: BatchDeleteDto, @CurrentUser() user: { id: string }) {
    return this.jobService.batchDelete(dto.ids, user.id);
  }

  // 删除岗位
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.jobService.remove(id, user.id);
  }
}
