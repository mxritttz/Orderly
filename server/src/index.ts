import { buildApp } from "./app";
import { env } from "./config/env";

const bootstrap = async () => {
  const app = await buildApp();
  try {
    await app.listen({ host: env.API_HOST, port: env.API_PORT });
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
};

bootstrap();
