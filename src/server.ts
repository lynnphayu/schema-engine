import { app } from "./app";
import { env } from "./config/env";
import { logger } from "./config/logger";
import { appRuntime } from "./layers/live";

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

logger.info({ port: server.port, env: env.NODE_ENV }, "Server started");

const shutdown = () => {
  void appRuntime.dispose().finally(() => {
    process.exit(0);
  });
};

process.once("SIGINT", shutdown);
process.once("SIGTERM", shutdown);
