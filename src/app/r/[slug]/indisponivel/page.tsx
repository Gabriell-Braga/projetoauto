import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTenantCoreBySlug, isPublicSiteAvailable } from "@/lib/tenant/service";
import { tenantPublicPath } from "@/lib/tenant/resolveTenant";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Site temporariamente indisponível",
  robots: { index: false, follow: false },
};

/** Página neutra: nunca expõe o motivo (inadimplência/suspensão). */
export default async function UnavailablePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const tenant = await getTenantCoreBySlug(slug);

  if (tenant && isPublicSiteAvailable(tenant)) {
    redirect(tenantPublicPath(slug));
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-10 text-center shadow-sm">
        <h1 className="text-lg font-semibold text-slate-900">Site temporariamente indisponível</h1>
        <p className="mt-3 text-sm leading-relaxed text-slate-500">
          Este site está fora do ar no momento. Tente novamente mais tarde.
        </p>
      </div>
    </main>
  );
}
