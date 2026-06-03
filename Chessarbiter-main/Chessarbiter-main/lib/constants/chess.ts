export const chessCategories = [
  "NONE",
  "V",
  "IV",
  "III",
  "II",
  "I",
  "K",
  "M",
  "CM",
  "FM",
  "IM",
  "GM",
  "WCM",
  "WFM",
  "WIM",
  "WGM"
] as const;

export const chessCategoryLabels: Record<string, string> = {
  NONE: "Brak kategorii",
  V: "V kategoria",
  IV: "IV kategoria",
  III: "III kategoria",
  II: "II kategoria",
  I: "I kategoria",
  K: "Kandydat na mistrza",
  M: "Mistrz krajowy",
  CM: "CM",
  FM: "FM",
  IM: "IM",
  GM: "GM",
  WCM: "WCM",
  WFM: "WFM",
  WIM: "WIM",
  WGM: "WGM"
};

export function formatChessCategory(category?: string | null) {
  const value = category?.trim();
  if (!value || value === "NONE") {
    return "Brak";
  }

  return chessCategoryLabels[value] ?? value;
}
