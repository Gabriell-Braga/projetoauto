import { z } from "zod";
import { ROLES, USER_STATUS } from "@/db/schema";

export const createUserSchema = z.object({
  name: z.string().trim().min(2, "Informe o nome").max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  role: z.enum(ROLES).exclude(["super_admin"]),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(128),
  mustChangePassword: z.boolean().default(true),
});

export const createSuperAdminSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().toLowerCase().email("E-mail inválido"),
  password: z.string().min(8, "Mínimo de 8 caracteres").max(128),
});

export const updateUserSchema = z.object({
  name: z.string().trim().min(2).max(120).optional(),
  role: z.enum(ROLES).optional(),
  status: z.enum(USER_STATUS).optional(),
});

export const resetPasswordSchema = z.object({
  password: z.string().min(8, "Mínimo de 8 caracteres").max(128),
  mustChangePassword: z.boolean().default(true),
});
