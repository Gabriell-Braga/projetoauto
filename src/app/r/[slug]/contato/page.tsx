import type { Metadata } from "next";
import { loadPublicSite } from "@/lib/services/public-site";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const context = await loadPublicSite(slug);
  return {
    title: "Contato",
    description: `Endereço, telefone e horários de atendimento da ${context.site.name}.`,
  };
}

export default async function TenantContactPage({ params }: Props) {
  const { slug } = await params;
  const context = await loadPublicSite(slug);
  const Contact = context.template.Contact;

  return <Contact site={context.site} links={context.links} />;
}
