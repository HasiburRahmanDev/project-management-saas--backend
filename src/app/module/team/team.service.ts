import httpStatus from "http-status";
import { TeamRole, UserStatus } from "../../../generated/prisma/enums";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import {
	assertOrganizationOwner,
	assertTeamAccess,
	isPlatformAdmin,
} from "../../utils/access";
import type {
	TAddMember,
	TCreateTeam,
	TUpdateMemberRole,
	TUpdateTeam,
} from "./team.validation";

const memberInclude = {
	include: {
		user: { select: { id: true, name: true, email: true, imageUrl: true } },
	},
};

const createTeam = async (payload: TCreateTeam, user: RequestUser) => {
	await assertOrganizationOwner(payload.organizationId, user);
	return prisma.team.create({ data: payload });
};

const getTeams = async (
	query: { organizationId?: string },
	user: RequestUser,
) => {
	return prisma.team.findMany({
		where: {
			...(query.organizationId && { organizationId: query.organizationId }),
			...(!isPlatformAdmin(user) && {
				OR: [
					{ members: { some: { userId: user.userId } } },
					{ organization: { ownerId: user.userId } },
				],
			}),
		},
		include: { _count: { select: { members: true, projects: true } } },
		orderBy: { createdAt: "desc" },
	});
};

const getTeamById = async (id: string, user: RequestUser) => {
	await assertTeamAccess(id, user);
	return prisma.team.findUnique({
		where: { id },
		include: {
			organization: { select: { id: true, name: true, ownerId: true } },
			members: memberInclude,
			projects: true,
		},
	});
};

const updateTeam = async (
	id: string,
	payload: TUpdateTeam,
	user: RequestUser,
) => {
	await assertTeamAccess(id, user, true);
	return prisma.team.update({ where: { id }, data: payload });
};

const deleteTeam = async (id: string, user: RequestUser) => {
	const team = await prisma.team.findUnique({ where: { id } });
	if (!team) {
		throw new AppError(httpStatus.NOT_FOUND, "Team not found");
	}
	await assertOrganizationOwner(team.organizationId, user);
	return prisma.team.delete({ where: { id } });
};

const addMember = async (
	teamId: string,
	payload: TAddMember,
	user: RequestUser,
) => {
	await assertTeamAccess(teamId, user, true);
	const member = await prisma.user.findUnique({
		where: { email: payload.email.trim().toLowerCase() },
	});
	if (!member || member.isDeleted || member.status !== UserStatus.ACTIVE) {
		throw new AppError(httpStatus.NOT_FOUND, "No active user with this email");
	}
	const existing = await prisma.teamMember.findUnique({
		where: { teamId_userId: { teamId, userId: member.id } },
	});
	if (existing) {
		throw new AppError(httpStatus.CONFLICT, "User is already a team member");
	}
	return prisma.teamMember.create({
		data: { teamId, userId: member.id, role: payload.role ?? TeamRole.MEMBER },
		...memberInclude,
	});
};

const updateMemberRole = async (
	teamId: string,
	memberUserId: string,
	payload: TUpdateMemberRole,
	user: RequestUser,
) => {
	const team = await prisma.team.findUnique({ where: { id: teamId } });
	if (!team) {
		throw new AppError(httpStatus.NOT_FOUND, "Team not found");
	}
	// promoting/demoting leads is reserved to the organization owner
	await assertOrganizationOwner(team.organizationId, user);
	return prisma.teamMember.update({
		where: { teamId_userId: { teamId, userId: memberUserId } },
		data: { role: payload.role },
		...memberInclude,
	});
};

const removeMember = async (
	teamId: string,
	memberUserId: string,
	user: RequestUser,
) => {
	// members may leave on their own; otherwise a lead is required
	if (memberUserId !== user.userId) {
		await assertTeamAccess(teamId, user, true);
	}
	await prisma.task.updateMany({
		where: { assigneeId: memberUserId, project: { teamId } },
		data: { assigneeId: null },
	});
	return prisma.teamMember.delete({
		where: { teamId_userId: { teamId, userId: memberUserId } },
	});
};

export const teamServices = {
	createTeam,
	getTeams,
	getTeamById,
	updateTeam,
	deleteTeam,
	addMember,
	updateMemberRole,
	removeMember,
};
