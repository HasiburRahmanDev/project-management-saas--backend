import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { attachmentUpload } from "../../lib/multer";
import { auth } from "../../middleware/checkAuth";
import { attachmentController } from "./attachment.controller";

const router = Router();

const allRoles = [Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER];

router.post(
	"/task/:taskId",
	auth(...allRoles),
	attachmentUpload.single("file"),
	attachmentController.uploadAttachment,
);
router.get(
	"/task/:taskId",
	auth(...allRoles),
	attachmentController.getAttachmentsByTask,
);
router.delete("/:id", auth(...allRoles), attachmentController.deleteAttachment);

export const AttachmentRoutes = router;
