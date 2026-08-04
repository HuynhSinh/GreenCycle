import { Router } from "express";
import authRoutes from "./auth.routes.js";
import collectionScheduleRoutes from "./collectionSchedule.routes.js";
import rewardRoutes from "./reward.routes.js";
import driverPickupsRoutes from "./driverPickups.routes.js";

const router = Router();

router.use(authRoutes);
router.use(collectionScheduleRoutes);
router.use(rewardRoutes);
router.use(driverPickupsRoutes);

export default router;
