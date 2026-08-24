"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronRight, MessageCircle } from "lucide-react";
import { LeadStatusBadge } from "@/components/admin/status-badges";
import { Button } from "@/components/ui/button";
import { Select, Textarea } from "@/components/ui/field";
import { Td, Tr } from "@/components/ui/table";
import { useToast } from "@/components/ui/toast";
import { LEAD_STATUS, type LeadStatus } from "@/db/schema";
import { LEAD_STATUS_LABELS } from "@/lib/catalog/labels";
import { apiPatch } from "@/lib/client/api";
import { cn, formatDateTime, formatPhone, onlyDigits } from "@/lib/utils";

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
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [savingNotes, setSavingNotes] = useState(false);
  const [notes, setNotes] = useState(lead.internalNotes ?? "");

  // otimista: a linha reflete a escolha na hora e volta atrás se a API recusar
  const [status, setStatus] = useState(lead.status);
  const [assignee, setAssignee] = useState(lead.assignedToUserId ?? "");

  async function patch(payload: Record<string, unknown>, rollback: () => void, message: string) {
    const result = await apiPatch(`/api/admin/leads/${lead.id}`, payload);
    if (!result.ok) {
      rollback();
      toast.error(result.error);
      return;
    }
    toast.success(message);
    router.refresh();
  }

  const whatsappDigits = onlyDigits(lead.phone);
  const whatsappHref = `https://wa.me/${
    whatsappDigits.length > 11 ? whatsappDigits : `55${whatsappDigits}`
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
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
            className="flex items-center gap-1.5 text-left"
          >
            <ChevronRight
              aria-hidden="true"
              className={cn(
                "h-3.5 w-3.5 shrink-0 text-faint transition-transform",
                open && "rotate-90",
              )}
            />
            <span>
              <span className="block font-medium text-text">{lead.name}</span>
              <span className="block text-xs text-faint">{formatPhone(lead.phone)}</span>
            </span>
          </button>
        </Td>

        <Td className="max-w-56">
          <span className="block truncate text-muted">
            {lead.vehicleLabel ?? <span className="text-faint">Contato geral</span>}
          </span>
          {lead.utmSource ? (
            <span className="label-instrument text-faint">via {lead.utmSource}</span>
          ) : null}
        </Td>

        <Td>
          {canWrite ? (
            <Select
              aria-label={`Situação do lead de ${lead.name}`}
              className="h-7 w-36 text-xs"
              value={status}
              onChange={(event) => {
                const next = event.target.value as LeadStatus;
                const previous = status;
                setStatus(next);
                void patch({ status: next }, () => setStatus(previous), "Situação atualizada.");
              }}
            >
              {LEAD_STATUS.map((value) => (
                <option key={value} value={value}>
                  {LEAD_STATUS_LABELS[value]}
                </option>
              ))}
            </Select>
          ) : (
            <LeadStatusBadge status={status} />
          )}
        </Td>

        <Td>
          {canWrite ? (
            <Select
              aria-label={`Responsável pelo lead de ${lead.name}`}
              className="h-7 w-40 text-xs"
              value={assignee}
              onChange={(event) => {
                const next = event.target.value;
                const previous = assignee;
                setAssignee(next);
                void patch(
                  { assignedToUserId: next || null },
                  () => setAssignee(previous),
                  "Responsável atualizado.",
                );
              }}
            >
              <option value="">Sem responsável</option>
              {assignees.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.name}
                </option>
              ))}
            </Select>
          ) : (
            <span className="text-muted">{lead.assignedToName ?? "—"}</span>
          )}
        </Td>

        <Td numeric className="whitespace-nowrap text-muted">
          {formatDateTime(new Date(lead.createdAt))}
        </Td>

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
        <Tr className="hover:bg-transparent">
          <Td colSpan={6} className="h-auto bg-surface-2/50 py-4">
            <div className="grid gap-5 lg:grid-cols-2">
              <div>
                <p className="label-instrument mb-1.5 text-muted">Mensagem do cliente</p>
                {lead.message ? (
                  <p className="whitespace-pre-line text-[13px] leading-relaxed text-text">
                    {lead.message}
                  </p>
                ) : (
                  <p className="text-[13px] text-faint">Sem mensagem.</p>
                )}
                {lead.email ? (
                  <p className="mt-3 text-xs text-muted">
                    E-mail: <span className="text-text">{lead.email}</span>
                  </p>
                ) : null}
              </div>

              <div>
                <p className="label-instrument mb-1.5 text-muted">Anotações internas</p>
                <Textarea
                  rows={3}
                  value={notes}
                  disabled={!canWrite}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Combinou test drive, pediu avaliação de troca…"
                />
                {canWrite ? (
                  <Button
                    type="button"
                    size="sm"
                    variant="secondary"
                    className="mt-2"
                    loading={savingNotes}
                    onClick={async () => {
                      setSavingNotes(true);
                      await patch({ internalNotes: notes }, () => {}, "Anotação salva.");
                      setSavingNotes(false);
                    }}
                  >
                    Salvar anotação
                  </Button>
                ) : null}
              </div>
            </div>
          </Td>
        </Tr>
      ) : null}
    </>
  );
}
