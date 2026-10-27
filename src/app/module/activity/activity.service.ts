import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { assertProjectAccess, assertTaskAccess } from "../../utils/access";
import {
	buildMeta,
	getPagination,
	type IPaginationQuery,
} from "../../utils/paginate";

const include = {
	user: { select: { id: true, name: true, imageUrl: true } },
	task: { select: { id: true, title: true } },
};

const getTaskActivities = async (taskId: string, user: RequestUser) => {
	await assertTaskAccess(taskId, user);
	return prisma.activity.findMany({
		where: { taskId },
		include,
		orderBy: { createdAt: "desc" },
	});
};

const getProjectActivities = async (
	projectId: string,
	query: IPaginationQuery,
	user: RequestUser,
) => {
	await assertProjectAccess(projectId, user);
	const { page, limit, skip } = getPagination(query);
	const where = { task: { projectId } };
	const [data, total] = await prisma.$transaction([
		prisma.activity.findMany({
			where,
			include,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		}),
		prisma.activity.count({ where }),
	]);
	return { data, meta: buildMeta(page, limit, total) };
};

const getMyActivities = async (query: IPaginationQuery, user: RequestUser) => {
	const { page, limit, skip } = getPagination(query);
	const where = { userId: user.userId };
	const [data, total] = await prisma.$transaction([
		prisma.activity.findMany({
			where,
			include,
			skip,
			take: limit,
			orderBy: { createdAt: "desc" },
		}),
		prisma.activity.count({ where }),
	]);
	return { data, meta: buildMeta(page, limit, total) };
};

export const activityServices = {
	getTaskActivities,
	getProjectActivities,
	getMyActivities,
};
