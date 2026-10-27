import type { Request, Response } from "express";
import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { attachmentServices } from "./attachment.service";

const uploadAttachment = catchAsync(async (req: Request, res: Response) => {
	if (!req.file) {
		throw new AppError(httpStatus.BAD_REQUEST, "No file provided");
	}
	const result = await attachmentServices.uploadAttachment(
		req.params.taskId as string,
		req.file,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Attachment uploaded successfully",
		data: result,
	});
});

const getAttachmentsByTask = catchAsync(async (req: Request, res: Response) => {
	const result = await attachmentServices.getAttachmentsByTask(
		req.params.taskId as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Attachments fetched successfully",
		data: result,
	});
});

const deleteAttachment = catchAsync(async (req: Request, res: Response) => {
	await attachmentServices.deleteAttachment(req.params.id as string, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Attachment deleted successfully",
		data: null,
	});
});

export const attachmentController = {
	uploadAttachment,
	getAttachmentsByTask,
	deleteAttachment,
};
