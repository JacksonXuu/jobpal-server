import { IsString, IsIn } from 'class-validator';

export class UpdateJobStatusDto {
  @IsString()
  @IsIn(['待投递', '已投递', '待面试', '面试中', '面试结果待反馈', '面试通过', '面试失败', '已归档'], {
    message: '状态值无效',
  })
  status: string;
}
