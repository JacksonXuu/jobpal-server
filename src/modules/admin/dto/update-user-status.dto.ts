import { IsString, IsIn } from 'class-validator';

export class UpdateUserStatusDto {
  @IsString()
  @IsIn(['active', 'disabled'], { message: '状态值只能是 active 或 disabled' })
  status: string;
}
