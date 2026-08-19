import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";

const app = await NestFactory.create(AppModule);
app.setGlobalPrefix("");
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
const config = new DocumentBuilder().setTitle("TIME2WIN Event API").setVersion("1.0").build();
SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
await app.listen(Number(process.env.PORT ?? 3000), "0.0.0.0");
