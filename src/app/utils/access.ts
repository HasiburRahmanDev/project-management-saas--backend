import httpStatus from "http-status";
import { Role, TeamRole } from "../../generated/prisma/enums";
import { AppError } from "../errors/AppError";
import { prisma } from "../lib/prisma";
import type { RequestUser } from "../middleware/checkAuth";

// OWNER and ADMIN are platform-level roles and bypass membership checks.
export const isPlatformAdmin = (user: RequestUser) =>
	user.role === Role.OWNER || user.role === Role.ADMIN;

export const getOrganizationOrThrow = async (organizationId: string) => {
	const organization = await prisma.organization.findUnique({
		where: { id: organizationId },
	});
	if (!organization) {
		throw new AppError(httpStatus.NOT_FOUND, "Organization not found");
	}
	return organization;
};

// Only the organization owner (or a platform admin) can manage it.
export const assertOrganizationOwner = async (
	organizationId: string,
	user: RequestUser,
) => {
	const organization = await getOrganizationOrThrow(organizationId);
	if (!isPlatformAdmin(user) && organization.ownerId !== user.userId) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only the organization owner can perform this action",
		);
	}
	return organization;
};

// Any member of the team (or the organization owner) can view/work in it.
// Pass requireLead to restrict to team leads.
export const assertTeamAccess = async (
	teamId: string,
	user: RequestUser,
	requireLead = false,
) => {
	const team = await prisma.team.findUnique({
		where: { id: teamId },
		include: {
			organization: { select: { ownerId: true } },
			members: { where: { userId: user.userId } },
		},
	});
	if (!team) {
		throw new AppError(httpStatus.NOT_FOUND, "Team not found");
	}
	if (isPlatformAdmin(user) || team.organization.ownerId === user.userId) {
		return team;
	}
	const membership = team.members[0];
	if (!membership) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"You are not a member of this team",
		);
	}
	if (requireLead && membership.role !== TeamRole.LEAD) {
		throw new AppError(
			httpStatus.FORBIDDEN,
			"Only team leads can perform this action",
		);
	}
	return team;
};

export const assertProjectAccess = async (
	projectId: string,
	user: RequestUser,
	requireLead = false,
) => {
	const project = await prisma.project.findUnique({
		where: { id: projectId },
	});
	if (!project) {
		throw new AppError(httpStatus.NOT_FOUND, "Project not found");
	}
	await assertTeamAccess(project.teamId, user, requireLead);
	return project;
};

export const assertTaskAccess = async (taskId: string, user: RequestUser) => {
	const task = await prisma.task.findUnique({ where: { id: taskId } });
	if (!task) {
		throw new AppError(httpStatus.NOT_FOUND, "Task not found");
	}
	await assertProjectAccess(task.projectId, user);
	return task;
};

// Prisma "where" filter limiting projects to those the user can see.
export const accessibleProjectsFilter = (user: RequestUser) =>
	isPlatformAdmin(user)
		? {}
		: {
				team: {
					OR: [
						{ members: { some: { userId: user.userId } } },
						{ organization: { ownerId: user.userId } },
					],
				},
			};
