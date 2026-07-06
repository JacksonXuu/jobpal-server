import { Controller, Get, Post, Delete, Body, Param, Query } from '@nestjs/common';
import { OptimizeService } from './optimize.service';
import { OptimizeDto } from './dto/optimize.dto';
import { BatchDeleteDto } from './dto/batch-delete.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('optimize')
export class OptimizeController {
  constructor(private readonly optimizeService: OptimizeService) {}

  // 创建优化任务（立即返回，后台生成）
  @Post()
  optimize(@Body() dto: OptimizeDto, @CurrentUser() user: { id: string }) {
    return this.optimizeService.optimize(dto, user.id);
  }

  // 批量删除（必须在 :id 之前）
  @Delete('batch')
  batchDelete(@Body() dto: BatchDeleteDto, @CurrentUser() user: { id: string }) {
    return this.optimizeService.batchDelete(dto.ids, user.id);
  }

  // 优化历史
  @Get('history')
  getHistory(
    @Query('keyword') keyword: string | undefined,
    @CurrentUser() user: { id: string },
  ) {
    return this.optimizeService.getHistory(user.id, keyword);
  }

  // 优化详情
  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.optimizeService.findOne(id, user.id);
  }
}
