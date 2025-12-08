import { app } from "./app";
import { env } from "./config/env";
import "./di/container"; // Initialize DI container

const server = Bun.serve({
  port: env.PORT,
  fetch: app.fetch,
});

console.log(`🚀 Schema Engine server is running on port ${server.port}`);
console.log(`📊 Health check: http://localhost:${server.port}/health`);
console.log(`🔧 Environment: ${env.NODE_ENV}`);
