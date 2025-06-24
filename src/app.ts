import { json } from "body-parser";
import express, { type Express } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./http/middleware/error.middleware";
import { routes } from "./http/routes";

const app: Express = express();

// Middleware
app.use(json());

// Routes
app.use("/", routes);

// 404 handler for unmatched routes (must be before error handler)
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

export { app };
