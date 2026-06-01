import { BadRequestException, Controller, Post, UploadedFile, UseInterceptors } from '@nestjs/common'
import { FileInterceptor } from '@nestjs/platform-express'
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger'
import 'multer'
import { FileUploadDto } from './dto/file-upload.dto'
import { OcrResultDto } from './dto/ocr-result.dto'
import { OcrService } from './ocr.service'

@ApiTags('OCR - Escáner de Etiquetas')
@Controller('ocr')
export class OcrController {
	constructor(private readonly ocrService: OcrService) {}

	@Post('extract')
	@UseInterceptors(FileInterceptor('file'))
	@ApiOperation({
		summary: 'Extraer texto de empaques',
		description:
			'Envía una imagen binaria de la etiqueta de un producto para que el microservicio de Python procese los bloques de texto.',
	})
	@ApiConsumes('multipart/form-data')
	@ApiBody({
		description: 'Archivo de imagen a procesar',
		type: FileUploadDto,
	})
	@ApiResponse({
		status: 200,
		description: 'La imagen fue procesada con éxito y se extrajeron las palabras.',
		type: OcrResultDto,
	})
	@ApiResponse({ status: 400, description: 'El archivo enviado no es válido o está corrupto.' })
	@ApiResponse({ status: 500, description: 'Error de conexión con el microservicio de IA.' })
	async extractText(@UploadedFile() file: Express.Multer.File): Promise<OcrResultDto> {
		if (!file) {
			throw new BadRequestException('No se recibió ningún archivo en el campo "file"')
		}
		return await this.ocrService.extractText(file.buffer, file.originalname)
	}
}
