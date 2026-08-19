import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { AuthService } from "./auth.service.js";
import { PrismaService } from "./prisma.service.js";

const app = await NestFactory.createApplicationContext(AppModule);
const prisma = app.get(PrismaService);
const auth = app.get(AuthService);
const email = process.env.SEED_ADMIN_EMAIL;
const password = process.env.SEED_ADMIN_PASSWORD;
if (!email || !password) throw new Error("SEED_ADMIN_EMAIL und SEED_ADMIN_PASSWORD sind erforderlich");
const existing = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });
if (!existing) await prisma.user.create({ data: { email: email.toLowerCase(), displayName: "Administrator", role: "ADMIN", passwordHash: await auth.hashPassword(password) } });
await app.close();
