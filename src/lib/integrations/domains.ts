import type { DnsRecord } from "@/db/schema";

/**
 * Regras de domínio, separadas de quem fala com a Vercel.
 *
 * Tudo aqui é função pura: o que decide se um endereço é válido, se ele é raiz
 * ou subdomínio, e qual registro de DNS pedir. É a parte que erra calado — um
 * CNAME onde devia ir um registro A não dá erro em lugar nenhum, o site
 * simplesmente nunca sobe, e a revenda passa duas semanas achando que o
 * problema é do provedor dela.
 */

/**
 * Valores documentados pela Vercel para apontar um domínio.
 *
 * Ficam aqui para a tela ter o que mostrar antes de qualquer chamada de rede,
 * mas a autoridade é a resposta da API: quando ela devolve os registros
 * esperados, é ela que manda. Estes são o ponto de partida, não a verdade.
 */
export const VERCEL_APEX_IP = "76.76.21.21";
export const VERCEL_CNAME_TARGET = "cname.vercel-dns.com";

/**
 * Sufixos de dois rótulos que se comportam como raiz.
 *
 * `revenda.com.br` tem três partes e mesmo assim é a raiz do domínio: quem
 * contar rótulos vai achar que é subdomínio e mandar criar um CNAME, que no
 * apex é inválido — a maioria dos provedores nem aceita, e os que aceitam
 * quebram o e-mail da revenda junto. Praticamente todo cliente daqui usa
 * `.com.br`, então errar isso é errar no caso comum, não no exótico.
 */
const TWO_LABEL_SUFFIXES = new Set([
  "com.br",
  "net.br",
  "org.br",
  "adv.br",
  "eng.br",
  "ind.br",
  "srv.br",
  "vet.br",
  "art.br",
  "esp.br",
  "tur.br",
  "agr.br",
  "co.uk",
  "com.ar",
  "com.py",
  "com.uy",
  "com.co",
  "com.mx",
]);

const LABEL = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?$/;

export type DomainCheck = { ok: true; domain: string } | { ok: false; reason: string };

/**
 * Deixa o que a pessoa colou num hostname, ou explica por que não dá.
 *
 * Ninguém digita "revenda.com.br" limpo: vem `https://`, vem barra no fim, vem
 * caminho colado, vem espaço do copiar e colar. Recusar tudo isso seria
 * tecnicamente correto e péssimo — a pessoa não sabe o que é hostname, ela sabe
 * o endereço do site dela.
 *
 * O que NÃO é limpo é o `www`: `www.revenda.com.br` e `revenda.com.br` são
 * endereços diferentes, com registros de DNS diferentes. Comer o `www` aqui
 * faria a tela pedir o registro errado.
 */
export function normalizeDomain(input: string): DomainCheck {
  let value = input.trim().toLowerCase();

  value = value.replace(/^https?:\/\//, "");
  value = value.replace(/^\/+/, "");
  // corta caminho, query e âncora — sobra só o host
  value = value.split(/[/?#]/)[0];
  // porta e ponto final (raiz absoluta do DNS) não fazem parte do nome
  value = value.split(":")[0].replace(/\.$/, "");

  if (!value) return { ok: false, reason: "Informe o endereço do site." };
  if (value.length > 253) return { ok: false, reason: "Endereço longo demais." };
  if (value.includes(" ")) return { ok: false, reason: "O endereço não pode ter espaços." };
  if (value.startsWith("*.")) {
    return { ok: false, reason: "Curinga não é aceito: cadastre o endereço exato." };
  }

  const labels = value.split(".");
  if (labels.length < 2) {
    return { ok: false, reason: "Falta a terminação do endereço, como .com.br." };
  }

  for (const label of labels) {
    if (!label) return { ok: false, reason: "O endereço tem um ponto sobrando." };
    if (label.length > 63) return { ok: false, reason: "Uma parte do endereço é longa demais." };
    if (!LABEL.test(label)) {
      return {
        ok: false,
        reason: `"${label}" tem caractere que não vale em endereço de site.`,
      };
    }
  }

  return { ok: true, domain: value };
}

/**
 * O domínio é a raiz, ou é um subdomínio dela?
 *
 * Decide qual registro a revenda vai criar, e é a única pergunta desta tela
 * cuja resposta errada não aparece em lugar nenhum até o site não subir.
 */
export function isApexDomain(domain: string): boolean {
  const labels = domain.split(".");
  if (labels.length <= 2) return true;

  const lastTwo = labels.slice(-2).join(".");
  // "revenda.com.br" -> sufixo "com.br" + um rótulo = ainda é raiz
  return labels.length === 3 && TWO_LABEL_SUFFIXES.has(lastTwo);
}

/** O rótulo que vai na coluna "nome" do painel de DNS. */
export function dnsRecordName(domain: string): string {
  if (isApexDomain(domain)) return "@";
  const labels = domain.split(".");
  const suffixLabels = TWO_LABEL_SUFFIXES.has(labels.slice(-2).join(".")) ? 3 : 2;
  return labels.slice(0, labels.length - suffixLabels).join(".");
}

/**
 * O que a revenda precisa criar no DNS para o site subir.
 *
 * Raiz não aceita CNAME — vai registro A apontando para o IP. Subdomínio vai
 * CNAME, que é melhor porque sobrevive a uma troca de IP do lado da Vercel sem
 * ninguém precisar avisar a revenda.
 */
export function dnsInstructionsFor(domain: string): DnsRecord {
  return isApexDomain(domain)
    ? { type: "A", name: "@", value: VERCEL_APEX_IP }
    : { type: "CNAME", name: dnsRecordName(domain), value: VERCEL_CNAME_TARGET };
}

/** O par natural de um domínio: a raiz sugere o `www`, e o `www` sugere a raiz. */
export function suggestedPair(domain: string): string | null {
  if (domain.startsWith("www.")) return domain.slice(4);
  return isApexDomain(domain) ? `www.${domain}` : null;
}

export type VercelDomainState = {
  verified: boolean;
  misconfigured: boolean;
  /** Registros que a Vercel exige e ainda não encontrou. */
  missing: DnsRecord[];
};

export type DomainVerdict = {
  status: "pendente" | "ativo" | "erro";
  /** Frase pronta para a tela — em português, dizendo o próximo passo. */
  message: string;
  pendingRecords: DnsRecord[];
};

/**
 * Traduz o que a Vercel respondeu para o que a revenda precisa fazer agora.
 *
 * A API distingue "não verificado" de "mal configurado", e os dois viram
 * "pendente" aqui — a diferença importa para o texto, não para o estado. O que
 * a pessoa quer saber é se já pode divulgar o endereço, e qual é o próximo
 * passo se ainda não.
 */
export function domainVerdict(domain: string, state: VercelDomainState): DomainVerdict {
  if (!state.verified) {
    // a Vercel só exige TXT quando o domínio já está em uso em outra conta
    const records = state.missing.length > 0 ? state.missing : [dnsInstructionsFor(domain)];
    return {
      status: "pendente",
      message:
        "Falta provar que o domínio é seu. Crie o registro abaixo no painel onde o domínio foi registrado.",
      pendingRecords: records,
    };
  }

  if (state.misconfigured) {
    return {
      status: "pendente",
      message:
        "O domínio é seu, mas ainda não aponta para cá. Crie o registro abaixo e aguarde — a propagação leva de minutos a algumas horas.",
      pendingRecords: state.missing.length > 0 ? state.missing : [dnsInstructionsFor(domain)],
    };
  }

  return {
    status: "ativo",
    message: "No ar. O site já responde neste endereço, com certificado válido.",
    pendingRecords: [],
  };
}
