import type { Metadata } from "next";
import Link from "next/link";
import { PageHeader } from "@/components/layout/shell";
import { Pagination } from "@/components/admin/pagination";
import { StatCard, StatGrid } from "@/components/admin/stat-card";
import { VehicleStatusBadge } from "@/components/admin/status-badges";
import { VehicleThumb } from "@/components/admin/vehicle-thumb";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input, Label, Select } from "@/components/ui/field";
import { EmptyState, Table, Td, Th, Thead, Tr } from "@/components/ui/table";
import { VEHICLE_STATUS, type VehicleStatus } from "@/db/schema";
import { requireTenantPage } from "@/lib/auth/guards";
import { can } from "@/lib/auth/rbac";
import { VEHICLE_STATUS_LABELS } from "@/lib/catalog/labels";
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

  return (
    <>
      <PageHeader
        title="Estoque"
        description={`${formatNumber(result.total)} veículo(s) no filtro atual.`}
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
        <StatCard label="Rascunhos" value={formatNumber(stats.draft)} hint="Fora do site" />
        <StatCard label="Em destaque" value={formatNumber(stats.featured)} hint="Na home" />
      </StatGrid>

      <Card className="mb-3">
        <form className="flex flex-wrap items-end gap-3 px-4 py-3.5" action="/admin/estoque">
          <div className="min-w-56 flex-1">
            <Label htmlFor="q">Buscar</Label>
            <Input
              id="q"
              name="q"
              defaultValue={params.q ?? ""}
              placeholder="Marca, modelo ou versão"
            />
          </div>
          <div>
            <Label htmlFor="status">Situação</Label>
            <Select id="status" name="status" defaultValue={status ?? ""} className="w-40">
              <option value="">Todas</option>
              {VEHICLE_STATUS.map((value) => (
                <option key={value} value={value}>
                  {VEHICLE_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="sort">Ordenar por</Label>
            <Select id="sort" name="sort" defaultValue={params.sort ?? "recentes"} className="w-44">
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
            description="Ajuste os filtros ou cadastre um veículo para ele aparecer no site."
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
                <Th numeric>Ano</Th>
                <Th numeric>KM</Th>
                <Th numeric>Preço</Th>
                <Th>Situação</Th>
                <Th numeric>Fotos</Th>
                <Th />
              </Tr>
            </Thead>
            <tbody>
              {result.items.map((vehicle) => (
                <Tr key={vehicle.id}>
                  <Td>
                    <div className="flex items-center gap-2.5">
                      <VehicleThumb
                        photoKey={vehicle.coverPhotoKey}
                        alt={`${vehicle.brand} ${vehicle.model}`}
                      />
                      <div className="min-w-0">
                        <Link
                          href={`/admin/estoque/${vehicle.id}`}
                          className="font-medium text-text transition-colors hover:text-accent-text"
                        >
                          {vehicle.brand} {vehicle.model}
                        </Link>
                        <div className="flex items-center gap-2">
                          {vehicle.version ? (
                            <p className="truncate text-xs text-faint">{vehicle.version}</p>
                          ) : null}
                          {vehicle.featured ? <Badge tone="info">Destaque</Badge> : null}
                        </div>
                      </div>
                    </div>
                  </Td>
                  <Td numeric className="whitespace-nowrap text-muted">
                    {vehicle.yearManufacture}/{vehicle.yearModel}
                  </Td>
                  <Td numeric className="text-muted">
                    {formatNumber(vehicle.mileageKm)}
                  </Td>
                  <Td numeric className="whitespace-nowrap font-medium">
                    {vehicle.priceOnRequest ? (
                      <span className="text-muted">Sob consulta</span>
                    ) : (
                      formatCurrency(vehicle.priceCents)
                    )}
                  </Td>
                  <Td>
                    <VehicleStatusBadge status={vehicle.status} />
                  </Td>
                  <Td numeric className={vehicle.photosCount === 0 ? "text-danger" : "text-muted"}>
                    {vehicle.photosCount}
                  </Td>
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

      <Pagination
        basePath="/admin/estoque"
        page={result.page}
        total={result.total}
        pageSize={result.pageSize}
        params={{ q: params.q, status, sort: params.sort }}
      />
    </>
  );
}
