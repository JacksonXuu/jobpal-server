import { Controller, Get, Post, Put, Delete, Body, Param, Query } from '@nestjs/common';
import { ResumeService } from './resume.service';
import { CreateResumeDto } from './dto/create-resume.dto';
import { UpdateResumeDto } from './dto/update-resume.dto';
import { QueryResumeDto } from './dto/query-resume.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('resumes')
export class ResumeController {
  constructor(private readonly resumeService: ResumeService) {}

  // 创建简历
  @Post()
  create(@Body() dto: CreateResumeDto, @CurrentUser() user: { id: string }) {
    return this.resumeService.create(dto, user.id);
  }

  // 简历列表
  @Get()
  findAll(@Query() query: QueryResumeDto, @CurrentUser() user: { id: string }) {
    return this.resumeService.findAll(query, user.id);
  }

  // 简历详情
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.resumeService.findOne(id, user.id);
  }

  // 编辑简历
  @Put(':id')
  update(@Param('id') id: string, @Body() dto: UpdateResumeDto, @CurrentUser() user: { id: string }) {
    return this.resumeService.update(id, dto, user.id);
  }

  // 删除简历
  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.resumeService.remove(id, user.id);
  }
}
