import { Request, Response } from "express";
import { catchAsync } from "../../utils/catchAsync";
import { userServices } from "./user.service";
import { sendResponse } from "../../utils/sendResponse";
import httpStatus from "http-status";

const uploadProfileImage = catchAsync(async (req: Request, res: Response) => {
  console.log("Request.file", req.file);
  const userId = req.user?.userId;
  if (!req.file) {
    throw new Error("No file provided");
  }
  const result = await userServices.uploadProfileImage(
    req.file?.buffer,
    userId as string,
  );

  sendResponse(res, {
    statusCode: httpStatus.CREATED,
    success: true,
    message: "image uploaded successfully",
    data: { result },
  });
});

export const userController = {
  uploadProfileImage,
};
