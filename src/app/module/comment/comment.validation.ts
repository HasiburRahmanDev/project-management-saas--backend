import z from "zod";

const CreateCommentZodSchema = z.object({
	taskId: z.uuid("A valid task id is required"),
	content: z.string().trim().min(1, "Comment cannot be empty"),
});

const UpdateCommentZodSchema = z.object({
	content: z.string().trim().min(1, "Comment cannot be empty"),
});

export type TCreateComment = z.infer<typeof CreateCommentZodSchema>;

export const commentValidation = {
	CreateCommentZodSchema,
	UpdateCommentZodSchema,
};
