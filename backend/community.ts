import { db, error, json } from '@appdeploy/sdk';
import type { RouterContext } from '@appdeploy/sdk';

const clean = (value: unknown, max: number) => String(value ?? '').trim().slice(0, max);
const ALLOWED_INTERESTS = ['Urban Hikers', 'Urban Fitness', 'Urban Connect', 'Travel & Culture'];

async function emailKey(email: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(email));
  return Array.from(new Uint8Array(bytes), value => value.toString(16).padStart(2, '0')).join('');
}

export async function communitySignup(ctx: RouterContext) {
  const body = (ctx.body ?? {}) as Record<string, unknown>;
  if (body.website) return json({ ok: true });
  const name = clean(body.name, 120);
  const email = clean(body.email, 200).toLowerCase();
  const phone = clean(body.phone, 40);
  const consent = body.consent === true;
  const interests = Array.isArray(body.interests)
    ? [...new Set(body.interests.map(value => clean(value, 40)).filter(value => ALLOWED_INTERESTS.includes(value)))]
    : [];
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))
    return error('Enter your name and a valid email address.', 400);
  if (!consent) return error('Consent is required to receive community updates.', 400);
  if (Array.isArray(body.interests) && interests.length !== body.interests.length)
    return error('One or more selected interests are invalid.', 400);

  const id = await emailKey(email);
  const now = new Date().toISOString();
  const [existing] = await db.get<any>('community_subscribers', [id], { consistent: true });
  if (existing) {
    const [updated] = await db.tx.update('community_subscribers', [{
      id,
      record: {
        name, email, phone, interests, consent: true, consentVersion: '2026-11-03',
        consentAt: now, status: 'active', unsubscribedAt: null, updatedAt: now,
      },
      if: { email },
    }], { patch: true });
    if (!updated) return error('Your signup changed while it was being saved. Please try again.', 409);
    return json({ ok: true, updated: true });
  }

  const [created] = await db.tx.add('community_subscribers', [{
    id, name, email, phone, interests, consent: true, consentVersion: '2026-11-03',
    consentAt: now, status: 'active', createdAt: now, updatedAt: now,
  }]);
  if (created) return json({ ok: true }, 201);

  const [raced] = await db.get<any>('community_subscribers', [id], { consistent: true });
  if (raced) return error('A signup with this email was just received. Refresh and try again if needed.', 409);
  return error('Your signup is being reconciled. Please retry shortly.', 503);
}

export async function adminListCommunitySubscribers(ctx: RouterContext) {
  const page = await db.list<any>('community_subscribers', {
    limit: 100,
    ...(ctx.query.nextToken ? { nextToken: ctx.query.nextToken } : {}),
  });
  return json({
    subscribers: page.items.map(item => ({
      id: item.id, name: item.name, email: item.email, phone: item.phone,
      interests: item.interests, status: item.status, consentAt: item.consentAt,
      createdAt: item.createdAt, updatedAt: item.updatedAt,
    })),
    nextToken: page.nextToken ?? null,
  });
}
