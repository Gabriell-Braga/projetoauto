"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { SelectMenu } from "@/components/ui/select-menu";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { apiPatch } from "@/lib/client/api";
import { PUBLICATION_LABELS, type PublicationStatus } from "@/lib/integrations/portals";
import { formatDateTime } from "@/lib/utils";

type Listing = {
  id: string;
  vehicleId: string;
  vehicle: string;
  version: string | null;
  yearModel: number;
  vehicleStatus: string;
  status: PublicationStatus;
  /** Erro do portal (status erro) ou nota de situação (publicado mas não no ar). */
  detail: string | null;
  url: string | null;
  syncedAt: string | null;
};

type ListingTypes = { current: string | null; available: { id: string; name: string }[] };

const TONE: Record<PublicationStatus, BadgeTone> = {
  publicado: "success",
  pendente: "info",
  removendo: "warning",
  removido: "neutral",
  erro: "danger",
};

/** Ordem de leitura: o que precisa de ação primeiro, o que já passou por último. */
const ORDER: PublicationStatus[] = ["erro", "pendente", "removendo", "publicado", "removido"];

export function ListingsPanel({
  portalKey,
  portalName,
  connected,
  canWrite,
  connectionError,
  lastSyncAt,
  listingTypes,
  listings,
}: {
  portalKey: string;
  portalName: string;
  connected: boolean;
  canWrite: boolean;
  connectionError: string | null;
  lastSyncAt: string | null;
  listingTypes: ListingTypes | null;
  listings: Listing[];
}) {
  const sorted = [...listings].sort(
    (a, b) =>
      ORDER.indexOf(a.status) - ORDER.indexOf(b.status) || a.vehicle.localeCompare(b.vehicle),
  );
  const counts = ORDER.map((status) => ({
    status,
    total: listings.filter((item) => item.status === status).length,
  })).filter((item) => item.total > 0);

  return (
    <div className="space-y-4">
      {connectionError ? <Alert tone="danger">{connectionError}</Alert> : null}

      {listingTypes ? (
        <ListingTypeCard portalKey={portalKey} canWrite={canWrite} types={listingTypes} />
      ) : null}

      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle>Anúncios</CardTitle>
            <CardDescription>
              {lastSyncAt
                ? `Última sincronização em ${formatDateTime(new Date(lastSyncAt))}.`
                : "Ainda não sincronizado."}
            </CardDescription>
          </div>
          {counts.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {counts.map((item) => (
                <Badge key={item.status} tone={TONE[item.status]}>
                  {item.total} {PUBLICATION_LABELS[item.status].toLowerCase()}
                </Badge>
              ))}
            </div>
          ) : null}
        </CardHeader>

        <CardContent className="p-0">
          {sorted.length === 0 ? (
            <EmptyState
              title={connected ? "Nenhum carro enviado ainda" : `${portalName} não está conectado`}
              description={
                connected
                  ? "Clique em Sincronizar agora para enviar o estoque."
                  : "Conecte a conta em Portais para começar."
              }
            />
          ) : (
            <Table>
              <Thead>
                <Tr>
                  <Th>Veículo</Th>
                  <Th>Situação</Th>
                  <Th>Detalhe</Th>
                  <Th>Atualizado</Th>
                  <Th />
                </Tr>
              </Thead>
              <tbody>
                {sorted.map((listing) => (
                  <Tr key={listing.id}>
                    <Td>
                      <Link
                        href={`/admin/estoque/${listing.vehicleId}`}
                        className="font-medium text-text transition-colors hover:text-accent-text"
                      >
                        {listing.vehicle} {listing.yearModel}
                      </Link>
                      {listing.version ? (
                        <p className="truncate text-xs text-faint">{listing.version}</p>
                      ) : null}
                    </Td>
                    <Td>
                      <Badge tone={TONE[listing.status]}>
                        {PUBLICATION_LABELS[listing.status]}
                      </Badge>
                    </Td>
                    <Td className="max-w-md">
                      {listing.detail ? (
                        <p
                          className={
                            listing.status === "erro"
                              ? "text-[13px] text-danger"
                              : "text-[13px] text-muted"
                          }
                        >
                          {listing.detail}
                        </p>
                      ) : (
                        <span className="text-faint">—</span>
                      )}
                    </Td>
                    <Td className="whitespace-nowrap text-muted">
                      {listing.syncedAt ? formatDateTime(new Date(listing.syncedAt)) : "—"}
                    </Td>
                    <Td className="text-right">
                      {listing.url ? (
                        <a
                          href={listing.url}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 whitespace-nowrap text-[13px] text-accent-text hover:underline"
                        >
                          Abrir no portal
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * O tipo de anúncio é o plano que a conta usa no portal. O gratuito acaba
 * rápido em veículos; sem esta escolha a revenda fica presa nele.
 */
function ListingTypeCard({
  portalKey,
  canWrite,
  types,
}: {
  portalKey: string;
  canWrite: boolean;
  types: ListingTypes;
}) {
  const router = useRouter();
  const toast = useToast();
  const [value, setValue] = useState(types.current ?? "");
  const [saving, setSaving] = useState(false);

  const options = types.available.map((type) => ({ value: type.id, label: type.name }));
  if (value && !options.some((option) => option.value === value)) {
    options.unshift({ value, label: value });
  }

  async function handleSelect(next: string) {
    setValue(next);
    setSaving(true);
    const result = await apiPatch(`/api/admin/portals/${portalKey}/settings`, {
      listingTypeId: next,
    });
    setSaving(false);
    if (!result.ok) {
      toast.error("Não consegui salvar", result.error);
      return;
    }
    toast.success(
      "Tipo de anúncio salvo",
      "Vale para os próximos envios. Sincronize para aplicar.",
    );
    router.refresh();
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tipo de anúncio</CardTitle>
        <CardDescription>
          O plano que a conta usa em cada anúncio novo. O gratuito tem uma cota pequena para
          veículos; quando ela acaba, o portal recusa os próximos até você escolher um tipo pago.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {options.length === 0 ? (
          <p className="text-sm text-muted">
            Não consegui listar os tipos disponíveis para esta conta agora. Tente de novo mais
            tarde.
          </p>
        ) : (
          <div className="max-w-sm">
            <SelectMenu
              value={value}
              options={options}
              placeholder="Escolher automaticamente"
              disabled={!canWrite || saving}
              onSelect={handleSelect}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
