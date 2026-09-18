import "reflect-metadata";
import { ValidationPipe } from "@nestjs/common";
import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { AppModule } from "./app.module.js";
import cookieParser from "cookie-parser";
import { json, urlencoded } from "express";

const app = await NestFactory.create(AppModule, { bodyParser: false });
app.use(json({ limit: "8mb" }));
app.use(urlencoded({ extended: true, limit: "8mb" }));
app.use(cookieParser());
app.setGlobalPrefix("");
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
const config = new DocumentBuilder().setTitle("TIME2WIN Event API").setVersion("1.0").build();
SwaggerModule.setup("docs", app, SwaggerModule.createDocument(app, config));
await app.listen(Number(process.env.PORT ?? 3000), "0.0.0.0");
