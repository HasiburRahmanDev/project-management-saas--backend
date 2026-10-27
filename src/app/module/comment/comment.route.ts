import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { commentController } from "./comment.controller";
import { commentValidation } from "./comment.validation";

const router = Router();

const allRoles = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER];

router.post(
	"/",
	auth(...allRoles),
	validateRequest(commentValidation.CreateCommentZodSchema),
	commentController.createComment,
);
router.get(
	"/task/:taskId",
	auth(...allRoles),
	commentController.getCommentsByTask,
);
router.patch(
	"/:id",
	auth(...allRoles),
	validateRequest(commentValidation.UpdateCommentZodSchema),
	commentController.updateComment,
);
router.delete("/:id", auth(...allRoles), commentController.deleteComment);

export const CommentRoutes = router;
