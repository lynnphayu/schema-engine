import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "./config/logger";
import {
  errorHandler,
  notFoundHandler,
} from "./http/middleware/error.middleware";
import { routes } from "./http/routes";

const app = new Hono();

app.use("*", cors());

app.use("*", async (c, next) => {
  const start = Date.now();
  await next();
  logger.info({
    method: c.req.method,
    path: c.req.path,
    status: c.res.status,
    duration: `${Date.now() - start}ms`,
  });
});

app.route("/", routes);

app.notFound((c) => notFoundHandler(c));
app.onError((err, c) => errorHandler(err, c));

export { app };
