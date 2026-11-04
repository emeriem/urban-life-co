const KNOWN_PHOTOS = new Set([
  'urban-fitness-walk-poster',
  'urban-hikers-ball-and-banter-poster',
  'urban-hikers-city-walk-2',
  'urban-hikers-city-walk',
  'urban-hikers-community',
  'urban-hikers-enugu-view',
  'urban-hikers-hangout-poster',
  'urban-hikers-hillside-group',
  'urban-hikers-ije-ugwu-hike',
  'urban-hikers-story',
  'urban-hikers-summit-group',
  'urban-hikers-trail-pair',
  'urban-hikers-trail-rest',
  'urban-hikers-trail-walk',
]);

const LEGACY_RAW =
  /^https:\/\/raw\.githubusercontent\.com\/emeriem\/urban-life-co\/main\/public\/(events\/optimized|events|brand)\/([A-Za-z0-9_-]+)\.(jpg|png)$/;

/** Maps legacy GitHub-hosted image URLs (still stored in some CMS records) to the app's own hosted copies. */
export function assetUrl(url: string): string {
  const match = LEGACY_RAW.exec(url);
  if (!match) return url;
  const [, dir, name, ext] = match;
  if (dir === 'brand')
    return name === 'urban-life-ul-mark' && ext === 'png'
      ? '/resources/brand/urban-life-ul-mark.png'
      : url;
  return ext === 'jpg' && KNOWN_PHOTOS.has(name)
    ? `/resources/photos/${name}.webp`
    : url;
}

export function rewriteAssetUrls<T>(value: T): T {
  if (typeof value === 'string') return assetUrl(value) as unknown as T;
  if (Array.isArray(value))
    return value.map(item => rewriteAssetUrls(item)) as unknown as T;
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, item]) => [
        key,
        rewriteAssetUrls(item),
      ])
    ) as T;
  return value;
}
