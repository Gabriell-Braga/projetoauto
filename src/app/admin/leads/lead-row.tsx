"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";
import { Td, Tr } from "@/components/ui/table";
import { LEAD_STATUS, type LeadStatus } from "@/db/schema";
import { LEAD_STATUS_LABELS } from "@/lib/catalog/labels";
import { LeadStatusBadge } from "@/components/admin/status-badges";
import { apiPatch } from "@/lib/client/api";
import { formatDateTime, formatPhone, onlyDigits } from "@/lib/utils";

export type LeadRowData = {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  message: string | null;
  vehicleLabel: string | null;
  status: LeadStatus;
  internalNotes: string | null;
  assignedToUserId: string | null;
  assignedToName: string | null;
  utmSource: string | null;
  createdAt: string;
};

export function LeadRow({
  lead,
  assignees,
  canWrite,
}: {
  lead: LeadRowData;
  assignees: { id: string; name: string }[];
  canWrite: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notes, setNotes] = useState(lead.internalNotes ?? "");
  const [error, setError] = useState<string | null>(null);

  async function patch(payload: Record<string, unknown>) {
    setBusy(true);
    setError(null);
    const result = await apiPatch(`/api/admin/leads/${lead.id}`, payload);
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.refresh();
  }

  const whatsappHref = `https://wa.me/${
    onlyDigits(lead.phone).length > 11 ? onlyDigits(lead.phone) : `55${onlyDigits(lead.phone)}`
  }?text=${encodeURIComponent(
    lead.vehicleLabel
      ? `Olá ${lead.name.split(" ")[0]}! Vi que você tem interesse no ${lead.vehicleLabel}.`
      : `Olá ${lead.name.split(" ")[0]}! Recebemos seu contato pelo nosso site.`,
  )}`;

  return (
    <>
      <Tr>
        <Td>
          <button
            type="button"
            onClick={() => setOpen((value) => !value)}
            className="text-left font-medium text-ink-900 hover:text-brand-600"
          >
            {lead.name}
          </button>
          <p className="text-xs text-ink-500">{formatPhone(lead.phone)}</p>
          {lead.email ? <p className="text-xs text-ink-400">{lead.email}</p> : null}
        </Td>
        <Td className="max-w-56 text-xs">
          {lead.vehicleLabel ?? <span className="text-ink-400">Contato geral</span>}
          {lead.utmSource ? (
            <p className="mt-0.5 text-[11px] text-ink-400">origem: {lead.utmSource}</p>
          ) : null}
        </Td>
        <Td>
          {canWrite ? (
            <Select
              className="h-8 text-xs"
              value={lead.status}
              disabled={busy}
              onChange={(event) => patch({ status: event.target.value })}
            >
              {LEAD_STATUS.map((status) => (
                <option key={status} value={status}>
                  {LEAD_STATUS_LABELS[status]}
                </option>
              ))}
            </Select>
          ) : (
            <LeadStatusBadge status={lead.status} />
          )}
        </Td>
        <Td>
          {canWrite ? (
            <Select
              className="h-8 text-xs"
              value={lead.assignedToUserId ?? ""}
              disabled={busy}
              onChange={(event) =>
                patch({ assignedToUserId: event.target.value || null })
              }
            >
              <option value="">Sem responsável</option>
              {assignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          ) : (
            <span className="text-xs">{lead.assignedToName ?? "—"}</span>
          )}
        </Td>
        <Td className="whitespace-nowrap text-xs">{formatDateTime(new Date(lead.createdAt))}</Td>
        <Td className="text-right">
          <a href={whatsappHref} target="_blank" rel="noopener noreferrer">
            <Button type="button" size="sm" variant="secondary">
              <MessageCircle className="h-3.5 w-3.5" />
              WhatsApp
            </Button>
          </a>
        </Td>
      </Tr>

      {open ? (
        <Tr>
          <Td colSpan={6} className="bg-ink-50">
            {lead.message ? (
              <div className="mb-3">
                <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
                  Mensagem do cliente
                </p>
                <p className="mt-1 whitespace-pre-line text-sm text-ink-700">{lead.message}</p>
              </div>
            ) : null}

            <p className="text-xs font-medium uppercase tracking-wide text-ink-500">
              Anotações internas
            </p>
            <Textarea
              className="mt-1"
              rows={3}
              value={notes}
              disabled={!canWrite || busy}
              onChange={(event) => setNotes(event.target.value)}
            />
            {canWrite ? (
              <Button
                type="button"
                size="sm"
                className="mt-2"
                disabled={busy}
                onClick={() => patch({ internalNotes: notes })}
              >
                Salvar anotação
              </Button>
            ) : null}
            {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
          </Td>
        </Tr>
      ) : null}
    </>
  );
}
