import z, { email } from "zod";

const PatientRegistrationZodSchema = z.object({
  name: z.string(),
  email: z.email("Email is not correct"),
  password: z.string().min(8, "Password must be at least 8 characters long"),
  patient: z
    .object({
      contactNumber: z.string().optional(),
    })
    .optional(),
});

const LoginZodSchema = z.object({
  email: z.email(),
  password: z.string().min(8, "Password must be at least 8 characters long"),
});

export const userValidation = {
  PatientRegistrationZodSchema,
  LoginZodSchema,
};
