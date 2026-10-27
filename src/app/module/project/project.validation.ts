import z from "zod";

const CreateProjectZodSchema = z.object({
	name: z.string().trim().min(1, "Project name is required"),
	description: z.string().trim().optional(),
	teamId: z.uuid("A valid team id is required"),
});

const UpdateProjectZodSchema = z.object({
	name: z.string().trim().min(1).optional(),
	description: z.string().trim().optional(),
});

export type TCreateProject = z.infer<typeof CreateProjectZodSchema>;
export type TUpdateProject = z.infer<typeof UpdateProjectZodSchema>;

export const projectValidation = {
	CreateProjectZodSchema,
	UpdateProjectZodSchema,
};
