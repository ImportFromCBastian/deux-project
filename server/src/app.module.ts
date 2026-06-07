import { Module } from '@nestjs/common'
import { OcrModule } from './ocr/ocr.module'
import { StoresModule } from './stores/stores.module'

@Module({
  imports: [OcrModule, StoresModule],
})
export class AppModule {}