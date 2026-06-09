import { Injectable, OnModuleInit } from '@nestjs/common'
import { PrismaClient } from '@prisma/client'

const globalForPrisma = global as unknown as { prisma: PrismaClient }

const prisma = globalForPrisma.prisma || new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma

@Injectable()
export class PrismaService implements OnModuleInit {
  private client = prisma

  async onModuleInit() {
    await this.client.$connect()
  }

  get store() {
    return this.client.store
  }
}