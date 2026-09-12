import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { IRequestUser } from "../auth/auth.interface";
import httpStatus from "http-status";
import { sendResponse } from "../../utils/sendResponse";
import { bookingServices } from "./booking.service";

const booking = catchAsync(async (req: Request, res: Response) => {
  const result = await bookingServices.booking();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "payment with bkash",
    data: result,
  });
});

const bookingCallback = catchAsync(async (req: Request, res: Response) => {
  console.log(req.query);
  const result = await bookingServices.bookingCallback();
  sendResponse(res, {
    statusCode: httpStatus.OK,
    success: true,
    message: "payment with bkash",
    data: result,
  });
});

export const bookingController = { booking, bookingCallback };
