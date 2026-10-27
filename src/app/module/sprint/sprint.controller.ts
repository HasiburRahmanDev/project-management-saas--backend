import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { sprintServices } from "./sprint.service";

const createSprint = catchAsync(async (req: Request, res: Response) => {
	const result = await sprintServices.createSprint(req.body, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Sprint created successfully",
		data: result,
	});
});

const getSprintsByProject = catchAsync(async (req: Request, res: Response) => {
	const result = await sprintServices.getSprintsByProject(
		req.query.projectId as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Sprints fetched successfully",
		data: result,
	});
});

const getSprintById = catchAsync(async (req: Request, res: Response) => {
	const result = await sprintServices.getSprintById(
		req.params.id as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Sprint fetched successfully",
		data: result,
	});
});

const updateSprint = catchAsync(async (req: Request, res: Response) => {
	const result = await sprintServices.updateSprint(
		req.params.id as string,
		req.body,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Sprint updated successfully",
		data: result,
	});
});

const deleteSprint = catchAsync(async (req: Request, res: Response) => {
	await sprintServices.deleteSprint(req.params.id as string, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Sprint deleted successfully",
		data: null,
	});
});

export const sprintController = {
	createSprint,
	getSprintsByProject,
	getSprintById,
	updateSprint,
	deleteSprint,
};
