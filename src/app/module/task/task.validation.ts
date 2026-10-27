import z from "zod";
import { Priority, TaskStatus } from "../../../generated/prisma/enums";

const CreateTaskZodSchema = z.object({
	title: z.string().trim().min(1, "Task title is required"),
	description: z.string().trim().optional(),
	projectId: z.uuid("A valid project id is required"),
	sprintId: z.uuid().nullable().optional(),
	assigneeId: z.uuid().nullable().optional(),
	status: z.enum(TaskStatus).optional(),
	priority: z.enum(Priority).optional(),
	dueDate: z.coerce.date().nullable().optional(),
});

const UpdateTaskZodSchema = CreateTaskZodSchema.omit({
	projectId: true,
}).partial();

const UpdateTaskStatusZodSchema = z.object({
	status: z.enum(TaskStatus),
});

export type TCreateTask = z.infer<typeof CreateTaskZodSchema>;
export type TUpdateTask = z.infer<typeof UpdateTaskZodSchema>;

export const taskValidation = {
	CreateTaskZodSchema,
	UpdateTaskZodSchema,
	UpdateTaskStatusZodSchema,
};
