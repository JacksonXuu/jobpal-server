import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateResumeDto {
  @IsString()
  @IsNotEmpty({ message: '简历标题不能为空' })
  title: string;

  @IsString()
  @IsNotEmpty({ message: '简历内容不能为空' })
  content: string;

  @IsString()
  @IsOptional()
  description?: string;
}
