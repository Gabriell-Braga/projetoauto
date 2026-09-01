import type { Metadata } from "next";
import { asc, desc, eq, sql } from "drizzle-orm";
import { PageHeader } from "@/components/layout/shell";
import { getDb } from "@/db";
import { coupons, plans, tenants } from "@/db/schema";
import { requireSuperAdminPage } from "@/lib/auth/guards";
import { PlansPanel } from "./plans-panel";

export const metadata: Metadata = { title: "Planos" };
export const dynamic = "force-dynamic";

export default async function PlansPage() {
  await requireSuperAdminPage();
  const db = await getDb();

  const [planRows, couponRows, usageRows] = await Promise.all([
    db.select().from(plans).orderBy(asc(plans.sortOrder), asc(plans.name)),
    db.select().from(coupons).orderBy(desc(coupons.createdAt)),
    db
      .select({ planId: tenants.planId, total: sql<number>`count(*)` })
      .from(tenants)
      .where(eq(tenants.status, "active"))
      .groupBy(tenants.planId),
  ]);

  const usage = Object.fromEntries(
    usageRows.filter((row) => row.planId).map((row) => [row.planId as string, Number(row.total)]),
  );

  return (
    <>
      <PageHeader
        title="Planos"
        description="O que cada plano libera, quanto custa e por quanto tempo é grátis."
      />
      <PlansPanel
        plans={planRows.map((plan) => ({
          ...plan,
          createdAt: plan.createdAt?.toISOString() ?? null,
          updatedAt: plan.updatedAt?.toISOString() ?? null,
          tenantCount: usage[plan.id] ?? 0,
        }))}
        coupons={couponRows.map((coupon) => ({
          ...coupon,
          expiresAt: coupon.expiresAt?.toISOString() ?? null,
          createdAt: coupon.createdAt?.toISOString() ?? null,
          updatedAt: coupon.updatedAt?.toISOString() ?? null,
        }))}
      />
    </>
  );
}
