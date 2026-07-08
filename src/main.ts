import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 允许跨域：sendBeacon 会携带 credentials，
  // 不能使用 * 通配符，必须反射请求 origin
  app.enableCors({
    origin: true,        // 反射请求的 Origin 头
    credentials: true,   // 允许 credentials
  });

  // 全局路径前缀
  app.setGlobalPrefix('v1');

  // 全局参数校验管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,          // 自动剔除 DTO 未定义的字段
      forbidNonWhitelisted: true, // 遇到未定义字段直接报错
      transform: true,           // 自动转换类型（如字符串 → 数字）
    }),
  );

  // 全局响应格式拦截器
  app.useGlobalInterceptors(new TransformInterceptor());

  // 全局异常过滤器
  app.useGlobalFilters(new HttpExceptionFilter());

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
