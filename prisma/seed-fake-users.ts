import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const p = new PrismaClient();

async function main() {
  const passwordHash = await bcrypt.hash('123456', 10);
  const users = [
    '张三', '李四', '王五', '赵六', '陈七', '周八', '求职小白', 'offer收割机', '应届阿明', '老码农',
  ];

  for (let i = 0; i < users.length; i++) {
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 30));

    await p.user.upsert({
      where: { username: users[i] },
      update: {},
      create: {
        username: users[i],
        passwordHash,
        role: 'user',
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  console.log(`创建/确认 ${users.length} 个测试用户，密码均为 123456`);
  await p.$disconnect();
}

main();
