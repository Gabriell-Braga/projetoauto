import type { TemplateModule } from "../contract";
import { About } from "./about";
import { Contact } from "./contact";
import { Financing } from "./financing";
import { Home } from "./home";
import { Legal } from "./legal";
import { Listing } from "./listing";
import { SellCar } from "./sell-car";
import { VehicleDetail } from "./vehicle-detail";

/**
 * Marketplace — "Template 03" no Figma.
 *
 * O formato de quem compara muito antes de decidir: busca no cabeçalho em toda
 * página, coluna de filtros no estoque, contagem por categoria e cards densos
 * com o preço na cor da marca — numa grade de doze, o preço é o que o olho
 * procura primeiro.
 *
 * O traço mais próprio dele são os cards de SERVIÇO intercalados na grade, em
 * vez de numa faixa separada: quem rola uma lista longa passa batido por
 * faixa, mas lê o que aparece na mesma cadência dos carros.
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
