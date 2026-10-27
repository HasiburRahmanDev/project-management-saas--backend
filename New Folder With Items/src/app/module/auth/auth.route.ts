import { Router } from "express";
import { Role } from "../../../generated/prisma/enums";
import { auth } from "../../middleware/checkAuth";
import { AuthController } from "./auth.controller";
import { validateRequest } from "../../middleware/validateRequest";
import { userValidation } from "./auth.validation";

const router = Router();

router.post(
  "/register",
  validateRequest(userValidation.PatientRegistrationZodSchema),
  AuthController.registerUser,
);
router.post(
  "/login",
  validateRequest(userValidation.LoginZodSchema),
  AuthController.loginUser,
);
router.get(
  "/me",
  auth(Role.OWNER, Role.ADMIN, Role.MANAGER, Role.MEMBER),
  AuthController.getMe,
);
router.post("/refresh-token", AuthController.refreshToken);
router.post("/google", AuthController.googleLogin);
router.post("/forgot-password", AuthController.forgotPassword);
router.post("/reset-password", AuthController.resetPassword);

export const AuthRoutes = router;
