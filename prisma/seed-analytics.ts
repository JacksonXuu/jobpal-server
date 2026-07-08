import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const users = await p.user.findMany({ where: { role: 'user' } });
  const userIds = users.map(u => u.id);
  if (userIds.length < 3) {
    console.log('用户太少，看到 UV 没波动，建议多创建几个用户');
  }

  const modules = ['resume', 'job', 'optimize', 'ask', 'interview', 'auth'];
  const actions = ['submit_create', 'submit_edit', 'delete', 'search', 'view_detail', 'start_optimize', 'change_status'];
  const events: any[] = [];

  for (let daysAgo = 0; daysAgo < 30; daysAgo++) {
    // 每天的 UV 随机 1-8
    const uvToday = Math.min(Math.floor(Math.random() * 8) + 1, userIds.length);
    // 选择 uvToday 个用户
    const shuffled = [...userIds].sort(() => Math.random() - 0.5);
    const activeUsers = shuffled.slice(0, uvToday);
    // 每个活跃用户产生 2-6 个事件
    const totalEvents = activeUsers.length * (Math.floor(Math.random() * 5) + 2);

    for (let i = 0; i < totalEvents; i++) {
      const userId = activeUsers[i % activeUsers.length];
      const mod = modules[Math.floor(Math.random() * modules.length)];
      const eventType = Math.random() > 0.4 ? 'page_enter' : 'action';
      const hour = 8 + Math.floor(Math.random() * 14);
      const minute = Math.floor(Math.random() * 60);

      const date = new Date();
      date.setDate(date.getDate() - daysAgo);
      date.setHours(hour, minute, Math.floor(Math.random() * 60));

      events.push({
        userId,
        sessionId: `fake-${daysAgo}-${i}`,
        eventType,
        module: mod,
        page: `pages/${mod}/index`,
        action: eventType === 'action' ? actions[Math.floor(Math.random() * actions.length)] : null,
        platform: 'h5',
        createdAt: date,
      });
    }
  }

  const result = await p.analyticsEvent.createMany({ data: events });
  console.log(`插入 ${result.count} 条数据（30 天，${userIds.length} 个用户）`);
  await p.$disconnect();
}

main();
