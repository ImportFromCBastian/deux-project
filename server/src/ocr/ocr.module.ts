import { Module } from '@nestjs/common'
import { AnmatService } from './anmat.service'
import { OcrController } from './ocr.controller'
import { OcrService } from './ocr.service'

@Module({
	controllers: [OcrController],
	providers: [OcrService, AnmatService],
})
export class OcrModule {}
