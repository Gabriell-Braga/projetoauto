/**
 * Envio de e-mail transacional.
 *
 * Opcional: se RESEND_API_KEY e EMAIL_FROM estiverem configurados, o e-mail
 * sai por aqui (fetch puro, sem SDK — compatível com o runtime de Workers).
 * Sem provedor configurado, a função devolve `delivered: false` e quem chamou
 * decide o plano B (no caso da redefinição de senha, entregar o link pelo
 * Painel Geral).
 */
export type EmailResult = { delivered: boolean; reason?: string };

export function isEmailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function sendEmail(input: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<EmailResult> {
  if (!isEmailConfigured()) return { delivered: false, reason: "provedor não configurado" };

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [input.to],
        subject: input.subject,
        html: input.html,
        text: input.text,
      }),
    });

    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("[email] falha no envio:", response.status, detail.slice(0, 200));
      return { delivered: false, reason: `provedor respondeu ${response.status}` };
    }
    return { delivered: true };
  } catch (error) {
    console.error("[email] erro de rede:", error);
    return { delivered: false, reason: "erro de rede" };
  }
}

export function passwordResetEmail(input: { name: string; url: string; minutes: number }) {
  const text = [
    `Olá, ${input.name}.`,
    "",
    "Recebemos um pedido para redefinir a sua senha de acesso ao painel.",
    `Abra este link para escolher uma nova senha (vale por ${input.minutes} minutos):`,
    input.url,
    "",
    "Se não foi você, ignore esta mensagem: nada muda.",
  ].join("\n");

  const html = `<div style="font-family:system-ui,sans-serif;font-size:15px;line-height:1.5;color:#17181a">
  <p>Olá, ${escapeHtml(input.name)}.</p>
  <p>Recebemos um pedido para redefinir a sua senha de acesso ao painel.</p>
  <p><a href="${escapeHtml(input.url)}" style="display:inline-block;background:#d98e12;color:#17181a;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Escolher nova senha</a></p>
  <p style="color:#6b6f76;font-size:13px">O link vale por ${input.minutes} minutos. Se não foi você, ignore esta mensagem: nada muda.</p>
</div>`;

  return { subject: "Redefinir sua senha", text, html };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
