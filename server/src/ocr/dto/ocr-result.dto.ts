import { ApiProperty } from '@nestjs/swagger'

class OcrProduct {
	@ApiProperty({ example: 'Coca Cola 1.5L' })
	text: string

	@ApiProperty({ type: [Number], example: [100, 200, 300, 400], description: '[x1, y1, x2, y2]' })
	box: number[]

	@ApiProperty({ example: 0.95 })
	confidence: number

	@ApiProperty({
		example: true,
		description: 'Indica si el producto fue validado por ANMAT como Sin TACC',
	})
	isApto?: boolean

	@ApiProperty({ example: 'VIGENTE', description: 'Estado del registro en ANMAT' })
	anmatDetails?: string

	@ApiProperty({ example: '12345678' })
	rnpa?: string

	@ApiProperty({ example: 'SANCOR' })
	brand?: string

	@ApiProperty({ example: 'LECHE ENTERA' })
	description?: string

	@ApiProperty({ example: 85 })
	score?: number
}

export class OcrResultDto {
	@ApiProperty({
		type: [OcrProduct],
		description: 'Productos detectados con su texto y ubicación espacial',
	})
	products: OcrProduct[]
}
