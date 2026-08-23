import { Badge } from "@/components/ui/badge";
import type { BillingStatus, LeadStatus, TenantStatus, VehicleStatus } from "@/db/schema";
import {
  BILLING_STATUS_LABELS,
  LEAD_STATUS_LABELS,
  VEHICLE_STATUS_LABELS,
} from "@/lib/catalog/labels";

const TENANT_TONES: Record<TenantStatus, "success" | "warning" | "danger"> = {
  active: "success",
  suspended: "warning",
  deleted: "danger",
};

const TENANT_LABELS: Record<TenantStatus, string> = {
  active: "Ativa",
  suspended: "Suspensa",
  deleted: "Excluída",
};

export function TenantStatusBadge({ status }: { status: TenantStatus }) {
  return <Badge tone={TENANT_TONES[status]}>{TENANT_LABELS[status]}</Badge>;
}

const BILLING_TONES: Record<BillingStatus, "success" | "warning" | "danger"> = {
  adimplente: "success",
  inadimplente: "warning",
  suspenso: "danger",
};

export function BillingStatusBadge({ status }: { status: BillingStatus | null }) {
  if (!status) return <Badge tone="neutral">Sem cobrança</Badge>;
  return <Badge tone={BILLING_TONES[status]}>{BILLING_STATUS_LABELS[status]}</Badge>;
}

const VEHICLE_TONES: Record<VehicleStatus, "neutral" | "success" | "warning" | "info"> = {
  draft: "neutral",
  available: "success",
  reserved: "warning",
  sold: "info",
};

export function VehicleStatusBadge({ status }: { status: VehicleStatus }) {
  return <Badge tone={VEHICLE_TONES[status]}>{VEHICLE_STATUS_LABELS[status]}</Badge>;
}

const LEAD_TONES: Record<LeadStatus, "info" | "warning" | "success" | "neutral"> = {
  new: "info",
  in_progress: "warning",
  won: "success",
  lost: "neutral",
};

export function LeadStatusBadge({ status }: { status: LeadStatus }) {
  return <Badge tone={LEAD_TONES[status]}>{LEAD_STATUS_LABELS[status]}</Badge>;
}
