import type { Request, Response } from "express";
import httpStatus from "http-status";
import { catchAsync } from "../../utils/catchAsync";
import { sendResponse } from "../../utils/sendResponse";
import { bookingServices } from "./booking.service";

const booking = catchAsync(async (req: Request, res: Response) => {
	const user = req.user!;
	const result = await bookingServices.booking(user);
	sendResponse(res, {
		statusCode: httpStatus.CREATED,
		success: true,
		message: "booking created, continue payment with bkash",
		data: result,
	});
});

const payBooking = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await bookingServices.payBooking(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "booking payment initiated successfully",
		data: result,
	});
});

const cancelBooking = catchAsync(async (req: Request, res: Response) => {
	const payload = req.body;
	const user = req.user!;

	const result = await bookingServices.cancelBooking(payload, user);

	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: result.payment
			? "booking cancelled and refunded successfully"
			: "booking cancelled successfully",
		data: result,
	});
});

const getMyBookings = catchAsync(async (req: Request, res: Response) => {
	const result = await bookingServices.getMyBookings(req.user!);
	sendResponse(res, {
		statusCode: httpStatus.OK,
		success: true,
		message: "bookings fetched successfully",
		data: result,
	});
});

const bookingCallback = catchAsync(async (req: Request, res: Response) => {
	const { redirectUrl } = await bookingServices.bookingCallback(req.query);

	return res.redirect(302, redirectUrl);
});

export const bookingController = {
	booking,
	bookingCallback,
	payBooking,
	cancelBooking,
	getMyBookings,
};
