import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  NextFunction,
  type Application,
  type Request,
  type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { UserRoutes } from "./app/module/user/user.route";
import { sendResponse } from "./app/utils/sendResponse";
import { getBkashIdToken } from "./app/lib/bkash";
import { projectBooking } from "./app/module/booking/booking.route";

const app: Application = express();

app.use(
  cors({
    origin: config.frontend_url,
    credentials: true,
  }),
);

app.use(express.urlencoded({ extended: true }));

// Middleware to parse JSON bodies
app.use(express.json());
app.use(cookieParser());

app.get("/test", async (req: Request, res: Response, next: NextFunction) => {
  try {
    const grantIdToken = await getBkashIdToken();
    console.log(grantIdToken);
    sendResponse(res, {
      statusCode: httpStatus.CREATED,
      success: true,
      message: "User registered successfully",
      data: {},
    });
  } catch (error) {
    console.log(error);
    next(error);
  }
});

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/booking", projectBooking);

// app.use("/test");

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to PH Healthcare System Backend",
  });
});

app.use(globalErrorHandler);
app.use(notFound);

export default app;
