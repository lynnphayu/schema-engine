import { Hono } from "hono";

const healthRoutes = new Hono();

healthRoutes.get("/", (c) => {
  return c.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "schema-engine",
  });
});

export { healthRoutes };
