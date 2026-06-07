import { Body, Controller, Get, Post } from '@nestjs/common'
import { StoresService } from './stores.service'
import { CreateStoreDto } from './dto/create-store.dto'

@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Get()
  findAll() {
    return this.storesService.findAll()
  }

  @Post()
  create(@Body() dto: CreateStoreDto) {
    return this.storesService.create(dto)
  }
}