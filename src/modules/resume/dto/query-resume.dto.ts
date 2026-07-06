import { IsString, IsIn, IsOptional } from 'class-validator';

export class QueryResumeDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsString()
  @IsIn(['updatedAt', 'title'], { message: '排序字段无效' })
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsIn(['asc', 'desc'], { message: '排序方向只能是 asc 或 desc' })
  @IsOptional()
  sortOrder?: string;
}
