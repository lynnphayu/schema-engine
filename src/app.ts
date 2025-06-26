import { json } from "body-parser";
import express, { type Express } from "express";
import {
  errorHandler,
  notFoundHandler,
} from "./http/middleware/error.middleware";
import { routes } from "./http/routes";

const app: Express = express();

app.use(json());
app.use("/", routes);
app.use(notFoundHandler);
app.use(errorHandler);

export { app };
