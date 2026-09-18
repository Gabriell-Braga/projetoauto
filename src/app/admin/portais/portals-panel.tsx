"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Link2, Link2Off, RefreshCw, Rss } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiDelete, apiPost } from "@/lib/client/api";
import { PUBLICATION_LABELS, type PortalCard } from "@/lib/integrations/portals";
import { formatDateTime } from "@/lib/utils";

type Connection = {
  portal: string;
  status: string;
  hasCredentials: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
};

type Listing = {
  portal: string;
  vehicleId: string;
  vehicle: string;
  url: string | null;
  note: string | null;
};

type Problem = {
  portal: string;
  vehicleId: string;
  vehicle: string;
  error: string;
};

type SyncReport = {
  portal: string;
  published: number;
  updated: number;
  removed: number;
  failed: number;
  error?: string;
};

type Summary = {
  portal: string;
  pendente: number;
  publicado: number;
  removendo: number;
  removido: number;
  erro: number;
};

export function PortalsPanel({
  portals,
  connections,
  summary,
  listings,
  problems,
  vaultReady,
  canWrite,
  tenantSlug,
  notice,
}: {
  portals: PortalCard[];
  connections: Connection[];
  summary: Summary[];
  listings: Listing[];
  problems: Problem[];
  vaultReady: boolean;
  canWrite: boolean;
  tenantSlug: string;
  /** Resultado do retorno do OAuth, lido da URL pela página. */
  notice: { portal: string; error: string | null } | null;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [connecting, setConnecting] = useState<PortalCard | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const noticeShown = useRef(false);

  // o portal devolve a pessoa numa URL com o resultado; mostra uma vez e limpa
  useEffect(() => {
    if (!notice || noticeShown.current) return;
    noticeShown.current = true;
    const name = portals.find((portal) => portal.key === notice.portal)?.name ?? notice.portal;
    if (notice.error) toast.error(`Não consegui conectar ${name}`, notice.error);
    else toast.success(`${name} conectado`, "O estoque entra na fila de publicação.");
    router.replace("/admin/portais");
    // só na chegada: o toast não deve repetir a cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleConnect(portal: PortalCard) {
    if (portal.method !== "oauth") {
      setConnecting(portal);
      return;
    }
    setBusy(portal.key);
    const result = await apiPost<{ url: string }>(`/api/admin/portals/${portal.key}/oauth`, {});
    if (!result.ok) {
      setBusy(null);
      toast.error("Não consegui conectar", result.error);
      return;
    }
    // a autorização acontece no portal; ele traz a pessoa de volta pelo callback
    window.location.assign(result.data.url);
  }

  async function handleSync(portal: PortalCard) {
    setBusy(`sync:${portal.key}`);
    const result = await apiPost<{ reports: SyncReport[] }>("/api/admin/portals/sync", {});
    setBusy(null);

    if (!result.ok) {
      toast.error("Não consegui sincronizar", result.error);
      return;
    }
    const report = result.data.reports.find((item) => item.portal === portal.key);
    if (!report) {
      toast.info("Nada para sincronizar", "A fila deste portal está vazia.");
    } else if (report.error) {
      toast.error(`${portal.name} parou`, report.error);
    } else {
      const parts = [
        report.published ? `${report.published} publicado(s)` : null,
        report.updated ? `${report.updated} atualizado(s)` : null,
        report.removed ? `${report.removed} removido(s)` : null,
        report.failed ? `${report.failed} com erro` : null,
      ].filter(Boolean);
      const summaryText = parts.length > 0 ? parts.join(", ") : "Nada mudou.";
      if (report.failed > 0)
        toast.error(`${portal.name}: ${summaryText}`, "Veja os motivos no card.");
      else toast.success(`${portal.name} sincronizado`, summaryText);
    }
    router.refresh();
  }

  async function handleDisconnect(portal: PortalCard) {
    const confirmed = await confirm({
      title: `Desconectar ${portal.name}`,
      description:
        "As credenciais são apagadas daqui e os anúncios entram na fila de remoção. Enquanto a remoção não acontece, eles continuam no ar no portal.",
      confirmLabel: "Desconectar",
      tone: "danger",
    });
    if (!confirmed) return;

    setBusy(portal.key);
    const result = await apiDelete(`/api/admin/portals/${portal.key}`);
    setBusy(null);

    if (!result.ok) {
      toast.error("Não consegui desconectar", result.error);
      return;
    }
    toast.success(`${portal.name} desconectado`);
    router.refresh();
  }

  return (
    <>
      {!vaultReady ? (
        <Alert tone="danger" className="mb-4">
          O cofre de credenciais não está configurado nesta instalação. Conectar um portal está
          bloqueado: guardar senha de terceiros sem cifra não é uma opção.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {portals.map((portal) => {
          const connection = connections.find((item) => item.portal === portal.key);
          const counts = summary.find((item) => item.portal === portal.key);
          const portalProblems = problems.filter((item) => item.portal === portal.key);
          const portalListings = listings.filter((item) => item.portal === portal.key);
          const connected = connection?.status === "conectado";

          return (
            <Card key={portal.key}>
              <CardHeader className="flex flex-row items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{portal.name}</CardTitle>
                    <StatusBadge portal={portal} connected={connected} />
                  </div>
                  <CardDescription>{portal.howToConnect}</CardDescription>
                </div>
              </CardHeader>

              <CardContent>
                {connection?.lastError ? (
                  <Alert tone="danger" className="mb-3">
                    {connection.lastError}
                  </Alert>
                ) : null}

                {counts ? (
                  <div className="mb-3 flex flex-wrap gap-3 text-[13px]">
                    <Count label={PUBLICATION_LABELS.publicado} value={counts.publicado} />
                    <Count label={PUBLICATION_LABELS.pendente} value={counts.pendente} />
                    {counts.erro > 0 ? (
                      <Count label={PUBLICATION_LABELS.erro} value={counts.erro} alert />
                    ) : null}
                  </div>
                ) : null}

                {connection?.lastSyncAt ? (
                  <p className="mb-3 text-xs text-faint">
                    Última sincronização em {formatDateTime(new Date(connection.lastSyncAt))}
                  </p>
                ) : null}

                {portalListings.length > 0 ? (
                  <ul className="mb-3 space-y-1.5 rounded border border-border p-3 text-[13px]">
                    {portalListings.map((listing) => (
                      <li key={listing.vehicleId}>
                        {listing.url ? (
                          <a
                            href={listing.url}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 font-medium text-text underline-offset-2 hover:underline"
                          >
                            {listing.vehicle}
                            <ExternalLink className="h-3 w-3" />
                          </a>
                        ) : (
                          <span className="font-medium text-text">{listing.vehicle}</span>
                        )}
                        {listing.note ? (
                          <span className="text-muted"> — {listing.note}</span>
                        ) : null}
                      </li>
                    ))}
                  </ul>
                ) : null}

                {portalProblems.length > 0 ? (
                  <ul className="mb-3 space-y-1.5 rounded border border-danger/30 bg-danger/5 p-3 text-[13px]">
                    {portalProblems.map((problem) => (
                      <li key={problem.vehicleId}>
                        <Link
                          href={`/admin/estoque/${problem.vehicleId}`}
                          className="font-medium text-text underline-offset-2 hover:underline"
                        >
                          {problem.vehicle}
                        </Link>
                        <span className="text-muted"> — {problem.error}</span>
                      </li>
                    ))}
                  </ul>
                ) : null}

                {portal.method === "feed" ? (
                  <a
                    href={`/r/${tenantSlug}/estoque.xml`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex h-8 items-center gap-2 rounded border border-border px-3 text-[13px] text-text hover:bg-surface-2"
                  >
                    <Rss className="h-3.5 w-3.5" />
                    Ver o feed
                  </a>
                ) : canWrite ? (
                  <div className="flex flex-wrap gap-2">
                    {connected ? (
                      <>
                        <Button
                          type="button"
                          size="sm"
                          loading={busy === `sync:${portal.key}`}
                          onClick={() => handleSync(portal)}
                        >
                          <RefreshCw className="h-3.5 w-3.5" />
                          Sincronizar agora
                        </Button>
                        <Button
                          type="button"
                          variant="outlineDanger"
                          size="sm"
                          loading={busy === portal.key}
                          onClick={() => handleDisconnect(portal)}
                        >
                          <Link2Off className="h-3.5 w-3.5" />
                          Desconectar
                        </Button>
                      </>
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={!vaultReady || portal.availability === "aguardando_acesso"}
                        loading={busy === portal.key}
                        onClick={() => handleConnect(portal)}
                      >
                        <Link2 className="h-3.5 w-3.5" />
                        Conectar conta
                      </Button>
                    )}
                  </div>
                ) : null}

                {portal.availability === "aguardando_acesso" ? (
                  <p className="mt-2 text-xs text-faint">
                    Liberamos assim que o acesso de integração deste portal estiver disponível.
                  </p>
                ) : null}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {connecting ? (
        <ConnectDialog
          portal={connecting}
          onClose={() => setConnecting(null)}
          onSaved={() => {
            setConnecting(null);
            router.refresh();
          }}
        />
      ) : null}
    </>
  );
}

function StatusBadge({ portal, connected }: { portal: PortalCard; connected: boolean }) {
  if (portal.method === "feed") return <Badge tone="info">Sempre disponível</Badge>;
  if (connected) return <Badge tone="success">Conectado</Badge>;

  const tone: BadgeTone = portal.availability === "pronto" ? "neutral" : "warning";
  const label = portal.availability === "pronto" ? "Não conectado" : "Aguardando acesso";
  return <Badge tone={tone}>{label}</Badge>;
}

function Count({ label, value, alert }: { label: string; value: number; alert?: boolean }) {
  return (
    <div>
      <p className="label-instrument text-muted">{label}</p>
      <p className={alert ? "tabular-nums text-danger" : "tabular-nums text-text"}>{value}</p>
    </div>
  );
}

function ConnectDialog({
  portal,
  onClose,
  onSaved,
}: {
  portal: PortalCard;
  onClose: () => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);

    const result = await apiPost(`/api/admin/portals/${portal.key}`, { credentials: values });
    setSaving(false);

    if (!result.ok) {
      toast.error("Não consegui conectar", result.error);
      return;
    }
    toast.success(`${portal.name} conectado`, "O estoque entra na fila de publicação.");
    onSaved();
  }

  return (
    <Dialog
      open
      size="md"
      onClose={onClose}
      title={`Conectar ${portal.name}`}
      description={portal.howToConnect}
      footer={
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button type="submit" form="connect-form" loading={saving}>
            Conectar
          </Button>
        </div>
      }
    >
      <form id="connect-form" onSubmit={handleSubmit} noValidate autoComplete="off">
        {portal.fields.map((field) => (
          <FormField
            key={field.key}
            label={field.label}
            htmlFor={`field-${field.key}`}
            hint={field.hint}
          >
            <Input
              id={`field-${field.key}`}
              type={field.secret ? "password" : "text"}
              autoComplete="new-password"
              autoCorrect="off"
              autoCapitalize="off"
              spellCheck={false}
              data-1p-ignore
              data-lpignore="true"
              value={values[field.key] ?? ""}
              onChange={(event) =>
                setValues((current) => ({ ...current, [field.key]: event.target.value }))
              }
            />
          </FormField>
        ))}

        <Alert tone="info">
          As credenciais são cifradas antes de tocar no banco e nunca voltam para esta tela. Para
          trocá-las, basta conectar de novo.
        </Alert>
      </form>
    </Dialog>
  );
}
