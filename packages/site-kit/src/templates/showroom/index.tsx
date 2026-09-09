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
 * Showroom — "Template 02" no Figma.
 *
 * Editorial: a foto do veículo é a protagonista, o topo carrega três coisas
 * apenas (menu, marca e contato) e a navegação inteira mora numa gaveta, para
 * a imagem ocupar a tela. A barra é sobreposta sobre o herói e vira sólida
 * depois que a pessoa passa do banner.
 *
 * A ficha do veículo usa abas (Informações, Galeria, Opcionais) — o único
 * template com esse recurso, e o motivo de existir `tabs.tsx` aqui e não em
 * `shared`: enquanto for de um só, generalizar seria inventar requisito.
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
