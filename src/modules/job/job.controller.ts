import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { JobService } from './job.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
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

  // 编辑岗位
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateJobDto, @CurrentUser() user: { id: string }) {
    return this.jobService.update(id, dto, user.id);
  }

  // 删除岗位
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.jobService.remove(id, user.id);
  }
}
