import { router, json, error, requireAuth } from '@appdeploy/sdk';
import { db, secrets, storage } from '@appdeploy/sdk';
import type { RouterMiddleware } from '@appdeploy/sdk';

// Admin access is configured only through the AppDeploy ADMIN_EMAILS secret.
// Fail closed when the secret is absent or empty; never grant access from source code.
let adminCache: { emails: string[]; at: number } | null = null;
async function adminEmails(): Promise<string[]> {
  if (adminCache && Date.now() - adminCache.at < 5 * 60 * 1000)
    return adminCache.emails;
  const names = await secrets.listSecretNames();
  const raw = names.includes('ADMIN_EMAILS')
    ? await secrets.readSecret('ADMIN_EMAILS')
    : '';
  const emails = String(raw ?? '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  adminCache = { emails, at: Date.now() };
  return emails;
}
const requireAdminFromSecret: RouterMiddleware = async ctx => {
  const emails = await adminEmails();
  const email = ctx.user?.email?.trim().toLowerCase();
  if (!email || !emails.includes(email))
    return error('Admin access denied.', 403);
};
const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
];
const CONTACT_TYPES = ['General enquiry', 'Partnership', 'Event', 'Community'];
// Allowlisted writable fields per entity. Clients can never set ids, audit
// stamps or storage paths, and status values are validated server-side.
const EVENT_FIELDS = [
  'title',
  'date',
  'time',
  'location',
  'category',
  'experience',
  'status',
  'price',
  'description',
  'image',
  'registrationLink',
  'capacity',
];
const EXPERIENCE_FIELDS = [
  'name',
  'category',
  'description',
  'coverImage',
  'status',
  'featured',
  'socialLink',
  'website',
];
const STORY_FIELDS = [
  'title',
  'category',
  'date',
  'excerpt',
  'content',
  'coverImage',
  'status',
  'featured',
];
const ANNOUNCEMENT_FIELDS = [
  'title',
  'body',
  'status',
  'startAt',
  'expiresAt',
  'priority',
];
const MESSAGE_FIELDS = ['status'];
const SETTINGS_FIELDS = [
  'heroEyebrow',
  'heroTitle',
  'heroCopy',
  'communityHeadline',
  'communityCopy',
];
const EVENT_STATUSES = [
  'draft',
  'published',
  'completed',
  'cancelled',
  'postponed',
  'archived',
];
const CONTENT_STATUSES = ['draft', 'published', 'archived'];
const MESSAGE_STATUSES = ['new', 'read', 'resolved'];
const URL_FIELDS = ['image', 'coverImage', 'registrationLink', 'website', 'socialLink'];
const LONG_FIELDS = ['content'];
const MEDIUM_FIELDS = ['description', 'body', 'excerpt', 'heroCopy', 'communityCopy'];
function isSafeUrl(value: string) {
  if (value === '') return true;
  if (value.startsWith('/') && !value.startsWith('//') && !value.startsWith('/\\\\'))
    return true;
  try {
    const parsed = new URL(value);
    return (
      (parsed.protocol === 'http:' || parsed.protocol === 'https:') &&
      Boolean(parsed.hostname)
    );
  } catch {
    return false;
  }
}
function pick(body: unknown, fields: string[]) {
  const source = (body ?? {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const key of fields) {
    if (!(key in source)) continue;
    const value = source[key];
    if (key === 'capacity') {
      const n = Number(value);
      if (value !== '' && value !== null && Number.isFinite(n) && n >= 0 && n <= 100000)
        out[key] = Math.floor(n);
      continue;
    }
    if (typeof value === 'string') {
      const max = LONG_FIELDS.includes(key)
        ? 50000
        : MEDIUM_FIELDS.includes(key)
          ? 10000
          : 2000;
      const text = value.slice(0, max);
      if (URL_FIELDS.includes(key) && !isSafeUrl(text.trim())) continue;
      out[key] = text;
    } else if (typeof value === 'number' && Number.isFinite(value)) {
      out[key] = value;
    } else if (typeof value === 'boolean' || value === null) {
      out[key] = value;
    }
  }
  return out;
}
function validatePayload(body: unknown, fields: string[]): string | null {
  if (!body || typeof body !== 'object' || Array.isArray(body))
    return 'Request body must be an object.';
  const source = body as Record<string, unknown>;
  for (const key of fields) {
    if (!(key in source) || source[key] === undefined) continue;
    const value = source[key];
    if (key === 'capacity') {
      if (value === '' || value === null) continue;
      const n = typeof value === 'number' ? value : Number(value);
      if (!Number.isFinite(n) || !Number.isInteger(n) || n < 0 || n > 100000)
        return 'Capacity must be a whole number between 0 and 100000.';
      continue;
    }
    if (['featured'].includes(key) && typeof value !== 'boolean')
      return `${key} must be true or false.`;
    if (value === null) continue;
    if (typeof value !== 'string')
      return `${key} must be text.`;
    if (URL_FIELDS.includes(key) && !isSafeUrl(value.trim()))
      return `${key} must be an http(s) URL or a site-relative path.`;
    if (key === 'priority' && !['normal', 'high'].includes(value))
      return 'Priority must be normal or high.';
    if (['startAt', 'expiresAt'].includes(key) && value && !Number.isFinite(Date.parse(value)))
      return `${key} must be a valid date and time.`;
  }
  return null;
}
function validStatus(data: Record<string, unknown>, allowed: string[]) {
  return data.status === undefined || allowed.includes(String(data.status));
}
// Detect the real image type from the file's leading bytes, never from the
// client-declared content type.
function sniffImageType(base64: string): string | null {
  let head: number[];
  try {
    head = Array.from(atob(base64.slice(0, 32)), c => c.charCodeAt(0));
  } catch {
    return null;
  }
  const at = (bytes: number[], offset = 0) =>
    bytes.every((b, i) => head[offset + i] === b);
  if (at([0xff, 0xd8, 0xff])) return 'image/jpeg';
  if (at([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image/png';
  if (at([0x47, 0x49, 0x46, 0x38])) return 'image/gif';
  if (at([0x52, 0x49, 0x46, 0x46]) && at([0x57, 0x45, 0x42, 0x50], 8))
    return 'image/webp';
  return null;
}
async function ownsPickerSession(sessionId: string, userId: string) {
  const rows = await db.list('google_photos_picker_sessions', { limit: 100 });
  return rows.items.some(
    item => item.sessionId === sessionId && item.userId === userId
  );
}
const GOOGLE_PHOTOS_SCOPE =
  'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';
const seedEvents = [
  {
    title: 'Urban Hikers — Reactivation Hike',
    date: '2026-08-22',
    time: '7:00 AM',
    location: 'Coal Camp, Enugu',
    category: 'Urban Hikers',
    experience: 'Urban Hikers',
    status: 'completed',
    price: '₦2,500',
    description: 'A return to the trail: movement, exploration and community.',
    image:
      'https://images.unsplash.com/photo-1551632811-561732d1e306?auto=format&fit=crop&w=1400&q=80',
    registrationLink: '',
    capacity: 50,
  },
  {
    title: 'Urban Hangout',
    date: '2026-08-16',
    time: '3:00 PM',
    location: 'Villa Toscana, Enugu',
    category: 'Community',
    experience: 'Urban Connect',
    status: 'completed',
    price: '₦1,000',
    description: 'Games, music, drinks and the people that make the community.',
    image:
      'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=1400&q=80',
    registrationLink: '',
    capacity: 80,
  },
  {
    title: 'Urban Hikers × Eastern United',
    date: '2026-09-12',
    time: '2:00 PM',
    location: 'Ngwo Park',    category: 'Outdoor',
    experience: 'Urban Hikers',
    status: 'completed',
    price: 'Free',
    description:
      'An active afternoon built around touch rugby, movement and connection.',
    image:
      'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=1400&q=80',
    registrationLink: '',
    capacity: 60,
  },
];
const seedExperiences = [
  {
    name: 'Urban Hikers',
    category: 'Outdoor lifestyle',
    description:
      'More than a hike. It is a community built around movement, adventure, travel and connection.',
    status: 'published',
    featured: true,
  },
  {
    name: 'Urban Fitness',
    category: 'Movement & wellness',
    description:
      'A movement and wellness experience for people who want to move, train and live actively.',
    status: 'published',
    featured: true,
  },
  {
    name: 'Urban Connect',
    category: 'People & opportunity',
    description:
      'A social and professional connection layer for people, ideas, opportunities and meaningful relationships.',
    status: 'published',
    featured: true,
  },
];
const seedStories = [
  {
    title: 'More Than a Hike. It’s a Community.',
    category: 'Community',
    date: '2026-08-28',
    excerpt:
      'Why the trail is only the beginning of what Urban Hikers is building.',
    status: 'published',
    featured: true,
  },
  {
    title: 'Why We Live. Connect. Explore.',
    category: 'Urban Life Co.',
    date: '2026-08-20',
    excerpt: 'The three ideas at the centre of every experience we create.',
    status: 'published',
    featured: false,
  },
  {
    title: 'The Urban Life Field Notes',
    category: 'Journal',
    date: '2026-08-10',
    excerpt: 'A growing archive of places, people and experiences.',
    status: 'published',
    featured: false,
  },
];
let seeded = false;
async function ensureSeeds() {
  if (seeded) return;
  const events = await db.list('events', { limit: 20 });
  if (!events.items.length) await db.add('events', seedEvents);
  const experiences = await db.list('experiences', { limit: 20 });
  if (!experiences.items.length) await db.add('experiences', seedExperiences);
  const stories = await db.list('stories', { limit: 20 });
  if (!stories.items.length) await db.add('stories', seedStories);
  const settings = await db.list('site_settings', { limit: 5 });
  if (!settings.items.length)
    await db.add('site_settings', [
      {
        key: 'global',
        heroEyebrow: 'URBAN LIFE CO. · ENUGU · NIGERIA',
        heroTitle: 'Live. Connect. Explore.',
        heroCopy:
          'We create experiences that bring people together, encourage exploration and make everyday life more meaningful.',
        communityHeadline: 'Come for the experience. Stay for the people.',
        communityCopy:
          'Urban Life Co. is being built around the belief that life gets better when people have places to meet, move, explore and build something together.',
        updatedAt: new Date().toISOString(),
      },
    ]);
  seeded = true;
}
async function withMediaUrls(items: any[]) {
  const paths = items
    .map(item => item.imagePath || item.coverImagePath || item.path)
    .filter(Boolean) as string[];
  if (!paths.length) return items;
  const urls = await storage.url(paths);
  const urlMap = new Map(urls.map(item => [item.path, item.url]));
  return items.map(item => ({
    ...item,
    image: item.imagePath
      ? (urlMap.get(item.imagePath) ?? item.image)
      : item.image,
    coverImage: item.coverImagePath
      ? (urlMap.get(item.coverImagePath) ?? item.coverImage)
      : item.coverImage,
    url: item.path ? (urlMap.get(item.path) ?? item.url) : item.url,
  }));
}
async function content() {
  await ensureSeeds();
  const [events, announcements, stories, experiences, settings] =
    await Promise.all([
      db.list('events', { limit: 100 }),
      db.list('announcements', { limit: 50 }),
      db.list('stories', { limit: 100 }),
      db.list('experiences', { limit: 50 }),
      db.list('site_settings', { limit: 5 }),
    ]);
  const now = new Date().toISOString();
  const activeAnnouncement = announcements.items.find(
    item =>
      item.status === 'published' &&
      (!item.startAt || item.startAt <= now) &&
      (!item.expiresAt || item.expiresAt >= now)
  );
  return {
    events: await withMediaUrls(
      events.items.filter(
        item => item.status !== 'draft' && item.status !== 'archived'
      )
    ),
    stories: await withMediaUrls(
      stories.items.filter(item => item.status === 'published')
    ),
    experiences: await withMediaUrls(
      experiences.items.filter(item => item.status === 'published')
    ),
    announcement: activeAnnouncement ?? null,
    settings: settings.items[0] ?? null,
  };
}
async function googleClientId() {
  const names = await secrets.listSecretNames();
  if (!names.includes('GOOGLE_PHOTOS_CLIENT_ID')) return null;
  return secrets.readSecret('GOOGLE_PHOTOS_CLIENT_ID');
}
async function googleJson(
  url: string,
  accessToken: string,
  init: RequestInit = {}
) {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok)
    throw new Error(data?.error?.message ?? 'Google Photos request failed.');
  return data;
}
const admin = [requireAuth(), requireAdminFromSecret];
export const handler = router({
  'GET /api/_healthcheck': [async () => json({ message: 'Success' })],
  'GET /api/content': [async () => json(await content())],
  'GET /api/events/:id': [
    async ctx => {
      await ensureSeeds();
      const [item] = await db.get('events', [ctx.params.id]);
      if (!item || item.status === 'draft' || item.status === 'archived')
        return error('Event not found.', 404);
      const [resolved] = await withMediaUrls([item]);
      return json(resolved);
    },
  ],
  'GET /api/stories/:id': [
    async ctx => {
      await ensureSeeds();
      const [item] = await db.get('stories', [ctx.params.id]);
      if (!item || item.status !== 'published')
        return error('Story not found.', 404);
      const [resolved] = await withMediaUrls([item]);
      return json(resolved);
    },
  ],
  'GET /api/experiences/:id': [
    async ctx => {
      await ensureSeeds();
      const [item] = await db.get('experiences', [ctx.params.id]);
      if (!item || item.status !== 'published')
        return error('Experience not found.', 404);
      const [resolved] = await withMediaUrls([item]);
      return json(resolved);
    },
  ],
  'POST /api/messages': [    async ctx => {
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      if (body.website) return json({ ok: true }); // honeypot: bots fill hidden fields
      const clean = (v: unknown, max: number) =>
        String(v ?? '')
          .trim()
          .slice(0, max);
      const name = clean(body.name, 120);
      const email = clean(body.email, 200).toLowerCase();
      const phone = clean(body.phone, 40);
      const message = clean(body.message, 4000);
      const type = CONTACT_TYPES.includes(String(body.type))
        ? String(body.type)
        : 'General enquiry';
      if (!name || !email || !message)
        return error('Name, email and message are required.', 400);
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
        return error('Please enter a valid email address.', 400);
      const recent = await db.list('messages', { limit: 100 });
      const cutoff = Date.now() - 10 * 60 * 1000;
      if (
        recent.items.filter(
          m => m.email === email && Date.parse(String(m.createdAt)) > cutoff
        ).length >= 3
      )
        return error('Too many messages. Please try again later.', 429);
      const [id] = await db.add('messages', [
        {
          name,
          email,
          phone,
          type,
          message,
          status: 'new',
          createdAt: new Date().toISOString(),
        },
      ]);
      return json({ ok: Boolean(id) });
    },
  ],
  'GET /api/media': [
    ...admin,
    async () => {
      const { items } = await db.list('media', { limit: 80 });
      const paths = items.map(item => item.path as string);
      const urls = paths.length ? await storage.url(paths) : [];
      const urlMap = new Map(urls.map(item => [item.path, item.url]));
      return json({
        media: items.map(item => ({
          id: item.id,
          caption: item.caption,
          experience: item.experience,
          eventId: item.eventId,
          createdAt: item.createdAt,
          url: urlMap.get(item.path as string) ?? null,
        })),
      });
    },
  ],
  'GET /api/admin/status': [
    ...admin,
    async () => json({ ok: true, role: 'super_admin' }),
  ],
  'GET /api/admin/dashboard': [
    ...admin,
    async () => {
      const [events, stories, announcements, media, messages] =
        await Promise.all([
          db.list('events', { limit: 100 }),
          db.list('stories', { limit: 100 }),
          db.list('announcements', { limit: 100 }),
          db.list('media', { limit: 100 }),
          db.list('messages', { limit: 100 }),
        ]);
      return json({
        metrics: {
          events: events.items.length,
          publishedEvents: events.items.filter(x => x.status === 'published')
            .length,
          stories: stories.items.length,
          drafts: [
            ...events.items,
            ...stories.items,
            ...announcements.items,
          ].filter(x => x.status === 'draft').length,
          media: media.items.length,
          newMessages: messages.items.filter(x => x.status === 'new').length,
          announcements: announcements.items.filter(
            x => x.status === 'published'
          ).length,
        },
        recentMessages: messages.items.slice(0, 8),
        recentEvents: events.items.slice(0, 8),
      });
    },
  ],
  'GET /api/admin/events': [
    ...admin,
    async () => json((await db.list('events', { limit: 100 })).items),
  ],
  'POST /api/admin/events': [
    ...admin,
    async ctx => {
      const validationError = validatePayload(ctx.body, EVENT_FIELDS);
      if (validationError) return error(validationError, 400);
      const body = pick(ctx.body, EVENT_FIELDS);
      if (!validStatus(body, EVENT_STATUSES))
        return error('Invalid status.', 400);
      const [id] = await db.add('events', [
        {
          ...body,
          status: body.status ?? 'draft',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
      return json({ id });
    },
  ],
  'PUT /api/admin/events/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('events', [ctx.params.id]);
      if (!existing) return error('Event not found.', 404);
      const validationError = validatePayload(ctx.body, EVENT_FIELDS);
      if (validationError) return error(validationError, 400);
      const clean = pick(ctx.body, EVENT_FIELDS);
      if (!validStatus(clean, EVENT_STATUSES))
        return error('Invalid status.', 400);
      const [ok] = await db.update('events', [
        {
          id: ctx.params.id,
          record: {
            ...existing,
            ...clean,
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'DELETE /api/admin/events/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('events', [ctx.params.id]);
      if (!existing) return error('Event not found.', 404);
      const [ok] = await db.update('events', [
        {
          id: ctx.params.id,
          record: {
            ...existing,
            status: 'archived',
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'GET /api/admin/experiences': [
    ...admin,
    async () => json((await db.list('experiences', { limit: 50 })).items),
  ],
  'POST /api/admin/experiences': [
    ...admin,
    async ctx => {
      const validationError = validatePayload(ctx.body, EXPERIENCE_FIELDS);
      if (validationError) return error(validationError, 400);
      const body = pick(ctx.body, EXPERIENCE_FIELDS);
      if (!validStatus(body, CONTENT_STATUSES))
        return error('Invalid status.', 400);
      if (!body.name || !body.description)
        return error('Name and description are required.', 400);
      const [id] = await db.add('experiences', [
        {
          ...body,
          status: body.status ?? 'draft',
          createdAt: new Date().toISOString(),
        },
      ]);
      return json({ id });
    },
  ],
  'DELETE /api/admin/experiences/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('experiences', [ctx.params.id]);
      if (!existing) return error('Experience not found.', 404);
      const [ok] = await db.update('experiences', [
        {
          id: ctx.params.id,
          record: {
            ...existing,
            status: 'archived',
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'PUT /api/admin/experiences/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('experiences', [ctx.params.id]);      if (!existing) return error('Experience not found.', 404);
      const validationError = validatePayload(ctx.body, EXPERIENCE_FIELDS);
      if (validationError) return error(validationError, 400);
      const clean = pick(ctx.body, EXPERIENCE_FIELDS);
      if (!validStatus(clean, CONTENT_STATUSES))
        return error('Invalid status.', 400);
      const [ok] = await db.update('experiences', [
        {
          id: ctx.params.id,
          record: {
            ...existing,
            ...clean,
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'GET /api/admin/stories': [
    ...admin,
    async () => json((await db.list('stories', { limit: 100 })).items),
  ],
  'POST /api/admin/stories': [
    ...admin,
    async ctx => {
      const validationError = validatePayload(ctx.body, STORY_FIELDS);
      if (validationError) return error(validationError, 400);
      const body = pick(ctx.body, STORY_FIELDS);
      if (!validStatus(body, CONTENT_STATUSES))
        return error('Invalid status.', 400);
      if (!body.title || !body.excerpt || !body.content)
        return error('Title, excerpt and story content are required.', 400);
      const [id] = await db.add('stories', [
        {
          ...body,
          status: body.status ?? 'draft',
          createdAt: new Date().toISOString(),
        },
      ]);
      return json({ id });
    },
  ],
  'PUT /api/admin/stories/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('stories', [ctx.params.id]);
      if (!existing) return error('Story not found.', 404);
      const validationError = validatePayload(ctx.body, STORY_FIELDS);
      if (validationError) return error(validationError, 400);
      const clean = pick(ctx.body, STORY_FIELDS);
      if (!validStatus(clean, CONTENT_STATUSES))
        return error('Invalid status.', 400);
      const [ok] = await db.update('stories', [
        {
          id: ctx.params.id,
          record: {
            ...existing,
            ...clean,
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'DELETE /api/admin/stories/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('stories', [ctx.params.id]);
      if (!existing) return error('Story not found.', 404);
      const [ok] = await db.update('stories', [
        {
          id: ctx.params.id,
          record: {
            ...existing,
            status: 'archived',
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'GET /api/admin/announcements': [
    ...admin,
    async () => json((await db.list('announcements', { limit: 50 })).items),
  ],
  'POST /api/admin/announcements': [
    ...admin,
    async ctx => {
      const validationError = validatePayload(ctx.body, ANNOUNCEMENT_FIELDS);
      if (validationError) return error(validationError, 400);
      const body = pick(ctx.body, ANNOUNCEMENT_FIELDS);
      if (!validStatus(body, CONTENT_STATUSES))
        return error('Invalid status.', 400);
      if (!body.title || !body.body)
        return error('Headline and message are required.', 400);
      const [id] = await db.add('announcements', [
        {
          ...body,
          status: body.status ?? 'draft',
          createdAt: new Date().toISOString(),
        },
      ]);
      return json({ id });
    },
  ],
  'DELETE /api/admin/announcements/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('announcements', [ctx.params.id]);
      if (!existing) return error('Announcement not found.', 404);
      const [ok] = await db.update('announcements', [
        {
          id: ctx.params.id,
          record: {
            ...existing,
            status: 'archived',
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'PUT /api/admin/announcements/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('announcements', [ctx.params.id]);
      if (!existing) return error('Announcement not found.', 404);
      const validationError = validatePayload(ctx.body, ANNOUNCEMENT_FIELDS);
      if (validationError) return error(validationError, 400);
      const clean = pick(ctx.body, ANNOUNCEMENT_FIELDS);
      if (!validStatus(clean, CONTENT_STATUSES))
        return error('Invalid status.', 400);
      const [ok] = await db.update('announcements', [
        {
          id: ctx.params.id,
          record: {
            ...existing,
            ...clean,
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'GET /api/admin/messages': [
    ...admin,
    async () => json((await db.list('messages', { limit: 100 })).items),
  ],
  'PUT /api/admin/messages/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('messages', [ctx.params.id]);
      if (!existing) return error('Message not found.', 404);
      const validationError = validatePayload(ctx.body, MESSAGE_FIELDS);
      if (validationError) return error(validationError, 400);
      const clean = pick(ctx.body, MESSAGE_FIELDS);
      if (!validStatus(clean, MESSAGE_STATUSES))
        return error('Invalid status.', 400);
      const [ok] = await db.update('messages', [
        {
          id: ctx.params.id,
          record: {
            ...existing,
            ...clean,
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'GET /api/admin/settings': [
    ...admin,
    async () => {
      await ensureSeeds();
      const rows = await db.list('site_settings', { limit: 5 });
      return json(rows.items[0] ?? null);
    },
  ],
  'PUT /api/admin/settings': [
    ...admin,
    async ctx => {
      const validationError = validatePayload(ctx.body, SETTINGS_FIELDS);
      if (validationError) return error(validationError, 400);
      await ensureSeeds();
      const rows = await db.list('site_settings', { limit: 5 });
      const existing = rows.items[0];
      if (!existing) return error('Site settings not found.', 404);
      const [ok] = await db.update('site_settings', [
        {
          id: existing.id,
          record: {
            ...existing,
            ...pick(ctx.body, SETTINGS_FIELDS),
            key: 'global',
            updatedAt: new Date().toISOString(),
          },
        },
      ]);
      return json({ ok });
    },
  ],
  'POST /api/admin/media/upload': [
    ...admin,
    async ctx => {
      const body = (ctx.body ?? {}) as Record<string, unknown>;
      const name = String(body.name ?? 'upload.jpg');
      const contentType = String(body.contentType ?? 'image/jpeg');
      const base64 = String(body.base64 ?? '');      if (!base64 || !ALLOWED_IMAGE_TYPES.includes(contentType))
        return error('Please upload a JPG, PNG, WebP or GIF image.', 400);
      if (base64.length > 8000000)
        return error(
          'Image is too large. Please upload an image under 6 MB.',
          413
        );
      if (
        !/^(?:[A-Za-z0-9+/]{4})*(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/.test(base64) ||
        base64.length % 4 !== 0 ||
        sniffImageType(base64) !== contentType
      )
        return error('That file is not a valid image of the declared type.', 400);
      const safeName =
        name.replace(/[^a-zA-Z0-9._-]/g, '-').replace(/^\.+/, '') || 'upload';
      const path = `media/uploads/${Date.now()}-${safeName}`;
      const [written] = await storage.write([
        { path, content: base64, contentType },
      ]);
      if (!written) return error('Image upload failed.', 500);
      const [id] = await db.add('media', [
        {
          path,
          caption: String(body.caption ?? '').slice(0, 2000),
          eventId: body.eventId ?? null,
          experience: body.experience ?? null,
          createdAt: new Date().toISOString(),
        },
      ]);
      return json({ id, path });
    },
  ],
  'DELETE /api/admin/media/:id': [
    ...admin,
    async ctx => {
      const [existing] = await db.get('media', [ctx.params.id]);
      if (!existing) return error('Media not found.', 404);
      if (existing.path) await storage.delete([String(existing.path)]);
      const [ok] = await db.delete('media', [ctx.params.id]);
      return json({ ok });
    },
  ],
  'GET /api/admin/google-photos/config': [
    ...admin,
    async () => {
      const clientId = await googleClientId();
      return json({
        configured: Boolean(clientId),
        clientId: clientId ?? null,
        scope: GOOGLE_PHOTOS_SCOPE,
      });
    },
  ],
  'POST /api/admin/google-photos/session': [
    ...admin,
    async ctx => {
      const body = (ctx.body ?? {}) as {
        accessToken?: string;
        eventId?: string;
        experience?: string;
        maxItemCount?: number;
      };
      if (!body.accessToken)
        return error('Google Photos authorization is required.', 401);
      const data = await googleJson(
        'https://photospicker.googleapis.com/v1/sessions',
        body.accessToken,
        {
          method: 'POST',
          body: JSON.stringify({
            pickingConfig: {
              maxItemCount: String(
                Math.min(Math.max(body.maxItemCount ?? 30, 1), 100)
              ),
            },
          }),
        }
      );
      await db.add('google_photos_picker_sessions', [
        {
          sessionId: data.id,
          userId: ctx.user!.userId,
          eventId: body.eventId ?? null,
          experience: body.experience ?? null,
          createdAt: new Date().toISOString(),
          expireTime: data.expireTime ?? null,
        },
      ]);
      return json({
        sessionId: data.id,
        pickerUri: `${data.pickerUri}/autoclose`,
      });
    },
  ],
  'POST /api/admin/google-photos/session/:sessionId/status': [
    ...admin,
    async ctx => {
      const body = (ctx.body ?? {}) as { accessToken?: string };
      if (!body.accessToken)
        return error('Google Photos authorization is required.', 401);
      if (!(await ownsPickerSession(ctx.params.sessionId, ctx.user!.userId)))
        return error('Picker session not found.', 404);
      const data = await googleJson(
        `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(ctx.params.sessionId)}`,
        body.accessToken
      );
      return json({
        mediaItemsSet: Boolean(data.mediaItemsSet),
        expireTime: data.expireTime ?? null,
      });
    },
  ],
  'POST /api/admin/google-photos/import/:sessionId': [
    ...admin,
    async ctx => {
      const body = (ctx.body ?? {}) as { accessToken?: string };
      if (!body.accessToken)
        return error('Google Photos authorization is required.', 401);
      const rows = await db.list('google_photos_picker_sessions', {
        limit: 100,
      });
      const picker = rows.items.find(
        item =>
          item.sessionId === ctx.params.sessionId &&
          item.userId === ctx.user!.userId
      );
      if (!picker) return error('Picker session not found.', 404);
      if (picker.expireTime && Date.parse(String(picker.expireTime)) <= Date.now())
        return error('Picker session has expired. Start a new selection.', 410);
      const selected = await googleJson(
        `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${encodeURIComponent(ctx.params.sessionId)}&pageSize=100`,
        body.accessToken
      );
      const photos = (selected.mediaItems ?? [])
        .filter((item: any) =>
          String(item.mediaFile?.mimeType ?? '').startsWith('image/')
        )
        .slice(0, 100);
      let imported = 0;
      for (const item of photos) {
        if (!item.mediaFile?.baseUrl) continue;
        const response = await fetch(`${item.mediaFile.baseUrl}=w1000-h1000`, {
          headers: { Authorization: `Bearer ${body.accessToken}` },
        });
        if (!response.ok) continue;
        const buffer = new Uint8Array(await response.arrayBuffer());
        if (buffer.byteLength > 5 * 1024 * 1024) continue;
        const content = btoa(
          Array.from(buffer, byte => String.fromCharCode(byte)).join('')
        );
        const mimeType = sniffImageType(content);
        if (!mimeType) continue;
        const extension =
          mimeType.split('/')[1]?.replace('jpeg', 'jpg') ?? 'jpg';
        const path = `media/google-photos/${ctx.params.sessionId}/${item.id}.${extension}`;
        const [written] = await storage.write([
          { path, content, contentType: mimeType },
        ]);
        if (written) {
          await db.add('media', [
            {
              path,
              googleMediaId: item.id,
              eventId: picker.eventId ?? null,
              experience: picker.experience ?? null,
              caption: String(item.mediaFile.filename ?? '').slice(0, 2000),
              createdAt: new Date().toISOString(),
            },
          ]);
          imported += 1;
        }
      }
      await db.delete('google_photos_picker_sessions', [picker.id]);
      await googleJson(
        `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(ctx.params.sessionId)}`,
        body.accessToken,
        { method: 'DELETE', body: '' }
      ).catch(() => undefined);
      return json({ imported });
    },
  ],
});
