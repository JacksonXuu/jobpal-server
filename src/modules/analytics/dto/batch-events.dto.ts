import { Type } from 'class-transformer';
import {
  IsArray,
  IsString,
  IsIn,
  IsInt,
  IsOptional,
  Min,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

const EVENT_TYPES = ['page_enter', 'page_leave', 'click', 'action', 'tab_switch'] as const;
const MODULES = [
  'home', 'ask', 'resume', 'job', 'optimize', 'interview',
  'profile', 'settings', 'about', 'auth',
] as const;

class TrackEventDto {
  @IsString()
  @IsIn(EVENT_TYPES, { message: '事件类型无效' })
  eventType: string;

  @IsString()
  @IsIn(MODULES, { message: '模块标识无效' })
  module: string;

  @IsString()
  page: string;

  @IsInt()
  @Min(0)
  timestamp: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  duration?: number;

  @IsString()
  @IsOptional()
  action?: string;
}

export class BatchEventsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TrackEventDto)
  @ArrayMinSize(1, { message: '至少需要 1 条事件' })
  events: TrackEventDto[];

  @IsString()
  sessionId: string;

  @IsString()
  platform: string;
}
