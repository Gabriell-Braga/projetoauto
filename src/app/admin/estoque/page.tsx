import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { StatCard, StatGrid } from "@/components/admin/stat-card";
import { VehicleStatusBadge } from "@/components/admin/status-badges";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Select } from "@/components/ui/field";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { VEHICLE_STATUS, type VehicleStatus } from "@/db/schema";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { VEHICLE_STATUS_LABELS } from "@/lib/catalog/labels";
import { mediaUrl } from "@/lib/paths";
import { getVehicleStats, listVehicles } from "@/lib/services/vehicles";
import { formatCurrency, formatNumber } from "@/lib/utils";

export const metadata: Metadata = { title: "Estoque" };
export const dynamic = "force-dynamic";

export default async function StockPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; sort?: string; page?: string }>;
}) {
  const context = await requireTenantPage("vehicles:read");
  const params = await searchParams;

  const status = VEHICLE_STATUS.includes(params.status as VehicleStatus)
    ? (params.status as VehicleStatus)
    : undefined;

  const [stats, result] = await Promise.all([
    getVehicleStats(context.tenant.id),
    listVehicles(context.tenant.id, {
      search: params.q?.trim() || undefined,
      status,
      sort: (params.sort as "recentes") || "recentes",
      page: Number(params.page ?? 1) || 1,
      pageSize: 20,
    }),
  ]);

  const canWrite = can(context.role, "vehicles:write") && context.access === "full";
  const totalPages = Math.max(1, Math.ceil(result.total / result.pageSize));

  function pageHref(page: number) {
    const query = new URLSearchParams();
    if (params.q) query.set("q", params.q);
    if (status) query.set("status", status);
    if (params.sort) query.set("sort", params.sort);
    query.set("page", String(page));
    return `/admin/estoque?${query.toString()}`;
  }

  return (
    <>
      <PageHeader
        title="Estoque"
        description={`${formatNumber(result.total)} veículo(s) encontrados.`}
        actions={
          canWrite ? (
            <Link href="/admin/estoque/novo">
              <Button>Novo veículo</Button>
            </Link>
          ) : null
        }
      />

      <StatGrid>
        <StatCard label="Disponíveis" value={formatNumber(stats.available)} tone="success" />
        <StatCard label="Reservados" value={formatNumber(stats.reserved)} tone="warning" />
        <StatCard label="Vendidos" value={formatNumber(stats.sold)} />
        <StatCard label="Rascunhos" value={formatNumber(stats.draft)} hint="Não aparecem no site" />
        <StatCard label="Em destaque" value={formatNumber(stats.featured)} />
      </StatGrid>

      <Card className="mb-4">
        <form className="flex flex-wrap items-end gap-3 px-5 py-4" action="/admin/estoque">
          <div className="min-w-56 flex-1">
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="q">
              Buscar
            </label>
            <Input id="q" name="q" defaultValue={params.q ?? ""} placeholder="Marca, modelo ou versão" />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="status">
              Situação
            </label>
            <Select id="status" name="status" defaultValue={status ?? ""}>
              <option value="">Todas</option>
              {VEHICLE_STATUS.map((value) => (
                <option key={value} value={value}>
                  {VEHICLE_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-ink-600" htmlFor="sort">
              Ordenar por
            </label>
            <Select id="sort" name="sort" defaultValue={params.sort ?? "recentes"}>
              <option value="recentes">Mais recentes</option>
              <option value="preco-asc">Menor preço</option>
              <option value="preco-desc">Maior preço</option>
              <option value="km-asc">Menor km</option>
              <option value="ano-desc">Ano mais novo</option>
            </Select>
          </div>
          <Button type="submit" variant="secondary">
            Filtrar
          </Button>
        </form>
      </Card>

      <Card>
        {result.items.length === 0 ? (
          <EmptyState
            title="Nenhum veículo encontrado"
            description="Cadastre veículos para que apareçam no site da sua revenda."
            action={
              canWrite ? (
                <Link href="/admin/estoque/novo">
                  <Button size="sm">Cadastrar veículo</Button>
                </Link>
              ) : null
            }
          />
        ) : (
          <Table>
            <Thead>
              <Tr>
                <Th>Veículo</Th>
                <Th>Ano</Th>
                <Th>KM</Th>
                <Th>Preço</Th>
                <Th>Situação</Th>
                <Th>Fotos</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {result.items.map((vehicle) => (
                <Tr key={vehicle.id}>
                  <Td>
                    <div className="flex items-center gap-3">
                      <div className="h-12 w-16 shrink-0 overflow-hidden rounded bg-ink-100">
                        {vehicle.coverPhotoKey ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={mediaUrl(vehicle.coverPhotoKey) ?? ""}
                            alt=""
                            className="h-full w-full object-cover"
                            loading="lazy"
                          />
                        ) : null}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/admin/estoque/${vehicle.id}`}
                          className="font-medium text-ink-900 hover:text-brand-600"
                        >
                          {vehicle.brand} {vehicle.model}
                        </Link>
                        {vehicle.version ? (
                          <p className="truncate text-xs text-ink-500">{vehicle.version}</p>
                        ) : null}
                        {vehicle.featured ? (
                          <Badge tone="info" className="mt-1">
                            destaque
                          </Badge>
                        ) : null}
                      </div>
                    </div>
                  </Td>
                  <Td className="whitespace-nowrap tabular-nums">
                    {vehicle.yearManufacture}/{vehicle.yearModel}
                  </Td>
                  <Td className="tabular-nums">{formatNumber(vehicle.mileageKm)}</Td>
                  <Td className="whitespace-nowrap tabular-nums">
                    {vehicle.priceOnRequest ? "Sob consulta" : formatCurrency(vehicle.priceCents)}
                  </Td>
                  <Td>
                    <VehicleStatusBadge status={vehicle.status} />
                  </Td>
                  <Td className="tabular-nums">{vehicle.photosCount}</Td>
                  <Td className="text-right">
                    <Link href={`/admin/estoque/${vehicle.id}`}>
                      <Button size="sm" variant="secondary">
                        {canWrite ? "Editar" : "Ver"}
                      </Button>
                    </Link>
                  </Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        )}
      </Card>

      {totalPages > 1 ? (
        <div className="mt-4 flex items-center justify-center gap-3 text-sm">
          {result.page > 1 ? (
            <Link href={pageHref(result.page - 1)} className="text-brand-600 hover:underline">
              Anterior
            </Link>
          ) : null}
          <span className="text-ink-500">
            Página {result.page} de {totalPages}
          </span>
          {result.page < totalPages ? (
            <Link href={pageHref(result.page + 1)} className="text-brand-600 hover:underline">
              Próxima
            </Link>
          ) : null}
        </div>
      ) : null}
    </>
  );
}
