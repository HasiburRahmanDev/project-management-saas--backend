import { TaskStatus } from "../../../generated/prisma/enums";
import type { Prisma } from "../../../generated/prisma/client";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import {
	accessibleProjectsFilter,
	assertProjectAccess,
	assertTeamAccess,
} from "../../utils/access";
import {
	buildMeta,
	getPagination,
	type IPaginationQuery,
} from "../../utils/paginate";
import type { TCreateProject, TUpdateProject } from "./project.validation";

interface IProjectQuery extends IPaginationQuery {
	teamId?: string;
	organizationId?: string;
	searchTerm?: string;
}

const createProject = async (payload: TCreateProject, user: RequestUser) => {
	const team = await assertTeamAccess(payload.teamId, user, true);
	return prisma.project.create({
		data: { ...payload, organizationId: team.organizationId },
	});
};

const getProjects = async (query: IProjectQuery, user: RequestUser) => {
	const { page, limit, skip, sortBy, sortOrder } = getPagination(query, [
		"createdAt",
		"updatedAt",
		"name",
	]);

	const where: Prisma.ProjectWhereInput = {
		AND: [
			accessibleProjectsFilter(user),
			query.teamId ? { teamId: query.teamId } : {},
			query.organizationId ? { organizationId: query.organizationId } : {},
			query.searchTerm
				? { name: { contains: query.searchTerm, mode: "insensitive" } }
				: {},
		],
	};

	const [data, total] = await prisma.$transaction([
		prisma.project.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
			include: {
				team: { select: { id: true, name: true } },
				_count: { select: { tasks: true, sprints: true } },
			},
		}),
		prisma.project.count({ where }),
	]);

	return { data, meta: buildMeta(page, limit, total) };
};

const getProjectById = async (id: string, user: RequestUser) => {
	await assertProjectAccess(id, user);
	const [project, taskStats] = await Promise.all([
		prisma.project.findUnique({
			where: { id },
			include: {
				team: { select: { id: true, name: true, organizationId: true } },
				sprints: { orderBy: { createdAt: "desc" } },
			},
		}),
		prisma.task.groupBy({
			by: ["status"],
			where: { projectId: id },
			_count: { _all: true },
		}),
	]);

	// e.g. { TODO: 3, IN_PROGRESS: 1, REVIEW: 0, DONE: 5 }
	const taskCountByStatus = Object.fromEntries(
		Object.values(TaskStatus).map((status) => [
			status,
			taskStats.find((stat) => stat.status === status)?._count._all ?? 0,
		]),
	);

	return { ...project, taskCountByStatus };
};

const updateProject = async (
	id: string,
	payload: TUpdateProject,
	user: RequestUser,
) => {
	await assertProjectAccess(id, user, true);
	return prisma.project.update({ where: { id }, data: payload });
};

const deleteProject = async (id: string, user: RequestUser) => {
	await assertProjectAccess(id, user, true);
	return prisma.project.delete({ where: { id } });
};

export const projectServices = {
	createProject,
	getProjects,
	getProjectById,
	updateProject,
	deleteProject,
};
