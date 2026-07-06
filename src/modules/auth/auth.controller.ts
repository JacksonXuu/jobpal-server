import { Controller, Post, Delete, Body } from '@nestjs/common';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Public()
  @Post('login')
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('logout')
  logout(@CurrentUser() user: { id: string; username: string }) {
    void user;
    // TODO: 接入 Redis 后将 Token 加入黑名单
    return { message: '已退出登录' };
  }

  // 注销账号（删除账户及所有关联数据）
  @Delete('account')
  deleteAccount(@CurrentUser() user: { id: string }) {
    return this.authService.deleteAccount(user.id);
  }
}
