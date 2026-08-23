import { redirect } from "next/navigation";
import { getAuthContext } from "@/lib/auth/guards";
import { defaultLandingPath } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function RootPage() {
  const context = await getAuthContext();
  redirect(context ? defaultLandingPath(context.role) : "/login");
}
