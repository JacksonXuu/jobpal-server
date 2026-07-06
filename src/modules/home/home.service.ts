import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

// 面试相关状态：已进入面试流程的岗位
const INTERVIEW_STATUSES = ['待面试', '面试中', '面试结果待反馈', '面试通过', '面试失败'];

@Injectable()
export class HomeService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats(userId: string) {
    const [resumeCount, jobCount, interviewCount] = await Promise.all([
      this.prisma.resume.count({ where: { userId } }),
      this.prisma.jobPosition.count({ where: { userId } }),
      this.prisma.jobPosition.count({
        where: {
          userId,
          status: { in: INTERVIEW_STATUSES },
        },
      }),
    ]);

    return { resumeCount, jobCount, interviewCount };
  }
}
