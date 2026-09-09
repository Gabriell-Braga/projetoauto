import type {
  BusinessHours,
  SiteReviews,
  SiteStats,
  SocialLinks,
} from "@/db/schema";

/**
 * Dados de apresentação da revenda de teste.
 *
 * TEMPORÁRIO, como o resto da semeadura.
 *
 * Preenche o que o Vitrine desenha e que o cadastro deixa vazio por padrão:
 * endereço completo, horários, textos do Sobre, números da faixa, depoimentos
 * e as páginas jurídicas. Sem isso metade das seções do template some, e o
 * teste não mostra o site — mostra o esqueleto dele.
 */
export const DEMO_SITE = {
  phone: "(31) 3555-0199",
  whatsapp: "31973065499",
  email: "contato@gabrielbragaseminovos.com.br",

  addressStreet: "Avenida Edméia Matos Lazzarotti",
  addressNumber: "1200",
  addressComplement: "Loja 3",
  addressDistrict: "Angola",
  addressCity: "Betim",
  addressState: "MG",
  addressZip: "32630-000",
  mapsUrl: "https://maps.google.com/?q=Avenida+Edmeia+Matos+Lazzarotti+1200+Betim+MG",

  /*
   * Domingo fechado de propósito.
   *
   * É o caso que o agrupamento de horários precisa acertar: um dia fechado
   * interrompe a faixa, então a loja nunca aparece como "Seg a Dom".
   */
  businessHours: [
    { weekday: 1, open: "08:30", close: "18:30" },
    { weekday: 2, open: "08:30", close: "18:30" },
    { weekday: 3, open: "08:30", close: "18:30" },
    { weekday: 4, open: "08:30", close: "18:30" },
    { weekday: 5, open: "08:30", close: "18:30" },
    { weekday: 6, open: "09:00", close: "13:00" },
    { weekday: 0, open: null, close: null },
  ] as BusinessHours,

  social: {
    instagram: "https://instagram.com/gabrielbragaseminovos",
    facebook: "https://facebook.com/gabrielbragaseminovos",
  } as SocialLinks,

  aboutTitle: "Seminovos revisados, com procedência e conversa honesta",
  aboutText:
    "A Gabriel Braga Andrade trabalha com seminovos selecionados em Betim há mais de dez anos. " +
    "Cada carro do pátio passa por revisão antes de ser anunciado, e a ficha do site mostra o que " +
    "encontramos, inclusive o que precisa de atenção. Aqui você fala direto com quem decide o " +
    "preço, sem intermediário e sem proposta que muda na hora de fechar.",

  stats: [
    { value: "+1.200", label: "carros entregues" },
    { value: "4,8/5", label: "avaliação dos clientes" },
    { value: "10 anos", label: "de loja em Betim" },
  ] as SiteStats,

  reviews: [
    {
      rating: 5,
      text:
        "Comprei meu Onix com eles e o carro veio exatamente como estava anunciado. " +
        "Mostraram o histórico de revisão sem eu precisar pedir.",
      author: "Marcos R.",
    },
    {
      rating: 5,
      text:
        "Levei meu usado para avaliar e fecharam na troca no mesmo dia. " +
        "Explicaram cada desconto que entrou na conta.",
      author: "Juliana P.",
    },
    {
      rating: 4,
      text:
        "Atendimento direto e sem enrolação. O financiamento demorou um pouco por causa do banco, " +
        "mas a loja me manteve informado o tempo todo.",
      author: "André L.",
    },
  ] as SiteReviews,

  financing: { downPaymentPercent: 20, terms: [24, 36, 48, 60] },

  legalPrivacy:
    "Esta política descreve como a Gabriel Braga Andrade LTDA trata os dados enviados por este site.\n\n" +
    "Quais dados coletamos\n" +
    "Coletamos apenas o que você digita nos formulários: nome, telefone, e-mail e as informações " +
    "do veículo de interesse ou do veículo que você quer vender. Não usamos os dados para nenhuma " +
    "finalidade além de responder ao seu contato.\n\n" +
    "Com quem compartilhamos\n" +
    "Com ninguém, exceto quando a negociação exigir, como o envio da proposta a uma " +
    "instituição financeira que você mesmo escolheu para o financiamento.\n\n" +
    "Por quanto tempo guardamos\n" +
    "Enquanto durar o atendimento e pelo prazo que a lei exigir depois disso.\n\n" +
    "Seus direitos\n" +
    "Você pode pedir a qualquer momento acesso, correção ou exclusão dos seus dados. " +
    "Basta falar com a loja pelos canais de contato desta página.\n\n" +
    "Este é um texto de demonstração e não substitui a política revisada por um advogado.",

  legalTerms:
    "Ao usar este site, você concorda com as condições abaixo.\n\n" +
    "Sobre os anúncios\n" +
    "Preços, disponibilidade e condições podem mudar sem aviso. Um veículo anunciado pode já ter " +
    "sido vendido no momento em que você entra em contato. A confirmação acontece no atendimento.\n\n" +
    "Sobre as simulações\n" +
    "As simulações de financiamento são estimativas ilustrativas. O valor real da parcela depende " +
    "da análise de crédito da instituição financeira e pode ser diferente do mostrado aqui.\n\n" +
    "Sobre as informações dos veículos\n" +
    "As fichas são preenchidas pela loja com base no que foi verificado. Recomendamos sempre a " +
    "avaliação presencial antes de fechar negócio.\n\n" +
    "Este é um texto de demonstração e não substitui os termos revisados por um advogado.",
};
