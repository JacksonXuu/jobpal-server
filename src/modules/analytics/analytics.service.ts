import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { BatchEventsDto } from './dto/batch-events.dto';
import { QueryStatsDto } from './dto/query-stats.dto';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * 批量写入追踪事件
   */
  async ingestBatch(dto: BatchEventsDto, userId: string) {
    const count = await this.prisma.analyticsEvent.createMany({
      data: dto.events.map((e) => ({
        userId,
        sessionId: dto.sessionId,
        eventType: e.eventType,
        module: e.module,
        page: e.page,
        action: e.action ?? null,
        duration: e.duration ?? null,
        platform: dto.platform,
      })),
    });

    this.logger.log(
      `写入 ${count.count} 条事件 (user=${userId}, session=${dto.sessionId})`,
    );

    return { received: count.count };
  }

  /**
   * 查询用户行为统计数据
   */
  async getStats(query: QueryStatsDto, userId: string) {
    const { startDate, endDate } = query;

    // 构建日期过滤条件
    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) dateFilter.lte = new Date(endDate);

    const where: any = { userId };
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    // 并行查询各维度数据
    const [
      pageViews,
      avgDurations,
      topActions,
      moduleFrequency,
      dailyActiveUsers,
    ] = await Promise.all([
      // 各模块页面访问量
      this.prisma.analyticsEvent.groupBy({
        by: ['module'],
        where: { ...where, eventType: 'page_enter' },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
      }),
      // 各模块平均停留时长
      this.prisma.analyticsEvent.groupBy({
        by: ['module'],
        where: { ...where, eventType: 'page_leave', duration: { not: null } },
        _avg: { duration: true },
      }),
      // 高频操作 Top 20
      this.prisma.analyticsEvent.groupBy({
        by: ['module', 'action'],
        where: {
          ...where,
          eventType: { in: ['action', 'click'] },
          action: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 20,
      }),
      // 模块使用频率
      this.prisma.analyticsEvent.groupBy({
        by: ['module'],
        where: { ...where, eventType: { not: 'page_leave' } },
        _count: { id: true },
      }),
      // DAU（日活跃用户数）
      this.prisma.$queryRawUnsafe<Array<{ date: string; count: bigint }>>(
        `SELECT
           DATE(createdAt) as date,
           COUNT(DISTINCT userId) as count
         FROM analytics_events
         WHERE userId = ?
           ${startDate ? 'AND createdAt >= ?' : ''}
           ${endDate ? 'AND createdAt <= ?' : ''}
         GROUP BY DATE(createdAt)
         ORDER BY date DESC
         LIMIT 30`,
        userId,
        ...(startDate ? [new Date(startDate)] : []),
        ...(endDate ? [new Date(endDate)] : []),
      ),
    ]);

    return {
      pageViews: this.toRecord(pageViews, 'module', r => r._count.id),
      avgDurations: this.toRecord(avgDurations, 'module', r => Math.round(r._avg.duration || 0)),
      topActions: topActions.map(a => ({
        module: a.module,
        action: a.action!,
        count: a._count.id,
      })),
      moduleFrequency: this.toRecord(moduleFrequency, 'module', r => r._count.id),
      dailyActiveUsers: (dailyActiveUsers as Array<{ date: string; count: bigint }>).map(d => ({
        date: d.date,
        count: Number(d.count),
      })),
    };
  }

  /** 将 groupBy 结果转换为 Record<string, number> */
  private toRecord(
    rows: Array<Record<string, any>>,
    keyField: string,
    valueFn: (row: any) => number,
  ): Record<string, number> {
    const result: Record<string, number> = {};
    for (const row of rows) {
      result[row[keyField]] = valueFn(row);
    }
    return result;
  }
}
