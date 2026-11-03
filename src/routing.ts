export type StaticPage =
  | 'home'
  | 'about'
  | 'experiences'
  | 'events'
  | 'journal'
  | 'contact'
  | 'community'
  | 'contact'
  | 'privacy'
  | 'terms'
  | 'admin'
  | 'notfound';
export type DetailPage = 'event' | 'experience' | 'story';
export type Route = { page: StaticPage } | { page: DetailPage; ref: string };

const STATIC_PAGES: Record<string, StaticPage> = {
  about: 'about',
  experiences: 'experiences',
  events: 'events',
  journal: 'journal',
  contact: 'contact',
  community: 'community',
  contact: 'contact',
  privacy: 'privacy',
  terms: 'terms',
};
const DETAIL_SEGMENT: Record<string, DetailPage> = {
  events: 'event',
  experiences: 'experience',
  journal: 'story',
};
const DETAIL_PREFIX: Record<DetailPage, string> = {
  event: 'events',
  experience: 'experiences',
  story: 'journal',
};

export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60)
    .replace(/-+$/, '');
}

/** Readable, stable link reference: "<title-slug>-<id>". The id keeps it stable if the title is edited. */
export function itemRef(title: string, id: string): string {
  const slug = slugify(title);
  return slug ? `${slug}-${id}` : id;
}

export function findByRef<T extends { id: string }>(
  items: T[],
  ref: string
): T | undefined {
  if (!ref) return undefined;
  const exact = items.find(item => item.id === ref);
  if (exact) return exact;
  return [...items]
    .sort((a, b) => b.id.length - a.id.length)
    .find(item => ref.endsWith(`-${item.id}`));
}

/** Hash routes only: AppDeploy single-page apps must not use absolute path routes. */
export function parseLocation(hash: string): Route {
  if (hash.startsWith('#admin')) return { page: 'admin' };
  const raw = hash.replace(/^#/, '');
  if (!raw.startsWith('/')) return { page: 'home' };
  const segments = raw
    .split('/')
    .filter(Boolean)
    .map(part => {
      try {
        return decodeURIComponent(part);
      } catch {
        return part;
      }
    });
  if (!segments.length) return { page: 'home' };
  const [first, second] = segments;
  if (segments.length === 1 && STATIC_PAGES[first])
    return { page: STATIC_PAGES[first] };
  if (segments.length === 2 && DETAIL_SEGMENT[first] && second)
    return { page: DETAIL_SEGMENT[first], ref: second };
  return { page: 'notfound' };
}

export function routeToHash(route: Route): string {
  if ('ref' in route)
    return `#/${DETAIL_PREFIX[route.page]}/${encodeURIComponent(route.ref)}`;
  if (route.page === 'admin') return '#admin';
  if (route.page === 'home' || route.page === 'notfound') return '';
  return `#/${route.page}`;
}
