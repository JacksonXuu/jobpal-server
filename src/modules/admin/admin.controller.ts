import { Controller, Get, Put, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { AdminService } from './admin.service';
import { UpdateUserStatusDto } from './dto/update-user-status.dto';
import { QueryOverviewDto } from './dto/query-overview.dto';
import { AdminAuthGuard } from '../../common/guards/admin-auth.guard';

@Controller('admin')
@UseGuards(AdminAuthGuard)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  /** 全局行为数据概览 */
  @Get('analytics/overview')
  getOverview(@Query() query: QueryOverviewDto) {
    return this.adminService.getOverview(query);
  }

  @Get('users')
  getUsers(@Query('keyword') keyword?: string) {
    return this.adminService.getUsers(keyword);
  }

  @Put('users/:id/status')
  updateUserStatus(@Param('id') id: string, @Body() dto: UpdateUserStatusDto) {
    return this.adminService.updateUserStatus(id, dto);
  }

  @Delete('users/:id')
  deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }
}
