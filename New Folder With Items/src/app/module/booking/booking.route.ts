import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { bookingController } from "./booking.controller";

const router = Router();

router.post(
  "/project-booking",
  auth(Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.OWNER),
  bookingController.booking,
);
router.post(
  "/pay-booking",
  auth(Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.OWNER),
  bookingController.booking,
);
router.post(
  "/cancel-booking",
  auth(Role.ADMIN, Role.MANAGER, Role.MEMBER, Role.OWNER),
  bookingController.cancelBooking,
);

router.get(
  "/project-booking/payment/callback",
  bookingController.bookingCallback,
);

export const projectBooking = router;
