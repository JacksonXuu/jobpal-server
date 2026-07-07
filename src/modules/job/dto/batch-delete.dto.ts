import { IsArray, IsString } from 'class-validator';

export class BatchDeleteDto {
  @IsArray({ message: 'ids 必须是数组' })
  @IsString({ each: true, message: '每个 id 必须是字符串' })
  ids: string[];
}
