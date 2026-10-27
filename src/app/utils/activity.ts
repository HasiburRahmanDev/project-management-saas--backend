import { prisma } from "../lib/prisma";

export const logActivity = async (
	action: string,
	userId: string,
	taskId?: string,
) => {
	try {
		await prisma.activity.create({ data: { action, userId, taskId } });
	} catch (error) {
		// activity logging must never break the main request
		console.log("Failed to log activity", error);
	}
};
