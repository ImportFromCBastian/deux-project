import { Injectable } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateStoreDto } from './dto/create-store.dto'

@Injectable()
export class StoresService {
  constructor(private prisma: PrismaService) {}

  findAll() {
    return this.prisma.store.findMany({ orderBy: { createdAt: 'desc' } })
  }

  create(dto: CreateStoreDto) {
    return this.prisma.store.create({ data: dto })
  }
}