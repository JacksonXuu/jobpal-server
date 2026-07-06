import { Module } from '@nestjs/common';
import { OptimizeController } from './optimize.controller';
import { OptimizeService } from './optimize.service';

@Module({
  controllers: [OptimizeController],
  providers: [OptimizeService],
})
export class OptimizeModule {}
