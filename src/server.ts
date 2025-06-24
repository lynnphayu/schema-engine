import { app } from "./app";

const port = process.env.PORT || 3000;

app.listen(port, () => {
  console.log(`🚀 Schema Engine server is running on port ${port}`);
  console.log(`📊 Health check: http://localhost:${port}/health`);
  console.log(`🔧 Environment: ${process.env.NODE_ENV || "development"}`);
});
