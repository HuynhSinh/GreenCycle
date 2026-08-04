import { Router } from "express";
import authRoutes from "./auth.routes.js";
import collectionScheduleRoutes from "./collectionSchedule.routes.js";
import driverRoutes from "./driver.routes.js";
import rewardRoutes from "./reward.routes.js";

const router = Router();

router.use(authRoutes);
router.use(collectionScheduleRoutes);
router.use(driverRoutes);
router.use(rewardRoutes);

export default router;
