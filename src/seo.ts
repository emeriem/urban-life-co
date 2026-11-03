const DEFAULT_TITLE = 'Urban Life Co. — Live. Connect. Explore.';
const DEFAULT_DESCRIPTION =
  'Urban Life Co. creates experiences that help people live, connect and explore.';
const DEFAULT_IMAGE = '/resources/urban-life-logo.png';

export type PageMeta = {
  title?: string;
  description?: string;
  /** Path including the hash, e.g. "/#/events/mbido-ije-e1". */
  path: string;
  image?: string;
  noindex?: boolean;
  jsonLd?: Record<string, unknown> | null;
};

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path;
  return window.location.origin + (path.startsWith('/') ? path : `/${path}`);
}

function setMeta(attr: 'name' | 'property', key: string, content: string) {
  let el = document.head.querySelector<HTMLMetaElement>(
    `meta[${attr}="${key}"]`
  );
  if (!el) {
    el = document.createElement('meta');
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute('content', content);
}

function clip(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length > max ? `${clean.slice(0, max - 1).trimEnd()}…` : clean;
}

export function applyPageMeta(meta: PageMeta) {
  const title = meta.title || DEFAULT_TITLE;
  const description = clip(meta.description || DEFAULT_DESCRIPTION, 160);
  const image = absoluteUrl(meta.image || DEFAULT_IMAGE);

  document.title = title;
  setMeta('name', 'description', description);
  setMeta('name', 'robots', meta.noindex ? 'noindex, nofollow' : 'index, follow');
  setMeta('property', 'og:title', title);
  setMeta('property', 'og:description', description);
  setMeta('property', 'og:url', absoluteUrl(meta.path));
  setMeta('property', 'og:image', image);
  setMeta('name', 'twitter:title', title);
  setMeta('name', 'twitter:description', description);
  setMeta('name', 'twitter:image', image);

  let canonical = document.head.querySelector<HTMLLinkElement>(
    'link[rel="canonical"]'
  );
  if (!canonical) {
    canonical = document.createElement('link');
    canonical.rel = 'canonical';
    document.head.appendChild(canonical);
  }
  // Hash routes share one canonical document URL.
  canonical.href = window.location.origin + window.location.pathname;

  const existing = document.getElementById('page-jsonld');
  if (meta.jsonLd) {
    const script = existing || document.createElement('script');
    script.id = 'page-jsonld';
    (script as HTMLScriptElement).type = 'application/ld+json';
    script.textContent = JSON.stringify(meta.jsonLd);
    if (!existing) document.head.appendChild(script);
  } else if (existing) {
    existing.remove();
  }
}
