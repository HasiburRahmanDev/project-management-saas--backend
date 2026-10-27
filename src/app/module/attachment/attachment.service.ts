import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { cloudinary } from "../../lib/cloudinary";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import {
	assertProjectAccess,
	assertTaskAccess,
	isPlatformAdmin,
} from "../../utils/access";
import { logActivity } from "../../utils/activity";
import { uploadBufferToCloudinary } from "../../utils/uploadToCloudinary";

const uploadAttachment = async (
	taskId: string,
	file: Express.Multer.File,
	user: RequestUser,
) => {
	await assertTaskAccess(taskId, user);
	const result = await uploadBufferToCloudinary(
		file.buffer,
		"task-attachments",
	);
	const attachment = await prisma.attachment.create({
		data: {
			taskId,
			url: result.secure_url,
			publicId: result.public_id,
			fileName: file.originalname,
			uploadedById: user.userId,
		},
	});
	await logActivity(`attached "${file.originalname}"`, user.userId, taskId);
	return attachment;
};

const getAttachmentsByTask = async (taskId: string, user: RequestUser) => {
	await assertTaskAccess(taskId, user);
	return prisma.attachment.findMany({
		where: { taskId },
		include: { uploadedBy: { select: { id: true, name: true } } },
		orderBy: { createdAt: "desc" },
	});
};

// uploader, team lead, org owner or platform admin can delete
const deleteAttachment = async (id: string, user: RequestUser) => {
	const attachment = await prisma.attachment.findUnique({
		where: { id },
		include: { task: { select: { projectId: true } } },
	});
	if (!attachment) {
		throw new AppError(httpStatus.NOT_FOUND, "Attachment not found");
	}
	if (attachment.uploadedById !== user.userId && !isPlatformAdmin(user)) {
		await assertProjectAccess(attachment.task.projectId, user, true);
	}
	await prisma.attachment.delete({ where: { id } });
	if (attachment.publicId) {
		cloudinary.uploader
			.destroy(attachment.publicId)
			.catch((error) => console.log("Failed to delete attachment file", error));
	}
	await logActivity(
		`removed attachment "${attachment.fileName}"`,
		user.userId,
		attachment.taskId,
	);
};

export const attachmentServices = {
	uploadAttachment,
	getAttachmentsByTask,
	deleteAttachment,
};
