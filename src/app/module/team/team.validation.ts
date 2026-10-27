import z from "zod";
import { TeamRole } from "../../../generated/prisma/enums";

const CreateTeamZodSchema = z.object({
	name: z.string().trim().min(1, "Team name is required"),
	organizationId: z.uuid("A valid organization id is required"),
});

const UpdateTeamZodSchema = z.object({
	name: z.string().trim().min(1, "Team name is required"),
});

const AddMemberZodSchema = z.object({
	email: z.email("A valid member email is required"),
	role: z.enum(TeamRole).optional(),
});

const UpdateMemberRoleZodSchema = z.object({
	role: z.enum(TeamRole),
});

export type TCreateTeam = z.infer<typeof CreateTeamZodSchema>;
export type TUpdateTeam = z.infer<typeof UpdateTeamZodSchema>;
export type TAddMember = z.infer<typeof AddMemberZodSchema>;
export type TUpdateMemberRole = z.infer<typeof UpdateMemberRoleZodSchema>;

export const teamValidation = {
	CreateTeamZodSchema,
	UpdateTeamZodSchema,
	AddMemberZodSchema,
	UpdateMemberRoleZodSchema,
};
