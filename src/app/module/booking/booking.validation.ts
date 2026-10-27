import z from "zod";

const BookingIdZodSchema = z.object({
	bookingId: z.uuid("A valid booking id is required"),
});

export const bookingValidation = {
	BookingIdZodSchema,
};
