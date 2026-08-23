/** Opcionais padronizados exibidos na ficha do veículo. */
export const VEHICLE_OPTIONS: { key: string; label: string; group: string }[] = [
  { key: "ar-condicionado", label: "Ar-condicionado", group: "Conforto" },
  { key: "direcao-hidraulica", label: "Direção hidráulica", group: "Conforto" },
  { key: "direcao-eletrica", label: "Direção elétrica", group: "Conforto" },
  { key: "vidros-eletricos", label: "Vidros elétricos", group: "Conforto" },
  { key: "travas-eletricas", label: "Travas elétricas", group: "Conforto" },
  { key: "banco-couro", label: "Bancos em couro", group: "Conforto" },
  { key: "ar-digital", label: "Ar-condicionado digital", group: "Conforto" },
  { key: "teto-solar", label: "Teto solar", group: "Conforto" },
  { key: "piloto-automatico", label: "Piloto automático", group: "Conforto" },
  { key: "start-stop", label: "Start/Stop", group: "Conforto" },
  { key: "abs", label: "Freios ABS", group: "Segurança" },
  { key: "airbag", label: "Airbag", group: "Segurança" },
  { key: "controle-tracao", label: "Controle de tração", group: "Segurança" },
  { key: "controle-estabilidade", label: "Controle de estabilidade", group: "Segurança" },
  { key: "sensor-re", label: "Sensor de ré", group: "Segurança" },
  { key: "camera-re", label: "Câmera de ré", group: "Segurança" },
  { key: "alarme", label: "Alarme", group: "Segurança" },
  { key: "isofix", label: "Fixação Isofix", group: "Segurança" },
  { key: "multimidia", label: "Central multimídia", group: "Tecnologia" },
  { key: "carplay", label: "Apple CarPlay / Android Auto", group: "Tecnologia" },
  { key: "gps", label: "GPS integrado", group: "Tecnologia" },
  { key: "computador-bordo", label: "Computador de bordo", group: "Tecnologia" },
  { key: "farol-led", label: "Faróis de LED", group: "Tecnologia" },
  { key: "farol-neblina", label: "Faróis de neblina", group: "Tecnologia" },
  { key: "rodas-liga", label: "Rodas de liga leve", group: "Externo" },
  { key: "engate", label: "Engate para reboque", group: "Externo" },
  { key: "capota-maritima", label: "Capota marítima", group: "Externo" },
  { key: "santo-antonio", label: "Santo Antônio", group: "Externo" },
  { key: "4x4", label: "Tração 4x4", group: "Mecânica" },
  { key: "blindado", label: "Blindado", group: "Mecânica" },
];

export const OPTION_LABELS: Record<string, string> = Object.fromEntries(
  VEHICLE_OPTIONS.map((option) => [option.key, option.label]),
);

export const OPTION_GROUPS = Array.from(new Set(VEHICLE_OPTIONS.map((option) => option.group)));
