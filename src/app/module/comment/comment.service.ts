import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { assertTaskAccess, isPlatformAdmin } from "../../utils/access";
import { logActivity } from "../../utils/activity";
import type { TCreateComment } from "./comment.validation";

const userSelect = { select: { id: true, name: true, imageUrl: true } };

const getOwnCommentOrThrow = async (id: string, user: RequestUser) => {
	const comment = await prisma.comment.findUnique({ where: { id } });
	if (!comment) {
		throw new AppError(httpStatus.NOT_FOUND, "Comment not found");
	}
	if (comment.userId !== user.userId && !isPlatformAdmin(user)) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You can only modify your own comments",
		);
	}
	return comment;
};

const createComment = async (payload: TCreateComment, user: RequestUser) => {
	await assertTaskAccess(payload.taskId, user);
	const comment = await prisma.comment.create({
		data: { ...payload, userId: user.userId },
		include: { user: userSelect },
	});
	await logActivity("added a comment", user.userId, payload.taskId);
	return comment;
};

const getCommentsByTask = async (taskId: string, user: RequestUser) => {
	await assertTaskAccess(taskId, user);
	return prisma.comment.findMany({
		where: { taskId },
		include: { user: userSelect },
		orderBy: { createdAt: "asc" },
	});
};

const updateComment = async (
	id: string,
	content: string,
	user: RequestUser,
) => {
	await getOwnCommentOrThrow(id, user);
	return prisma.comment.update({
		where: { id },
		data: { content },
		include: { user: userSelect },
	});
};

const deleteComment = async (id: string, user: RequestUser) => {
	await getOwnCommentOrThrow(id, user);
	return prisma.comment.delete({ where: { id } });
};

export const commentServices = {
	createComment,
	getCommentsByTask,
	updateComment,
	deleteComment,
};
