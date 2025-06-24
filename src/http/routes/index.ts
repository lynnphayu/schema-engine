import { Router } from "express";
import { healthRoutes } from "./health.routes";
import { schemaRoutes } from "./schema.routes";

const router: Router = Router();

router.use("/health", healthRoutes);
router.use("/schema", schemaRoutes);

export { router as routes };
