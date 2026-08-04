import { Router } from "express";
import authRoutes from "./auth.routes.js";
import collectionScheduleRoutes from "./collectionSchedule.routes.js";
import pickupRequestRoutes from "./pickupRequest.routes.js";
import rewardRoutes from "./reward.routes.js";

const router = Router();

router.use(authRoutes);
router.use(collectionScheduleRoutes);
router.use(pickupRequestRoutes);
router.use(rewardRoutes);

export default router;
