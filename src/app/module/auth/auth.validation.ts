import z from "zod";

const RegistrationZodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  email: z.email("Email is not correct"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const LoginZodSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

const GoogleLoginZodSchema = z.object({
  tokenId: z.string().min(1, "Google token id is required"),
});

const ForgotPasswordZodSchema = z.object({
  email: z.email("Email is not correct"),
});

const ResetPasswordZodSchema = z.object({
  email: z.email("Email is not correct"),
  otp: z.string().length(6, "OTP must be 6 digits"),
  newPassword: z
    .string()
    .min(8, "Password must be at least 8 characters long"),
});

export const userValidation = {
  RegistrationZodSchema,
  LoginZodSchema,
  GoogleLoginZodSchema,
  ForgotPasswordZodSchema,
  ResetPasswordZodSchema,
};
