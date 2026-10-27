import httpStatus from "http-status";
import type { Prisma } from "../../../generated/prisma/client";
import type { Priority, TaskStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import {
	accessibleProjectsFilter,
	assertProjectAccess,
	assertTaskAccess,
	isPlatformAdmin,
} from "../../utils/access";
import { logActivity } from "../../utils/activity";
import {
	buildMeta,
	getPagination,
	type IPaginationQuery,
} from "../../utils/paginate";
import type { TCreateTask, TUpdateTask } from "./task.validation";

interface ITaskQuery extends IPaginationQuery {
	projectId?: string;
	sprintId?: string;
	status?: TaskStatus;
	priority?: Priority;
	assigneeId?: string;
	searchTerm?: string;
}

const userSelect = {
	select: { id: true, name: true, email: true, imageUrl: true },
};

const taskSortFields = [
	"createdAt",
	"updatedAt",
	"dueDate",
	"priority",
	"status",
	"title",
];

// sprint must belong to the same project, assignee must be on the project's team
const validateTaskRelations = async (
	projectId: string,
	teamId: string,
	sprintId?: string | null,
	assigneeId?: string | null,
) => {
	if (sprintId) {
		const sprint = await prisma.sprint.findFirst({
			where: { id: sprintId, projectId },
		});
		if (!sprint) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Sprint does not belong to this project",
			);
		}
	}
	if (assigneeId) {
		const membership = await prisma.teamMember.findUnique({
			where: { teamId_userId: { teamId, userId: assigneeId } },
		});
		if (!membership) {
			throw new AppError(
				httpStatus.BAD_REQUEST,
				"Assignee must be a member of the project's team",
			);
		}
	}
};

const createTask = async (payload: TCreateTask, user: RequestUser) => {
	const project = await assertProjectAccess(payload.projectId, user);
	await validateTaskRelations(
		project.id,
		project.teamId,
		payload.sprintId,
		payload.assigneeId,
	);
	const task = await prisma.task.create({
		data: { ...payload, reporterId: user.userId },
		include: { assignee: userSelect, reporter: userSelect },
	});
	await logActivity(`created task "${task.title}"`, user.userId, task.id);
	return task;
};

const getTasks = async (query: ITaskQuery, user: RequestUser) => {
	const { page, limit, skip, sortBy, sortOrder } = getPagination(
		query,
		taskSortFields,
	);

	const where: Prisma.TaskWhereInput = {
		AND: [
			{ project: accessibleProjectsFilter(user) },
			query.projectId ? { projectId: query.projectId } : {},
			// sprintId=backlog returns tasks that are not in any sprint
			query.sprintId
				? { sprintId: query.sprintId === "backlog" ? null : query.sprintId }
				: {},
			query.status ? { status: query.status } : {},
			query.priority ? { priority: query.priority } : {},
			query.assigneeId ? { assigneeId: query.assigneeId } : {},
			query.searchTerm
				? {
						OR: [
							{ title: { contains: query.searchTerm, mode: "insensitive" } },
							{
								description: {
									contains: query.searchTerm,
									mode: "insensitive",
								},
							},
						],
					}
				: {},
		],
	};

	const [data, total] = await prisma.$transaction([
		prisma.task.findMany({
			where,
			skip,
			take: limit,
			orderBy: { [sortBy]: sortOrder },
			include: {
				assignee: userSelect,
				_count: { select: { comments: true, attachments: true } },
			},
		}),
		prisma.task.count({ where }),
	]);

	return { data, meta: buildMeta(page, limit, total) };
};

const getMyTasks = async (query: ITaskQuery, user: RequestUser) => {
	return getTasks({ ...query, assigneeId: user.userId }, user);
};

const getTaskById = async (id: string, user: RequestUser) => {
	await assertTaskAccess(id, user);
	return prisma.task.findUnique({
		where: { id },
		include: {
			project: { select: { id: true, name: true, teamId: true } },
			sprint: { select: { id: true, name: true } },
			assignee: userSelect,
			reporter: userSelect,
			comments: {
				include: { user: userSelect },
				orderBy: { createdAt: "asc" },
			},
			attachments: { orderBy: { createdAt: "desc" } },
			activities: {
				include: { user: userSelect },
				orderBy: { createdAt: "desc" },
				take: 20,
			},
		},
	});
};

const describeChanges = (
	before: Record<string, unknown>,
	payload: TUpdateTask,
) =>
	Object.entries(payload)
		.filter(([key, value]) => String(before[key] ?? "") !== String(value ?? ""))
		.map(
			([key, value]) =>
				`${key} to "${value instanceof Date ? value.toISOString() : (value ?? "none")}"`,
		);

const updateTask = async (
	id: string,
	payload: TUpdateTask,
	user: RequestUser,
) => {
	const task = await assertTaskAccess(id, user);
	const project = await prisma.project.findUniqueOrThrow({
		where: { id: task.projectId },
	});
	await validateTaskRelations(
		project.id,
		project.teamId,
		payload.sprintId,
		payload.assigneeId,
	);

	const updatedTask = await prisma.task.update({
		where: { id },
		data: payload,
		include: { assignee: userSelect, reporter: userSelect },
	});

	const changes = describeChanges(task, payload);
	if (changes.length) {
		await logActivity(`updated ${changes.join(", ")}`, user.userId, id);
	}
	return updatedTask;
};

const updateTaskStatus = async (
	id: string,
	status: TaskStatus,
	user: RequestUser,
) => {
	const task = await assertTaskAccess(id, user);
	const updatedTask = await prisma.task.update({
		where: { id },
		data: { status },
	});
	if (task.status !== status) {
		await logActivity(
			`moved task from ${task.status} to ${status}`,
			user.userId,
			id,
		);
	}
	return updatedTask;
};

// reporter, team lead, org owner or platform admin can delete
const deleteTask = async (id: string, user: RequestUser) => {
	const task = await assertTaskAccess(id, user);
	if (task.reporterId !== user.userId && !isPlatformAdmin(user)) {
		await assertProjectAccess(task.projectId, user, true);
	}
	await prisma.task.delete({ where: { id } });
	// task-scoped activities are cascaded away, so log without a taskId
	await logActivity(`deleted task "${task.title}"`, user.userId);
};

export const taskServices = {
	createTask,
	getTasks,
	getMyTasks,
	getTaskById,
	updateTask,
	updateTaskStatus,
	deleteTask,
};
