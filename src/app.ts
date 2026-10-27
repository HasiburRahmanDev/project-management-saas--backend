import cookieParser from "cookie-parser";
import cors from "cors";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import httpStatus from "http-status";
import config from "./app/config";
import { globalErrorHandler } from "./app/middleware/globalErrorHandler";
import { notFound } from "./app/middleware/notFound";
import { ActivityRoutes } from "./app/module/activity/activity.route";
import { AttachmentRoutes } from "./app/module/attachment/attachment.route";
import { AuthRoutes } from "./app/module/auth/auth.route";
import { projectBooking } from "./app/module/booking/booking.route";
import { CommentRoutes } from "./app/module/comment/comment.route";
import { OrganizationRoutes } from "./app/module/organization/organization.route";
import { ProjectRoutes } from "./app/module/project/project.route";
import { SprintRoutes } from "./app/module/sprint/sprint.route";
import { TaskRoutes } from "./app/module/task/task.route";
import { TeamRoutes } from "./app/module/team/team.route";
import { UserRoutes } from "./app/module/user/user.route";

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

app.use("/api/v1/auth", AuthRoutes);
app.use("/api/v1/user", UserRoutes);
app.use("/api/v1/booking", projectBooking);
app.use("/api/v1/organizations", OrganizationRoutes);
app.use("/api/v1/teams", TeamRoutes);
app.use("/api/v1/projects", ProjectRoutes);
app.use("/api/v1/sprints", SprintRoutes);
app.use("/api/v1/tasks", TaskRoutes);
app.use("/api/v1/comments", CommentRoutes);
app.use("/api/v1/attachments", AttachmentRoutes);
app.use("/api/v1/activities", ActivityRoutes);

// Basic route
app.get("/", async (req: Request, res: Response) => {
  res.status(httpStatus.OK).json({
    success: true,
    message: "Welcome to project management system Backend",
  });
});

app.use(notFound);
app.use(globalErrorHandler);

export default app;
