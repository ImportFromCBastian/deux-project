import { ApiProperty } from '@nestjs/swagger'

export class OcrResultDto {
	@ApiProperty({
		type: [String],
		description:
			'Arreglo de palabras normalizadas detectadas por el motor de inteligencia artificial (EasyOCR)',
		example: ['TAKIS', 'FUEGO', 'EXCESO', 'SODIO', 'CONTIENE', 'CONSERVANTES'],
	})
	words: Array<string> | undefined
}
