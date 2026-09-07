import { Router } from "express";
import { userController } from "./user.controller";

const router = Router();

router.patch("/profile-image", userController.uploadProfileImage);

export const UserRoutes = router;
