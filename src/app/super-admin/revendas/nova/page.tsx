import type { Metadata } from "next";
import { PageHeader } from "@/components/layout/shell";
import { NewTenantForm } from "./tenant-form";

export const metadata: Metadata = { title: "Nova revenda" };
export const dynamic = "force-dynamic";

export default function NewTenantPage() {
  return (
    <>
      <PageHeader
        title="Nova revenda"
        description="Provisione o painel e o site público de uma nova revenda."
      />
      <NewTenantForm />
    </>
  );
}
