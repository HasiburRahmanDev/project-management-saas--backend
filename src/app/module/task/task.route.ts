import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { taskController } from "./task.controller";
import { taskValidation } from "./task.validation";

const router = Router();

const allRoles = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER];

router.post(
	"/",
	auth(...allRoles),
	validateRequest(taskValidation.CreateTaskZodSchema),
	taskController.createTask,
);
router.get("/", auth(...allRoles), taskController.getTasks);
router.get("/my-tasks", auth(...allRoles), taskController.getMyTasks);
router.get("/:id", auth(...allRoles), taskController.getTaskById);
router.patch(
	"/:id",
	auth(...allRoles),
	validateRequest(taskValidation.UpdateTaskZodSchema),
	taskController.updateTask,
);
router.patch(
	"/:id/status",
	auth(...allRoles),
	validateRequest(taskValidation.UpdateTaskStatusZodSchema),
	taskController.updateTaskStatus,
);
router.delete("/:id", auth(...allRoles), taskController.deleteTask);

export const TaskRoutes = router;
