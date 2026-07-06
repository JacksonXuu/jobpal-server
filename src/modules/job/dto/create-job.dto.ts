import { IsString, IsNotEmpty, IsNumber, IsInt, Min, Max, IsIn, IsOptional } from 'class-validator';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty({ message: '岗位名称不能为空' })
  jobName: string;

  @IsString()
  @IsNotEmpty({ message: '公司名称不能为空' })
  companyName: string;

  @IsNumber({}, { message: '薪资必须是数字' })
  @Min(1, { message: '薪资最小为 1k' })
  @Max(100, { message: '薪资最大为 100k' })
  salary: number;

  @IsString()
  @IsOptional()
  requirements?: string;

  @IsString()
  @IsOptional()
  responsibilities?: string;

  @IsString()
  @IsOptional()
  attractiveness?: string;

  @IsInt({ message: '心动等级必须是整数' })
  @Min(1, { message: '心动等级最小为 1' })
  @Max(5, { message: '心动等级最大为 5' })
  @IsOptional()
  rating?: number;

  @IsString()
  @IsIn(['招聘平台', '朋友推荐', '官网'], { message: '来源平台无效' })
  @IsOptional()
  sourcePlatform?: string;

  @IsString()
  @IsIn(['待投递', '已投递', '待面试', '面试中', '面试结果待反馈', '面试通过', '面试失败', '已归档'], {
    message: '状态值无效',
  })
  @IsOptional()
  status?: string;

  @IsString()
  @IsOptional()
  remark?: string;
}
