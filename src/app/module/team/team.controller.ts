import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { teamServices } from "./team.service";

const createTeam = catchAsync(async (req: Request, res: Response) => {
	const result = await teamServices.createTeam(req.body, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Team created successfully",
		data: result,
	});
});

const getTeams = catchAsync(async (req: Request, res: Response) => {
	const result = await teamServices.getTeams(
		{ organizationId: req.query.organizationId as string | undefined },
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Teams fetched successfully",
		data: result,
	});
});

const getTeamById = catchAsync(async (req: Request, res: Response) => {
	const result = await teamServices.getTeamById(
		req.params.id as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Team fetched successfully",
		data: result,
	});
});

const updateTeam = catchAsync(async (req: Request, res: Response) => {
	const result = await teamServices.updateTeam(
		req.params.id as string,
		req.body,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Team updated successfully",
		data: result,
	});
});

const deleteTeam = catchAsync(async (req: Request, res: Response) => {
	await teamServices.deleteTeam(req.params.id as string, req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Team deleted successfully",
		data: null,
	});
});

const addMember = catchAsync(async (req: Request, res: Response) => {
	const result = await teamServices.addMember(
		req.params.id as string,
		req.body,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Member added successfully",
		data: result,
	});
});

const updateMemberRole = catchAsync(async (req: Request, res: Response) => {
	const result = await teamServices.updateMemberRole(
		req.params.id as string,
		req.params.userId as string,
		req.body,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Member role updated successfully",
		data: result,
	});
});

const removeMember = catchAsync(async (req: Request, res: Response) => {
	await teamServices.removeMember(
		req.params.id as string,
		req.params.userId as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Member removed successfully",
		data: null,
	});
});

export const teamController = {
	createTeam,
	getTeams,
	getTeamById,
	updateTeam,
	deleteTeam,
	addMember,
	updateMemberRole,
	removeMember,
};
