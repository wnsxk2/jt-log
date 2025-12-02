import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  // 모듈이 초기화될 때 DB 연결
  async onModuleInit() {
    console.log('PrismaService onModuleInit');
    await this.$connect();
  }

  // 모듈이 파괴될 때(서버 종료 시) 연결 해제
  async onModuleDestroy() {
    console.log('PrismaService onModuleDestroy');
    await this.$disconnect();
  }
}
