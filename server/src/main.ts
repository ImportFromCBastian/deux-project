import { NestFactory } from '@nestjs/core'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'
import * as express from 'express'
import { AppModule } from './app.module'

async function bootstrap() {
	const app = await NestFactory.create(AppModule)

	app.enableCors({
		origin: '*',
	})

	// Aumentar el límite para imágenes de alta resolución
	app.use(express.json({ limit: '50mb' }))
	app.use(express.urlencoded({ limit: '50mb', extended: true }))

	const config = new DocumentBuilder()
		.setTitle('CeliAPP API')
		.setDescription('API for CeliAPP')
		.setVersion('1.0')
		.addTag('celiapp')
		.build()
	const documentFactory = () => SwaggerModule.createDocument(app, config)
	SwaggerModule.setup('docs', app, documentFactory())

	await app.listen(process.env.PORT ?? 3001)
}
bootstrap()
