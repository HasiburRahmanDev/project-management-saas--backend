import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { assertProjectAccess } from "../../utils/access";
import type { TCreateSprint, TUpdateSprint } from "./sprint.validation";

const getSprintOrThrow = async (id: string) => {
	const sprint = await prisma.sprint.findUnique({ where: { id } });
	if (!sprint) {
		throw new AppError(httpStatus.NOT_FOUND, "Sprint not found");
	}
	return sprint;
};

const createSprint = async (payload: TCreateSprint, user: RequestUser) => {
	await assertProjectAccess(payload.projectId, user, true);
	return prisma.sprint.create({ data: payload });
};

const getSprintsByProject = async (projectId: string, user: RequestUser) => {
	if (!projectId) {
		throw new AppError(httpStatus.BAD_REQUEST, "projectId query is required");
	}
	await assertProjectAccess(projectId, user);
	return prisma.sprint.findMany({
		where: { projectId },
		include: { _count: { select: { tasks: true } } },
		orderBy: { createdAt: "desc" },
	});
};

const getSprintById = async (id: string, user: RequestUser) => {
	const sprint = await getSprintOrThrow(id);
	await assertProjectAccess(sprint.projectId, user);
	return prisma.sprint.findUnique({
		where: { id },
		include: {
			tasks: {
				include: {
					assignee: { select: { id: true, name: true, imageUrl: true } },
				},
				orderBy: { createdAt: "asc" },
			},
		},
	});
};

const updateSprint = async (
	id: string,
	payload: TUpdateSprint,
	user: RequestUser,
) => {
	const sprint = await getSprintOrThrow(id);
	await assertProjectAccess(sprint.projectId, user, true);
	return prisma.sprint.update({ where: { id }, data: payload });
};

// tasks in the sprint go back to the backlog (sprintId is set to null)
const deleteSprint = async (id: string, user: RequestUser) => {
	const sprint = await getSprintOrThrow(id);
	await assertProjectAccess(sprint.projectId, user, true);
	return prisma.sprint.delete({ where: { id } });
};

export const sprintServices = {
	createSprint,
	getSprintsByProject,
	getSprintById,
	updateSprint,
	deleteSprint,
};
