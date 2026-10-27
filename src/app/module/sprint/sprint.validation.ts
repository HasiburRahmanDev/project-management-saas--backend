import z from "zod";

const sprintFields = {
	name: z.string().trim().min(1, "Sprint name is required"),
	goal: z.string().trim().optional(),
	startDate: z.coerce.date().optional(),
	endDate: z.coerce.date().optional(),
};

const endAfterStart = (data: { startDate?: Date; endDate?: Date }) =>
	!data.startDate || !data.endDate || data.endDate >= data.startDate;

const CreateSprintZodSchema = z
	.object({
		...sprintFields,
		projectId: z.uuid("A valid project id is required"),
	})
	.refine(endAfterStart, { message: "endDate must be after startDate" });

const UpdateSprintZodSchema = z
	.object(sprintFields)
	.partial()
	.refine(endAfterStart, { message: "endDate must be after startDate" });

export type TCreateSprint = z.infer<typeof CreateSprintZodSchema>;
export type TUpdateSprint = z.infer<typeof UpdateSprintZodSchema>;

export const sprintValidation = {
	CreateSprintZodSchema,
	UpdateSprintZodSchema,
};
