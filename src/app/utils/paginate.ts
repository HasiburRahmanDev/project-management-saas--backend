export interface IPaginationQuery {
	page?: string | number;
	limit?: string | number;
	sortBy?: string;
	sortOrder?: string;
}

export const getPagination = (
	query: IPaginationQuery,
	allowedSortFields: string[] = ["createdAt"],
) => {
	const page = Math.max(Number(query.page) || 1, 1);
	const limit = Math.min(Math.max(Number(query.limit) || 10, 1), 100);
	const skip = (page - 1) * limit;
	const sortBy =
		query.sortBy && allowedSortFields.includes(query.sortBy)
			? query.sortBy
			: "createdAt";
	const sortOrder: "asc" | "desc" = query.sortOrder === "asc" ? "asc" : "desc";

	return { page, limit, skip, sortBy, sortOrder };
};

export const buildMeta = (page: number, limit: number, total: number) => ({
	page,
	limit,
	total,
	totalPages: Math.ceil(total / limit),
});
