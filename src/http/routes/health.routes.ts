import { type Request, type Response, Router } from "express";

const router: Router = Router();

router.get("/", (_req: Request, res: Response) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    service: "schema-engine",
  });
});

export { router as healthRoutes };
