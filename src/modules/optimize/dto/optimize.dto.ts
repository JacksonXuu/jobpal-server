import { IsString, IsNotEmpty } from 'class-validator';

export class OptimizeDto {
  @IsString()
  @IsNotEmpty({ message: '简历ID不能为空' })
  resumeId: string;

  @IsString()
  @IsNotEmpty({ message: '岗位ID不能为空' })
  jobPositionId: string;
}
