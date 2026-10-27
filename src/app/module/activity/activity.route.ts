import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { activityController } from "./activity.controller";

const router = Router();

const allRoles = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER];

router.get("/me", auth(...allRoles), activityController.getMyActivities);
router.get(
	"/task/:taskId",
	auth(...allRoles),
	activityController.getTaskActivities,
);
router.get(
	"/project/:projectId",
	auth(...allRoles),
	activityController.getProjectActivities,
);

export const ActivityRoutes = router;
