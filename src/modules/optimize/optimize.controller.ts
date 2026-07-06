import { Controller, Get, Post, Body, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { OptimizeService } from './optimize.service';
import { OptimizeDto } from './dto/optimize.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('optimize')
export class OptimizeController {
  constructor(private readonly optimizeService: OptimizeService) {}

  // SSE 流式优化
  @Post()
  optimize(
    @Body() dto: OptimizeDto,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    return this.optimizeService.optimize(dto, user.id, res);
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
