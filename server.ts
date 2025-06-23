import express, { type ErrorRequestHandler } from "express";
import { json } from "body-parser";
import drizzleUtil from "./drizzle-port";
import fsPort from "./fs-port";

const app = express();
const port = process.env.PORT || 3000;

app.use(json());

app.get("/health", (_req, res) => {
  res.json({ status: "healthy" });
});

// Set up view engine
const expectionHandler: ErrorRequestHandler = (
  err: Error,
  _req,
  res,
  _next
) => {
  res.status(500);
  res.json({ error: err, success: false });
};

app.use(expectionHandler);

// app.post("/schema/validate", async (req, res) => {
//   const { userID } = req.body;
//   const drizzleArtifactsDir = "drizzle";
//   const outputDir = `${drizzleArtifactsDir}/${userID}`;
//   const cfg = await drizzleUtil.generateCfg(drizzleArtifactsDir, userID);
//   const cfgPath = await fsPort.write(
//     outputDir,
//     "config.json",
//     `${JSON.stringify(cfg, null, 2)}`
//   );
//   await drizzleUtil.pull(cfgPath);
//   await drizzleUtil.validate(cfgPath);
//   await res.json({ success: true });
// });

// Schema generation endpoint
app.post("/schema/generate", async (req, res) => {
  const { userID, schema } = req.body;

  if (!userID || !schema) {
    res
      .status(400)
      .json({ error: "Missing required fields: userID and schema" });
  }

  // Create output directory
  const drizzleArtifactsDir = "drizzle";
  const outputDir = `${drizzleArtifactsDir}/${userID}`;

  // Generate and write Drizzle schema

  const cfg = await drizzleUtil.generateCfg(drizzleArtifactsDir, userID);
  const cfgPath = await fsPort.write(
    outputDir,
    "config.json",
    `${JSON.stringify(cfg, null, 2)}`
  );
  await drizzleUtil.pull(cfgPath);

  const drizzleSchema = drizzleUtil.jsonToDrizzle(schema);
  await fsPort.write(outputDir, "schema.ts", drizzleSchema);
  await drizzleUtil.drizzleToSQL(cfgPath);

  await drizzleUtil.migrate(cfgPath);
  await fsPort.delete(outputDir);
  res.status(200).json({
    message: `Successfully generated and applied schema migrations for user ${userID}`,
  });
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
