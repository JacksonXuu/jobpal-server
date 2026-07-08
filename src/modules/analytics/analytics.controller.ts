import { Controller, Post, Get, Body, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { BatchEventsDto } from './dto/batch-events.dto';
import { QueryStatsDto } from './dto/query-stats.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  /** 批量写入追踪事件（前端 sendBeacon 批量上报） */
  @Post('events')
  ingestBatch(
    @Body() dto: BatchEventsDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.analyticsService.ingestBatch(dto, user.id);
  }

  /** 查询用户行为统计 */
  @Get('stats')
  getStats(
    @Query() query: QueryStatsDto,
    @CurrentUser() user: { id: string },
  ) {
    return this.analyticsService.getStats(query, user.id);
  }
}
