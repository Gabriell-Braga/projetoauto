/** Catálogo inicial de marcas/modelos do mercado brasileiro (seed). */
export const BRAND_CATALOG: Record<string, string[]> = {
  Chevrolet: ["Onix", "Onix Plus", "Prisma", "Cruze", "Tracker", "Spin", "S10", "Montana", "Equinox", "Celta", "Cobalt", "Trailblazer"],
  Volkswagen: ["Gol", "Voyage", "Polo", "Virtus", "T-Cross", "Nivus", "Saveiro", "Amarok", "Jetta", "Tiguan", "Fox", "Up", "Golf"],
  Fiat: ["Argo", "Cronos", "Mobi", "Pulse", "Fastback", "Strada", "Toro", "Uno", "Palio", "Siena", "Punto", "Doblo", "Fiorino"],
  Ford: ["Ka", "Ka Sedan", "Fiesta", "EcoSport", "Ranger", "Focus", "Territory", "Bronco Sport", "Maverick", "Fusion"],
  Toyota: ["Corolla", "Corolla Cross", "Yaris", "Yaris Sedan", "Hilux", "SW4", "Etios", "RAV4", "Camry"],
  Honda: ["Civic", "City", "Fit", "HR-V", "WR-V", "ZR-V", "CR-V", "Accord"],
  Hyundai: ["HB20", "HB20S", "Creta", "Tucson", "ix35", "Santa Fe", "Azera", "Elantra"],
  Renault: ["Kwid", "Sandero", "Logan", "Duster", "Oroch", "Captur", "Stepway", "Fluence", "Master"],
  Nissan: ["March", "Versa", "Kicks", "Frontier", "Sentra", "Livina"],
  Jeep: ["Renegade", "Compass", "Commander", "Gladiator", "Wrangler"],
  Peugeot: ["208", "2008", "3008", "308", "Partner", "Boxer"],
  Citroën: ["C3", "C4 Cactus", "Basalt", "Aircross", "Berlingo", "Jumpy"],
  Mitsubishi: ["L200 Triton", "Pajero", "ASX", "Eclipse Cross", "Outlander"],
  Chery: ["Tiggo 5X", "Tiggo 7", "Tiggo 8", "Arrizo 6", "QQ"],
  Caoa: ["Tiggo 5X", "Tiggo 7", "Tiggo 8"],
  BMW: ["320i", "118i", "X1", "X3", "X5", "Série 3", "Série 5"],
  "Mercedes-Benz": ["Classe A", "Classe C", "GLA", "GLC", "Sprinter", "C180", "C200"],
  Audi: ["A3", "A4", "Q3", "Q5", "Q7", "A5"],
  Volvo: ["XC40", "XC60", "XC90", "C40"],
  Kia: ["Sportage", "Cerato", "Soul", "Picanto", "Sorento", "Bongo"],
  Land_Rover: ["Discovery Sport", "Range Rover Evoque", "Defender"],
  Suzuki: ["Jimny", "S-Cross", "Vitara"],
  Ram: ["Rampage", "2500", "3500"],
  BYD: ["Dolphin", "Seal", "Song Plus", "Yuan Plus", "King"],
  GWM: ["Haval H6", "Ora 03", "Poer"],
  Iveco: ["Daily"],
  Troller: ["T4"],
};

export const BRAND_NAME_FIXES: Record<string, string> = {
  Land_Rover: "Land Rover",
};

export function catalogEntries(): { brand: string; models: string[] }[] {
  return Object.entries(BRAND_CATALOG).map(([brand, models]) => ({
    brand: BRAND_NAME_FIXES[brand] ?? brand,
    models,
  }));
}
