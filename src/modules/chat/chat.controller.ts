import { Controller, Get, Post, Delete, Body, Param, Query, Res } from '@nestjs/common';
import type { Response } from 'express';
import { ChatService } from './chat.service';
import { SendMessageDto } from './dto/send-message.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  // 发送消息（SSE 流式）
  @Post()
  sendMessage(
    @Body() dto: SendMessageDto,
    @CurrentUser() user: { id: string },
    @Res() res: Response,
  ) {
    return this.chatService.sendMessage(dto, user.id, res);
  }

  // 智能推荐提问（注意：必须在 conversations/:id 之前，否则 suggestions 会被当作 :id）
  @Get('suggestions')
  getSuggestions(@CurrentUser() user: { id: string }) {
    return this.chatService.getSuggestions(user.id);
  }

  // 对话列表
  @Get('conversations')
  getConversations(@CurrentUser() user: { id: string }) {
    return this.chatService.getConversations(user.id);
  }

  // 对话详情
  @Get('conversations/:id')
  getConversation(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.chatService.getConversation(id, user.id);
  }

  // 删除对话
  @Delete('conversations/:id')
  deleteConversation(@Param('id') id: string, @CurrentUser() user: { id: string }) {
    return this.chatService.deleteConversation(id, user.id);
  }
}
