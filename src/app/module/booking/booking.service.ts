import httpStatus from "http-status";
import { BookingStatus, PaymentStatus } from "../../../generated/prisma/enums";
import config from "../../config";
import { AppError } from "../../errors/AppError";
import { getBkashIdToken } from "../../lib/bkash";
import { prisma } from "../../lib/prisma";
import type { RequestUser } from "../../middleware/checkAuth";
import { isPlatformAdmin } from "../../utils/access";
import type { IBookingIdPayload } from "./booking.interface";

const BOOKING_AMOUNT = "1200";
const CALLBACK_PATH = "/api/v1/booking/project-booking/payment/callback";

// bKash returns HTTP 200 even for business errors; statusCode "0000" means success
const bkashRequest = async (path: string, body: Record<string, unknown>) => {
	const bkashIdToken = await getBkashIdToken();
	if (!bkashIdToken) {
		throw new AppError(httpStatus.BAD_GATEWAY, "bkash access token not found");
	}
	const response = await fetch(`${config.bkash_base_url}${path}`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			Accept: "application/json",
			Authorization: bkashIdToken,
			"X-App-Key": config.bkash_app_key,
		},
		body: JSON.stringify(body),
	});
	const result = await response.json();
	return result;
};

const createBkashPayment = async (bookingId: string, user: RequestUser) => {
	const result = await bkashRequest("/tokenized/checkout/create", {
		mode: "0011",
		payerReference: user.email,
		callbackURL: `${config.bkash_callback_url}${CALLBACK_PATH}`,
		amount: BOOKING_AMOUNT,
		currency: "BDT",
		intent: "sale",
		merchantInvoiceNumber: bookingId,
	});
	if (result.statusCode !== "0000" || !result.paymentID) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			`bkash create payment failed: ${result.statusMessage ?? "unknown error"}`,
		);
	}
	return result;
};

const assertBookingOwner = (
	booking: { userId: string | null },
	user: RequestUser,
) => {
	if (!isPlatformAdmin(user) && booking.userId !== user.userId) {
		throw new AppError(httpStatus.FORBIDDEN, "This booking is not yours");
	}
};

const booking = async (user: RequestUser) => {
	const newBooking = await prisma.booking.create({
		data: {
			status: BookingStatus.PENDING,
			userId: user.userId,
		},
	});

	try {
		const bkashCreatePaymentResult = await createBkashPayment(
			newBooking.id,
			user,
		);

		await prisma.payment.create({
			data: {
				merchantInvoiceNumber: newBooking.id,
				bookingId: newBooking.id,
				amount: BOOKING_AMOUNT,
				gatewayResponse: bkashCreatePaymentResult,
				bkashPaymentId: bkashCreatePaymentResult.paymentID,
				payerReference: user.email,
			},
		});

		return {
			bookingId: newBooking.id,
			paymentUrl: bkashCreatePaymentResult.bkashURL,
		};
	} catch (error) {
		// don't leave an orphan booking behind if bKash rejected the payment
		await prisma.booking.delete({ where: { id: newBooking.id } });
		throw error;
	}
};

const payBooking = async (payload: IBookingIdPayload, user: RequestUser) => {
	const existingBooking = await prisma.booking.findUnique({
		where: {
			id: payload.bookingId,
		},
		include: { payment: true },
	});
	if (!existingBooking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking does not exist");
	}
	assertBookingOwner(existingBooking, user);
	if (existingBooking.status !== BookingStatus.PENDING) {
		throw new AppError(httpStatus.BAD_REQUEST, "Booking is not pending!");
	}
	if (existingBooking.payment?.status === PaymentStatus.PAID) {
		throw new AppError(httpStatus.BAD_REQUEST, "Booking is already paid");
	}

	const bkashCreatePaymentResult = await createBkashPayment(
		existingBooking.id,
		user,
	);

	await prisma.payment.upsert({
		where: {
			bookingId: existingBooking.id,
		},
		update: {
			status: PaymentStatus.UNPAID,
			gatewayResponse: bkashCreatePaymentResult,
			bkashPaymentId: bkashCreatePaymentResult.paymentID,
		},
		create: {
			merchantInvoiceNumber: existingBooking.id,
			bookingId: existingBooking.id,
			amount: BOOKING_AMOUNT,
			gatewayResponse: bkashCreatePaymentResult,
			bkashPaymentId: bkashCreatePaymentResult.paymentID,
			payerReference: user.email,
		},
	});
	return {
		bookingId: existingBooking.id,
		paymentUrl: bkashCreatePaymentResult.bkashURL,
	};
};

const redirectTo = (status: string) => ({
	redirectUrl: `${config.frontend_url}/dashboard/my-projects?status=${status}`,
});

const bookingCallback = async (query: Record<string, unknown>) => {
	const paymentId = query.paymentID ? String(query.paymentID) : "";
	if (!paymentId) {
		throw new AppError(httpStatus.BAD_REQUEST, "payment id missing");
	}
	const status = String(query.status ?? "")
		.trim()
		.toLowerCase();

	const payment = await prisma.payment.findUnique({
		where: { bkashPaymentId: paymentId },
	});
	if (!payment) {
		return redirectTo("failure");
	}
	// callback can be hit more than once (e.g. page refresh)
	if (payment.status === PaymentStatus.PAID) {
		return redirectTo("success");
	}

	if (status === "cancel" || status === "failure") {
		await prisma.payment.update({
			where: { bkashPaymentId: paymentId },
			data: {
				status:
					status === "cancel" ? PaymentStatus.CANCELLED : PaymentStatus.FAILED,
			},
		});
		return redirectTo(status);
	}

	if (status !== "success") {
		return redirectTo("failure");
	}

	// only execute the payment when the user actually approved it
	const executedPaymentResult = await bkashRequest(
		"/tokenized/checkout/execute",
		{ paymentID: paymentId },
	);

	const isCompleted =
		executedPaymentResult.statusCode === "0000" &&
		executedPaymentResult.transactionStatus === "Completed";

	if (!isCompleted) {
		await prisma.payment.update({
			where: { bkashPaymentId: paymentId },
			data: {
				status: PaymentStatus.FAILED,
				gatewayResponse: executedPaymentResult,
			},
		});
		return redirectTo("failure");
	}

	await prisma.$transaction([
		prisma.booking.update({
			where: { id: payment.bookingId },
			data: { status: BookingStatus.CONFIRMED },
		}),
		prisma.payment.update({
			where: { bkashPaymentId: paymentId },
			data: {
				status: PaymentStatus.PAID,
				bkashTrxId: executedPaymentResult.trxID,
				paidAt: executedPaymentResult.paymentExecuteTime,
				gatewayResponse: executedPaymentResult,
			},
		}),
	]);
	return redirectTo("success");
};

const cancelBooking = async (payload: IBookingIdPayload, user: RequestUser) => {
	const existingBooking = await prisma.booking.findUnique({
		where: {
			id: payload.bookingId,
		},
		include: {
			payment: true,
		},
	});
	if (!existingBooking) {
		throw new AppError(httpStatus.NOT_FOUND, "Booking does not exist");
	}
	assertBookingOwner(existingBooking, user);
	if (
		existingBooking.status === BookingStatus.IN_PROGRESS ||
		existingBooking.status === BookingStatus.COMPLETED
	) {
		throw new AppError(
			httpStatus.BAD_REQUEST,
			"Booking already is in progress or completed",
		);
	}
	if (existingBooking.status === BookingStatus.CANCELLED) {
		throw new AppError(httpStatus.BAD_REQUEST, "Booking is already cancelled");
	}

	const payment = existingBooking.payment;

	// nothing was charged: just cancel, no refund needed
	if (!payment || payment.status !== PaymentStatus.PAID) {
		const updateBooking = await prisma.booking.update({
			where: { id: existingBooking.id },
			data: { status: BookingStatus.CANCELLED },
		});
		if (payment) {
			await prisma.payment.update({
				where: { id: payment.id },
				data: { status: PaymentStatus.CANCELLED },
			});
		}
		return { booking: updateBooking, payment: null };
	}

	const refundReason = "customer cancelled the booking";
	const bkashRefundPaymentResult = await bkashRequest(
		"/v2/tokenized-checkout/refund/payment/transaction",
		{
			paymentId: payment.bkashPaymentId,
			trxId: payment.bkashTrxId,
			refundAmount: payment.amount.toString(),
			sku: "booking",
			reason: refundReason,
		},
	);

	if (!bkashRefundPaymentResult.refundTrxId) {
		throw new AppError(
			httpStatus.BAD_GATEWAY,
			`bkash refund failed: ${bkashRefundPaymentResult.statusMessage ?? bkashRefundPaymentResult.errorMessage ?? "unknown error"}`,
		);
	}

	const [updateBooking, updatePayment] = await prisma.$transaction([
		prisma.booking.update({
			where: { id: existingBooking.id },
			data: { status: BookingStatus.CANCELLED },
		}),
		prisma.payment.update({
			where: { id: payment.id },
			data: {
				refundTrxId: bkashRefundPaymentResult.refundTrxId,
				refundAt: bkashRefundPaymentResult.completedTime,
				refundAmount: bkashRefundPaymentResult.refundAmount ?? payment.amount,
				status: PaymentStatus.REFUNDED,
				refundReason,
				gatewayResponse: bkashRefundPaymentResult,
			},
		}),
	]);
	return {
		booking: updateBooking,
		payment: updatePayment,
	};
};

const getMyBookings = async (user: RequestUser) => {
	return prisma.booking.findMany({
		where: isPlatformAdmin(user) ? {} : { userId: user.userId },
		include: { payment: true },
		orderBy: { createdAt: "desc" },
	});
};

export const bookingServices = {
	booking,
	payBooking,
	bookingCallback,
	cancelBooking,
	getMyBookings,
};
