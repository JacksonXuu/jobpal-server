import { IsString, IsNotEmpty, IsOptional, MaxLength } from 'class-validator';

export class SendMessageDto {
  @IsString()
  @IsOptional()
  conversationId?: string;

  @IsString()
  @IsNotEmpty({ message: '消息不能为空' })
  @MaxLength(500, { message: '消息长度不能超过500字符' })
  message: string;
}
