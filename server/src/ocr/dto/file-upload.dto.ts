import { ApiProperty } from '@nestjs/swagger'

export class FileUploadDto {
	@ApiProperty({
		type: 'string',
		format: 'binary',
		description: 'Imagen en alta calidad de la etiqueta frontal del producto (PNG, JPEG o WEBP)',
	})
	file: any
}
