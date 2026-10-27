import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { projectController } from "./project.controller";
import { projectValidation } from "./project.validation";

const router = Router();

const allRoles = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER];

router.post(
	"/",
	auth(...allRoles),
	validateRequest(projectValidation.CreateProjectZodSchema),
	projectController.createProject,
);
router.get("/", auth(...allRoles), projectController.getProjects);
router.get("/:id", auth(...allRoles), projectController.getProjectById);
router.patch(
	"/:id",
	auth(...allRoles),
	validateRequest(projectValidation.UpdateProjectZodSchema),
	projectController.updateProject,
);
router.delete("/:id", auth(...allRoles), projectController.deleteProject);

export const ProjectRoutes = router;
