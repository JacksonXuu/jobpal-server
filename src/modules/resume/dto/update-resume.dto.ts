import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class UpdateResumeDto {
  @IsString()
  @IsNotEmpty({ message: '简历标题不能为空' })
  @IsOptional()
  title?: string;

  @IsString()
  @IsNotEmpty({ message: '简历内容不能为空' })
  @IsOptional()
  content?: string;

  @IsString()
  @IsOptional()
  description?: string;
}
