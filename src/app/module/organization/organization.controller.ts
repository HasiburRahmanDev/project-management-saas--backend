import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { organizationServices } from "./organization.service";

const createOrganization = catchAsync(async (req: Request, res: Response) => {
	const result = await organizationServices.createOrganization(
		req.body,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "Organization created successfully",
		data: result,
	});
});

const getMyOrganizations = catchAsync(async (req: Request, res: Response) => {
	const result = await organizationServices.getMyOrganizations(req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Organizations fetched successfully",
		data: result,
	});
});

const getOrganizationById = catchAsync(async (req: Request, res: Response) => {
	const result = await organizationServices.getOrganizationById(
		req.params.id as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Organization fetched successfully",
		data: result,
	});
});

const updateOrganization = catchAsync(async (req: Request, res: Response) => {
	const result = await organizationServices.updateOrganization(
		req.params.id as string,
		req.body,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Organization updated successfully",
		data: result,
	});
});

const deleteOrganization = catchAsync(async (req: Request, res: Response) => {
	await organizationServices.deleteOrganization(
		req.params.id as string,
		req.user!,
	);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "Organization deleted successfully",
		data: null,
	});
});

export const organizationController = {
	createOrganization,
	getMyOrganizations,
	getOrganizationById,
	updateOrganization,
	deleteOrganization,
};
