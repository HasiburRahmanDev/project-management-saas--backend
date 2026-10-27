import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { validateRequest } from "../../middleware/validateRequest";
import { bookingController } from "./booking.controller";
import { bookingValidation } from "./booking.validation";

const router = Router();

const allRoles = [Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.OWNER];

router.get("/my-bookings", auth(...allRoles), bookingController.getMyBookings);
router.post("/project-booking", auth(...allRoles), bookingController.booking);
router.post(
	"/pay-booking",
	auth(...allRoles),
	validateRequest(bookingValidation.BookingIdZodSchema),
	bookingController.payBooking,
);
router.post(
	"/cancel-booking",
	auth(...allRoles),
	validateRequest(bookingValidation.BookingIdZodSchema),
	bookingController.cancelBooking,
);

router.get(
	"/project-booking/payment/callback",
	bookingController.bookingCallback,
);

export const projectBooking = router;
