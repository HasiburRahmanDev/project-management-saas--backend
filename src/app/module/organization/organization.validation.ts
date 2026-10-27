import z from "zod";

const CreateOrganizationZodSchema = z.object({
	name: z.string().trim().min(1, "Organization name is required"),
	description: z.string().trim().optional(),
});

const UpdateOrganizationZodSchema = CreateOrganizationZodSchema.partial();

export type TCreateOrganization = z.infer<typeof CreateOrganizationZodSchema>;
export type TUpdateOrganization = z.infer<typeof UpdateOrganizationZodSchema>;

export const organizationValidation = {
	CreateOrganizationZodSchema,
	UpdateOrganizationZodSchema,
};
