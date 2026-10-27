import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { activityServices } from "./activity.service";

const getTaskActivities = catchAsync(async (req: Request, res: Response) => {
	const result = await activityServices.getTaskActivities(
		req.params.taskId as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Task activities fetched successfully",
		data: result,
	});
});

const getProjectActivities = catchAsync(async (req: Request, res: Response) => {
	const result = await activityServices.getProjectActivities(
		req.params.projectId as string,
		req.query as Record<string, string>,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Project activities fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getMyActivities = catchAsync(async (req: Request, res: Response) => {
	const result = await activityServices.getMyActivities(
		req.query as Record<string, string>,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My activities fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

export const activityController = {
	getTaskActivities,
	getProjectActivities,
	getMyActivities,
};
