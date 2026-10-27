import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { projectServices } from "./project.service";

const createProject = catchAsync(async (req: Request, res: Response) => {
	const result = await projectServices.createProject(req.body, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Project created successfully",
		data: result,
	});
});

const getProjects = catchAsync(async (req: Request, res: Response) => {
	const result = await projectServices.getProjects(
		req.query as Record<string, string>,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Projects fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getProjectById = catchAsync(async (req: Request, res: Response) => {
	const result = await projectServices.getProjectById(
		req.params.id as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Project fetched successfully",
		data: result,
	});
});

const updateProject = catchAsync(async (req: Request, res: Response) => {
	const result = await projectServices.updateProject(
		req.params.id as string,
		req.body,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Project updated successfully",
		data: result,
	});
});

const deleteProject = catchAsync(async (req: Request, res: Response) => {
	await projectServices.deleteProject(req.params.id as string, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Project deleted successfully",
		data: null,
	});
});

export const projectController = {
	createProject,
	getProjects,
	getProjectById,
	updateProject,
	deleteProject,
};
