import { IsString, IsIn, IsOptional } from 'class-validator';

export class QueryJobDto {
  @IsString()
  @IsOptional()
  keyword?: string;

  @IsString()
  @IsIn(['待投递', '已投递', '待面试', '面试中', '面试结果待反馈', '面试通过', '面试失败', '已归档'], {
    message: '状态值无效',
  })
  @IsOptional()
  status?: string;

  @IsString()
  @IsIn(['招聘平台', '朋友推荐', '官网'], { message: '来源平台无效' })
  @IsOptional()
  sourcePlatform?: string;

  @IsString()
  @IsIn(['updatedAt', 'salary', 'rating'], { message: '排序字段无效' })
  @IsOptional()
  sortBy?: string;

  @IsString()
  @IsIn(['asc', 'desc'], { message: '排序方向只能是 asc 或 desc' })
  @IsOptional()
  sortOrder?: string;
}
