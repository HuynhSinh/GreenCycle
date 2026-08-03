import { Router } from "express";
import authRoutes from "./auth.routes.js";
import collectionScheduleRoutes from "./collectionSchedule.routes.js";

const router = Router();

router.use(authRoutes);
router.use(collectionScheduleRoutes);

export default router;
