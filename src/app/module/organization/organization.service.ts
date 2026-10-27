import httpStatus from "http-status";
import { AppError } from "../../errors/AppError";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { assertOrganizationOwner, isPlatformAdmin } from "../../utils/access";
import type {
	TCreateOrganization,
	TUpdateOrganization,
} from "./organization.validation";

const ownerSelect = {
	select: { id: true, name: true, email: true, imageUrl: true },
};

const createOrganization = async (
	payload: TCreateOrganization,
	user: RequestUser,
) => {
	return prisma.organization.create({
		data: { ...payload, ownerId: user.userId },
		include: { owner: ownerSelect },
	});
};

// organizations the user owns or belongs to through a team
const getMyOrganizations = async (user: RequestUser) => {
	return prisma.organization.findMany({
		where: isPlatformAdmin(user)
			? {}
			: {
					OR: [
						{ ownerId: user.userId },
						{ teams: { some: { members: { some: { userId: user.userId } } } } },
					],
				},
		include: {
			owner: ownerSelect,
			_count: { select: { teams: true, projects: true } },
		},
		orderBy: { createdAt: "desc" },
	});
};

const getOrganizationById = async (id: string, user: RequestUser) => {
	const organization = await prisma.organization.findUnique({
		where: { id },
		include: {
			owner: ownerSelect,
			teams: {
				include: { _count: { select: { members: true, projects: true } } },
			},
		},
	});
	if (!organization) {
		throw new AppError(httpStatus.NOT_FOUND, "Organization not found");
	}
	if (!isPlatformAdmin(user) && organization.ownerId !== user.userId) {
		const membership = await prisma.teamMember.findFirst({
			where: { userId: user.userId, team: { organizationId: id } },
		});
		if (!membership) {
			throw new AppError(
				httpStatus.FORBIDDEN,
				"You are not a member of this organization",
			);
		}
	}
	return organization;
};

const updateOrganization = async (
	id: string,
	payload: TUpdateOrganization,
	user: RequestUser,
) => {
	await assertOrganizationOwner(id, user);
	return prisma.organization.update({ where: { id }, data: payload });
};

const deleteOrganization = async (id: string, user: RequestUser) => {
	await assertOrganizationOwner(id, user);
	return prisma.organization.delete({ where: { id } });
};

export const organizationServices = {
	createOrganization,
	getMyOrganizations,
	getOrganizationById,
	updateOrganization,
	deleteOrganization,
};
