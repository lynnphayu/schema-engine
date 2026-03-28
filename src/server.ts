import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import "./di/container";

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

logger.info({ port: server.port, env: env.NODE_ENV }, "Server started");
