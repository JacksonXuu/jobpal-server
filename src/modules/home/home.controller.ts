import { Controller, Get } from '@nestjs/common';
import { HomeService } from './home.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('home')
export class HomeController {
  constructor(private readonly homeService: HomeService) {}

  @Get('stats')
  getStats(@CurrentUser() user: { id: string }) {
    return this.homeService.getStats(user.id);
  }
}
