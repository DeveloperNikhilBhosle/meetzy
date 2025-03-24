import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);


  // Setup Swagger
  const options = new DocumentBuilder()
    .setTitle('MeetZy API')   // Set the title for your API docs
    .setDescription('<b>"Effortless scheduling for every meeting."</b> \n\n MeetZy is dedicated to simplifying the way people manage their meetings, whether virtual, in-person, or for callback requests. We make scheduling seamless, efficient, and stress-free.')  // Set the description of the API
    .setVersion('1.0')             // API version
    .build();

  const document = SwaggerModule.createDocument(app, options);
  SwaggerModule.setup('api', app, document); // 'api' is the endpoint for the Swagger UI


  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
