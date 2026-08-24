"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox, FormField, Input } from "@/components/ui/field";
import { useToast } from "@/components/ui/toast";
import { apiPatch } from "@/lib/client/api";

export type ContactValues = {
  phone: string;
  whatsapp: string;
  email: string;
  addressStreet: string;
  addressNumber: string;
  addressComplement: string;
  addressDistrict: string;
  addressCity: string;
  addressState: string;
  addressZip: string;
  mapsUrl: string;
  businessHours: { weekday: number; open: string | null; close: string | null }[];
  social: { instagram?: string; facebook?: string; youtube?: string; tiktok?: string };
};

const WEEKDAYS = [
  "Domingo",
  "Segunda-feira",
  "Terça-feira",
  "Quarta-feira",
  "Quinta-feira",
  "Sexta-feira",
  "Sábado",
];

export function ContactPanel({
  initial,
  readOnly,
}: {
  initial: ContactValues;
  readOnly?: boolean;
}) {
  const router = useRouter();
  const toast = useToast();
  const [values, setValues] = useState(initial);
  const [hours, setHours] = useState(() =>
    WEEKDAYS.map((_, weekday) => {
      const found = initial.businessHours.find((hour) => hour.weekday === weekday);
      return {
        weekday,
        open: found?.open ?? "",
        close: found?.close ?? "",
        closed: !found || !found.open || !found.close,
      };
    }),
  );
  const [busy, setBusy] = useState(false);

  function update<K extends keyof ContactValues>(key: K, value: ContactValues[K]) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  async function handleSave() {
    setBusy(true);

    const result = await apiPatch("/api/admin/site", {
      phone: values.phone,
      whatsapp: values.whatsapp,
      email: values.email,
      addressStreet: values.addressStreet,
      addressNumber: values.addressNumber,
      addressComplement: values.addressComplement,
      addressDistrict: values.addressDistrict,
      addressCity: values.addressCity,
      addressState: values.addressState,
      addressZip: values.addressZip,
      mapsUrl: values.mapsUrl,
      social: values.social,
      businessHours: hours
        .filter((hour) => !hour.closed && hour.open && hour.close)
        .map((hour) => ({ weekday: hour.weekday, open: hour.open, close: hour.close })),
    });

    setBusy(false);
    if (!result.ok) {
      toast.error(result.error);
      return;
    }
    toast.success("Dados de contato salvos.");
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Contato</CardTitle>
          <CardDescription>
            O WhatsApp alimenta os botões de contato do site com mensagem já preenchida.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-4 sm:grid-cols-3">
            <FormField label="Telefone" htmlFor="phone">
              <Input
                id="phone"
                value={values.phone}
                disabled={readOnly}
                onChange={(event) => update("phone", event.target.value)}
                placeholder="(11) 3333-4444"
              />
            </FormField>
            <FormField label="WhatsApp" htmlFor="whatsapp" hint="Com DDD">
              <Input
                id="whatsapp"
                value={values.whatsapp}
                disabled={readOnly}
                onChange={(event) => update("whatsapp", event.target.value)}
                placeholder="(11) 99999-8888"
              />
            </FormField>
            <FormField label="E-mail" htmlFor="email">
              <Input
                id="email"
                type="email"
                value={values.email}
                disabled={readOnly}
                onChange={(event) => update("email", event.target.value)}
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Endereço</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
            <FormField label="Rua" htmlFor="addressStreet" className="lg:col-span-2">
              <Input
                id="addressStreet"
                value={values.addressStreet}
                disabled={readOnly}
                onChange={(event) => update("addressStreet", event.target.value)}
              />
            </FormField>
            <FormField label="Número" htmlFor="addressNumber">
              <Input
                id="addressNumber"
                value={values.addressNumber}
                disabled={readOnly}
                onChange={(event) => update("addressNumber", event.target.value)}
              />
            </FormField>
            <FormField label="Complemento" htmlFor="addressComplement">
              <Input
                id="addressComplement"
                value={values.addressComplement}
                disabled={readOnly}
                onChange={(event) => update("addressComplement", event.target.value)}
              />
            </FormField>
            <FormField label="Bairro" htmlFor="addressDistrict">
              <Input
                id="addressDistrict"
                value={values.addressDistrict}
                disabled={readOnly}
                onChange={(event) => update("addressDistrict", event.target.value)}
              />
            </FormField>
            <FormField label="CEP" htmlFor="addressZip">
              <Input
                id="addressZip"
                value={values.addressZip}
                disabled={readOnly}
                onChange={(event) => update("addressZip", event.target.value)}
              />
            </FormField>
            <FormField label="Cidade" htmlFor="addressCity">
              <Input
                id="addressCity"
                value={values.addressCity}
                disabled={readOnly}
                onChange={(event) => update("addressCity", event.target.value)}
              />
            </FormField>
            <FormField label="UF" htmlFor="addressState">
              <Input
                id="addressState"
                maxLength={2}
                value={values.addressState}
                disabled={readOnly}
                onChange={(event) => update("addressState", event.target.value.toUpperCase())}
              />
            </FormField>
            <FormField label="Link do Google Maps" htmlFor="mapsUrl" className="lg:col-span-3">
              <Input
                id="mapsUrl"
                value={values.mapsUrl}
                disabled={readOnly}
                onChange={(event) => update("mapsUrl", event.target.value)}
                placeholder="https://maps.google.com/..."
              />
            </FormField>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Horário de funcionamento</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-2">
            {hours.map((hour, index) => (
              <div key={hour.weekday} className="flex flex-wrap items-center gap-3">
                <span className="w-32 text-[13px] text-muted">{WEEKDAYS[hour.weekday]}</span>
                <label className="flex items-center gap-2 text-[13px] text-muted">
                  <Checkbox
                    checked={hour.closed}
                    disabled={readOnly}
                    onChange={(event) => {
                      const next = [...hours];
                      next[index] = { ...hour, closed: event.target.checked };
                      setHours(next);
                    }}
                  />
                  Fechado
                </label>
                <Input
                  type="time"
                  className="w-32"
                  value={hour.open}
                  disabled={readOnly || hour.closed}
                  onChange={(event) => {
                    const next = [...hours];
                    next[index] = { ...hour, open: event.target.value };
                    setHours(next);
                  }}
                />
                <span className="text-[13px] text-faint">às</span>
                <Input
                  type="time"
                  className="w-32"
                  value={hour.close}
                  disabled={readOnly || hour.closed}
                  onChange={(event) => {
                    const next = [...hours];
                    next[index] = { ...hour, close: event.target.value };
                    setHours(next);
                  }}
                />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Redes sociais</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-x-4 sm:grid-cols-2 lg:grid-cols-4">
            {(["instagram", "facebook", "youtube", "tiktok"] as const).map((network) => (
              <FormField
                key={network}
                label={network.charAt(0).toUpperCase() + network.slice(1)}
                htmlFor={network}
              >
                <Input
                  id={network}
                  value={values.social[network] ?? ""}
                  disabled={readOnly}
                  onChange={(event) =>
                    update("social", { ...values.social, [network]: event.target.value })
                  }
                  placeholder="https://..."
                />
              </FormField>
            ))}
          </div>
        </CardContent>
      </Card>


      {!readOnly ? (
        <Button type="button" loading={busy} onClick={handleSave}>
          Salvar contato
        </Button>
      ) : null}
    </div>
  );
}
