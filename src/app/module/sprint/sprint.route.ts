import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { sprintController } from "./sprint.controller";
import { sprintValidation } from "./sprint.validation";

const router = Router();

const allRoles = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER];

router.post(
	"/",
	auth(...allRoles),
	validateRequest(sprintValidation.CreateSprintZodSchema),
	sprintController.createSprint,
);
router.get("/", auth(...allRoles), sprintController.getSprintsByProject);
router.get("/:id", auth(...allRoles), sprintController.getSprintById);
router.patch(
	"/:id",
	auth(...allRoles),
	validateRequest(sprintValidation.UpdateSprintZodSchema),
	sprintController.updateSprint,
);
router.delete("/:id", auth(...allRoles), sprintController.deleteSprint);

export const SprintRoutes = router;
