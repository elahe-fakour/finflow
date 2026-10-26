import { NestFactory } from "@nestjs/core";
import { configureApp, configureNotFoundHandler } from "./app.config.js";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableShutdownHooks(["SIGINT", "SIGTERM"]);
  configureApp(app);
  await app.init();
  configureNotFoundHandler(app);
  await app.listen(process.env.PORT ?? 3001);
}
await bootstrap();
