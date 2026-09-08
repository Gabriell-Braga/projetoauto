import type { TemplateModule } from "@/templates/contract";
import { About } from "./about";
import { Contact } from "./contact";
import { Financing } from "./financing";
import { Home } from "./home";
import { Legal } from "./legal";
import { Listing } from "./listing";
import { SellCar } from "./sell-car";
import { VehicleDetail } from "./vehicle-detail";

/**
 * Vitrine — "Template 01" no Figma.
 *
 * Primeiro dos três desenhos novos. Claro, com a busca em primeiro plano e
 * cards de CTA explícito: o desenho pede visual de loja própria, não de
 * marketplace genérico.
 *
 * Diferente dos cinco templates antigos, este implementa as oito páginas e
 * não usa nenhuma cor literal — tudo sai das CSS variables do tema, o que
 * permite a mesma estrutura servir revendas com identidades diferentes.
 */
const template: TemplateModule = {
  Home,
  Listing,
  VehicleDetail,
  Contact,
  Financing,
  SellCar,
  About,
  Legal,
};

export default template;
