import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { commentServices } from "./comment.service";

const createComment = catchAsync(async (req: Request, res: Response) => {
	const result = await commentServices.createComment(req.body, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Comment added successfully",
		data: result,
	});
});

const getCommentsByTask = catchAsync(async (req: Request, res: Response) => {
	const result = await commentServices.getCommentsByTask(
		req.params.taskId as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Comments fetched successfully",
		data: result,
	});
});

const updateComment = catchAsync(async (req: Request, res: Response) => {
	const result = await commentServices.updateComment(
		req.params.id as string,
		req.body.content,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Comment updated successfully",
		data: result,
	});
});

const deleteComment = catchAsync(async (req: Request, res: Response) => {
	await commentServices.deleteComment(req.params.id as string, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Comment deleted successfully",
		data: null,
	});
});

export const commentController = {
	createComment,
	getCommentsByTask,
	updateComment,
	deleteComment,
};
