export type ImageAdjust = { zoom: number; x: number; y: number };

export const DEFAULT_IMAGE_ADJUST: ImageAdjust = { zoom: 1, x: 0, y: 0 };

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function parseImageUrl(value: string | null | undefined) {
  const fallback = value || '/products/havaianas-branco.png';
  const hashIndex = fallback.indexOf('#');
  if (hashIndex === -1) return { src: fallback, adjust: DEFAULT_IMAGE_ADJUST };

  const src = fallback.slice(0, hashIndex) || '/products/havaianas-branco.png';
  const hash = fallback.slice(hashIndex + 1);
  const encoded = hash.match(/(?:^|&)mv-adjust=([^&]+)/)?.[1];
  if (!encoded) return { src: fallback, adjust: DEFAULT_IMAGE_ADJUST };

  try {
    const parsed = JSON.parse(decodeURIComponent(encoded)) as Partial<ImageAdjust>;
    return {
      src,
      adjust: {
        zoom: clamp(Number(parsed.zoom) || 1, 0.8, 1.35),
        x: clamp(Number(parsed.x) || 0, -25, 25),
        y: clamp(Number(parsed.y) || 0, -25, 25),
      },
    };
  } catch {
    return { src: fallback, adjust: DEFAULT_IMAGE_ADJUST };
  }
}

export function serializeImageUrl(value: string, adjust: ImageAdjust) {
  const src = parseImageUrl(value).src;
  const normalized = {
    zoom: clamp(Number(adjust.zoom) || 1, 0.8, 1.35),
    x: clamp(Number(adjust.x) || 0, -25, 25),
    y: clamp(Number(adjust.y) || 0, -25, 25),
  };
  const isDefault = normalized.zoom === 1 && normalized.x === 0 && normalized.y === 0;
  return isDefault ? src : `${src}#mv-adjust=${encodeURIComponent(JSON.stringify(normalized))}`;
}
