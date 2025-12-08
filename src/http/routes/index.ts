import { Hono } from "hono";
import { healthRoutes } from "./health.routes";
import { schemaRoutes } from "./schema.routes";

const routes = new Hono();

routes.route("/health", healthRoutes);
routes.route("/schema", schemaRoutes);

export { routes };
