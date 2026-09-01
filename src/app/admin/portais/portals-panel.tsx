"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Link2, Link2Off, Rss } from "lucide-react";
import { Alert } from "@/components/ui/alert";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useConfirm } from "@/components/ui/confirm";
import { Dialog } from "@/components/ui/dialog";
import { FormField, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiDelete, apiPost } from "@/lib/client/api";
import { PUBLICATION_LABELS, type PortalDefinition } from "@/lib/integrations/portals";
import { formatDateTime } from "@/lib/utils";

type Connection = {
  portal: string;
  status: string;
  hasCredentials: boolean;
  lastSyncAt: string | null;
  lastError: string | null;
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
  vaultReady,
  canWrite,
  tenantSlug,
}: {
  portals: PortalDefinition[];
  connections: Connection[];
  summary: Summary[];
  vaultReady: boolean;
  canWrite: boolean;
  tenantSlug: string;
}) {
  const router = useRouter();
  const toast = useToast();
  const confirm = useConfirm();
  const [connecting, setConnecting] = useState<PortalDefinition | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  async function handleDisconnect(portal: PortalDefinition) {
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
          bloqueado — guardar senha de terceiros sem cifra não é uma opção.
        </Alert>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        {portals.map((portal) => {
          const connection = connections.find((item) => item.portal === portal.key);
          const counts = summary.find((item) => item.portal === portal.key);
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
                    ) : (
                      <Button
                        type="button"
                        size="sm"
                        disabled={!vaultReady || portal.availability === "aguardando_acesso"}
                        onClick={() => setConnecting(portal)}
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

function StatusBadge({
  portal,
  connected,
}: {
  portal: PortalDefinition;
  connected: boolean;
}) {
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
  portal: PortalDefinition;
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
      <form id="connect-form" onSubmit={handleSubmit} noValidate>
        {portal.fields.map((field) => (
          <FormField key={field.key} label={field.label} htmlFor={`field-${field.key}`} hint={field.hint}>
            <Input
              id={`field-${field.key}`}
              type={field.secret ? "password" : "text"}
              autoComplete="off"
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
