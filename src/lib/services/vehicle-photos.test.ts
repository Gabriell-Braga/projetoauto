import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * A capa é a primeira foto — e as duas metades disso precisam continuar juntas.
 *
 * O defeito que isto trava: `setCoverPhoto` acendia `is_cover` sem mover a foto
 * de lugar. O card do estoque lê `cover_photo_key` e mostrava a terceira foto;
 * a galeria da ficha lê a lista ordenada por posição e abria na primeira. Duas
 * imagens diferentes para o mesmo carro, e nada disso aparece em teste de tela
 * nem em log — só olhando o site com fotos de verdade.
 *
 * Exercitar de fato exige banco, então o que dá para travar aqui é a presença
 * das duas escritas, cuja remoção volta a separar capa de ordem em silêncio.
 */
function source(relativePath: string): string {
  return readFileSync(join(process.cwd(), relativePath), "utf8");
}

describe("capa e ordem das fotos", () => {
  const vehicles = source("src/lib/services/vehicles.ts");

  it("definir a capa move a foto, não só a marca", () => {
    const trecho = vehicles.slice(vehicles.indexOf("export async function setCoverPhoto"));
    expect(trecho).toContain("position: indice");
  });

  it("a sincronização deriva a capa da posição", () => {
    const trecho = vehicles.slice(
      vehicles.indexOf("export async function syncVehiclePhotoState"),
      vehicles.indexOf("export async function reorderPhotos"),
    );
    // posições densas: sem isso, apagar do meio deixa buraco e o próximo envio
    // reusa um número já ocupado
    expect(trecho).toContain("position: indice, isCover: capa");
    expect(trecho).toContain("const capa = indice === 0");
  });

  it("a ordem tem desempate estável", () => {
    // duas fotos com a mesma posição trocam de lugar entre consultas
    expect(vehicles).toContain("asc(vehiclePhotos.position), asc(vehiclePhotos.createdAt)");
  });

  it("o painel promete o mesmo que o servidor faz", () => {
    const manager = source("src/components/admin/photo-manager.tsx");
    expect(manager).toContain("A primeira foto é a capa.");
  });
});
