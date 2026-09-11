const PRODUCT_NAME_CORRECTIONS: Array<[RegExp, string]> = [
  [/HAVAIAIANAS/gi, 'HAVAIANAS'],
  [/SIMPSPONS/gi, 'SIMPSONS'],
  [/FROZEM/gi, 'FROZEN'],
  [/VIUTTON/gi, 'VUITTON'],
];

export function normalizeProductName(value: string) {
  return PRODUCT_NAME_CORRECTIONS.reduce(
    (name, [pattern, replacement]) => name.replace(pattern, replacement),
    value,
  );
}

export function productCategoryLabel(category: string) {
  const name = category.trim();
  return /^(adulto|infantil)$/i.test(name) ? `Havaianas ${name}` : name;
}
