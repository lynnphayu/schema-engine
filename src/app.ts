import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import {
  errorHandler,
  notFoundHandler,
} from "./http/middleware/error.middleware";
import { routes } from "./http/routes";

const app = new Hono();

// Global middleware
app.use("*", logger());
app.use("*", cors());

// Routes
app.route("/", routes);

// Error handlers
app.notFound((c) => notFoundHandler(c));
app.onError((err, c) => errorHandler(err, c));

export { app };
