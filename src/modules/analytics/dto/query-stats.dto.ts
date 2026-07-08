import { IsOptional, IsDateString } from 'class-validator';

export class QueryStatsDto {
  @IsDateString({}, { message: 'startDate 格式无效' })
  @IsOptional()
  startDate?: string;

  @IsDateString({}, { message: 'endDate 格式无效' })
  @IsOptional()
  endDate?: string;
}
