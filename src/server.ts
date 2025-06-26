import { app } from "./app";

import { env } from "./config/env";

app.listen(env.PORT, () => {
  console.log(`🚀 Schema Engine server is running on port ${env.PORT}`);
  console.log(`📊 Health check: http://localhost:${env.PORT}/health`);
  console.log(`🔧 Environment: ${env.NODE_ENV}`);
});
