import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { QueryOverviewDto } from './dto/query-overview.dto';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 全局行为数据概览（管理员视角，跨所有用户聚合）
   */
  async getOverview(query: QueryOverviewDto) {
    const { startDate, endDate } = query;

    const dateFilter: any = {};
    if (startDate) dateFilter.gte = new Date(startDate);
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      dateFilter.lte = end;
    }

    const where: any = { module: { not: 'home' } };
    if (Object.keys(dateFilter).length > 0) {
      where.createdAt = dateFilter;
    }

    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayWhere = { ...where, createdAt: { ...where.createdAt, gte: todayStart } };

    const [
      totalUsers,
      todayEvents,
      todayActiveUsers,
      moduleUsage,
      avgDurations,
      topActions,
      dailyTrendRaw,
    ] = await Promise.all([
      // 总注册用户数
      this.prisma.user.count(),

      // 今日事件总数
      this.prisma.analyticsEvent.count({ where: todayWhere }),

      // 今日活跃用户数
      this.prisma.analyticsEvent.groupBy({
        by: ['userId'],
        where: todayWhere,
      }).then(rows => rows.length),

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

      // 高频操作 Top 10
      this.prisma.analyticsEvent.groupBy({
        by: ['module', 'action'],
        where: {
          ...where,
          eventType: { in: ['action', 'click'] },
          action: { not: null },
        },
        _count: { id: true },
        orderBy: { _count: { id: 'desc' } },
        take: 10,
      }),

      // 日活跃趋势（按日聚合 PV + UV）
      this.prisma.$queryRawUnsafe<Array<{ date: string; pv: bigint; uv: bigint }>>(
        `SELECT
           DATE(createdAt) as date,
           COUNT(*) as pv,
           COUNT(DISTINCT userId) as uv
         FROM analytics_events
         WHERE module != 'home'
           ${startDate ? 'AND createdAt >= ?' : ''}
           ${endDate ? 'AND createdAt <= ?' : ''}
         GROUP BY DATE(createdAt)
         ORDER BY date ASC`,
        ...(startDate ? [new Date(startDate)] : []),
        ...(endDate ? [new Date(new Date(endDate).setHours(23, 59, 59, 999))] : []),
      ),
    ]);

    // 最热模块
    const topModule = moduleUsage[0]?.module || '暂无数据';

    return {
      totalUsers,
      todayEvents,
      todayActiveUsers,
      topModule,
      moduleUsage: moduleUsage.map(m => ({ module: m.module, count: m._count.id })),
      avgDurations: this.toRecord(avgDurations, 'module', r => Math.round(r._avg.duration || 0)),
      topActions: topActions.map(a => ({
        module: a.module,
        action: a.action!,
        count: a._count.id,
      })),
      dailyTrend: dailyTrendRaw.map(d => ({
        date: d.date,
        pv: Number(d.pv),
        uv: Number(d.uv),
      })),
    };
  }

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

  async getUsers(keyword?: string) {
    const where: any = {
      role: { not: 'admin' }, // 不显示管理员账户
    };

    if (keyword) {
      where.username = { contains: keyword };
    }

    const [list, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          role: true,
          status: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return { list, total };
  }

  async updateUserStatus(id: string, dto: UpdateUserStatusDto) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return this.prisma.user.update({
      where: { id },
      data: { status: dto.status },
      select: {
        id: true,
        username: true,
        role: true,
        status: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteUser(id: string) {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    await this.prisma.user.delete({ where: { id } });
    return { message: '删除成功' };
  }
}
