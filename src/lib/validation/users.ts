import { z } from "zod";
import { ROLES, USER_STATUS } from "@/db/schema";
import { strongPasswordSchema } from "@/lib/auth/password-policy";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(ROLES).exclude(["super_admin"]),
  password: strongPasswordSchema,
  mustChangePassword: z.boolean().default(true),
});

export const createSuperAdminSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: strongPasswordSchema,
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(USER_STATUS).optional(),
});

export const resetPasswordSchema = z.object({
  password: strongPasswordSchema,
  mustChangePassword: z.boolean().default(true),
});
