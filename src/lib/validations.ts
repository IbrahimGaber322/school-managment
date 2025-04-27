import { z } from "zod";
import { Role } from "@/models/User/user.types";
const signUpSchema = z.object({
  firstName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must be at most 50 characters long" }),
  lastName: z
    .string()
    .min(2, { message: "Name must be at least 2 characters long" })
    .max(50, { message: "Name must be at most 50 characters long" }),
  email: z.string().email({ message: "Invalid email address" }),
  password: z
    .string()
    .min(8, { message: "Password must be at least 8 characters long" })
    .regex(/[A-Z]/, {
      message: "Password must contain at least one uppercase letter",
    })
    .regex(/[a-z]/, {
      message: "Password must contain at least one lowercase letter",
    })
    .regex(/\d/, { message: "Password must contain at least one digit" }),
});

const addUserSchema = signUpSchema.extend({
  role: z.enum([Role.STUDENT, Role.TEACHER], {
    errorMap: () => ({ message: "Invalid role" }),
  }),
});

export { addUserSchema, signUpSchema };
