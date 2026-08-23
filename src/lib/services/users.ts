import { and, desc, eq, isNull } from "drizzle-orm";
import { getDb } from "@/db";
import { users, type Role, type User } from "@/db/schema";

export type UserListItem = Pick<
  User,
  "id" | "name" | "email" | "role" | "status" | "lastLoginAt" | "mustChangePassword" | "createdAt"
>;

const LIST_COLUMNS = {
  id: users.id,
  name: users.name,
  email: users.email,
  role: users.role,
  status: users.status,
  lastLoginAt: users.lastLoginAt,
  mustChangePassword: users.mustChangePassword,
  createdAt: users.createdAt,
};

export async function listTenantUsers(tenantId: string): Promise<UserListItem[]> {
  const db = await getDb();
  return db
    .select(LIST_COLUMNS)
    .from(users)
    .where(eq(users.tenantId, tenantId))
    .orderBy(desc(users.createdAt));
}

export async function listPlatformUsers(): Promise<UserListItem[]> {
  const db = await getDb();
  return db
    .select(LIST_COLUMNS)
    .from(users)
    .where(and(isNull(users.tenantId), eq(users.role, "super_admin" as Role)))
    .orderBy(desc(users.createdAt));
}

export async function isEmailTaken(email: string, exceptUserId?: string): Promise<boolean> {
  const db = await getDb();
  const rows = await db.select({ id: users.id }).from(users).where(eq(users.email, email)).limit(1);
  const found = rows[0];
  if (!found) return false;
  return found.id !== exceptUserId;
}
