import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IRequestUser } from "../auth/auth.interface";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { bookingServices } from "./booking.service";

const booking = catchAsync(async (req: Request, res: Response) => {
  const payload = req.body;
  const user = req.user!;
  const result = await bookingServices.booking(payload, user);
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "payment with bkash",
    data: result,
  });
});

const bookingCallback = catchAsync(async (req: Request, res: Response) => {
  const { redirectUrl } = await bookingServices.bookingCallback(req.query);

  return res.redirect(302, redirectUrl);
  //   sendResponse(res, {
  //     statusCode: httpStatus.OK,
  //     success: true,
  //     message: "payment with bkash",
  //     data: executedPaymentResult,
  //   });
});

export const bookingController = { booking, bookingCallback };
