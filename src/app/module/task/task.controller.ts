import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { taskServices } from "./task.service";

const createTask = catchAsync(async (req: Request, res: Response) => {
	const result = await taskServices.createTask(req.body, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Task created successfully",
		data: result,
	});
});

const getTasks = catchAsync(async (req: Request, res: Response) => {
	const result = await taskServices.getTasks(
		req.query as Record<string, never>,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Tasks fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getMyTasks = catchAsync(async (req: Request, res: Response) => {
	const result = await taskServices.getMyTasks(
		req.query as Record<string, never>,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "My tasks fetched successfully",
		data: result.data,
		meta: result.meta,
	});
});

const getTaskById = catchAsync(async (req: Request, res: Response) => {
	const result = await taskServices.getTaskById(
		req.params.id as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Task fetched successfully",
		data: result,
	});
});

const updateTask = catchAsync(async (req: Request, res: Response) => {
	const result = await taskServices.updateTask(
		req.params.id as string,
		req.body,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Task updated successfully",
		data: result,
	});
});

const updateTaskStatus = catchAsync(async (req: Request, res: Response) => {
	const result = await taskServices.updateTaskStatus(
		req.params.id as string,
		req.body.status,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Task status updated successfully",
		data: result,
	});
});

const deleteTask = catchAsync(async (req: Request, res: Response) => {
	await taskServices.deleteTask(req.params.id as string, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Task deleted successfully",
		data: null,
	});
});

export const taskController = {
	createTask,
	getTasks,
	getMyTasks,
	getTaskById,
	updateTask,
	updateTaskStatus,
	deleteTask,
};
