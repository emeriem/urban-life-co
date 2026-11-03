import { db, error, increment, isAppDatabaseError, json, secrets } from '@appdeploy/sdk';
import type { RouterContext } from '@appdeploy/sdk';

type EventRecord = { id?: string; title?: string; date?: string; status?: string; price?: string | number; capacity?: number; heldCount?: number; confirmedCount?: number };
type Registration = {
  id: string; eventId: string; eventTitle: string; purchaserName: string; purchaserEmail: string;
  purchaserPhone: string; attendeeCount: number; amountMinor: number;
  currency: 'NGN'; status: string; paymentStatus: string; paymentMethod: string; paymentId: string;
  paymentReference: string; ticketBatchIds: string[]; accessTokenHash: string; createdAt: string; expiresAt: string | null;
};
const BATCH = 500;
const MAX_TX_BYTES = 3_500_000;
const clean = (v: unknown, n: number) => String(v ?? '').trim().slice(0, n);
const validKey = (v: string) => /^[A-Za-z0-9_-]{16,80}$/.test(v);
async function hash(v: string) {
  const b = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(v));
  return Array.from(new Uint8Array(b), x => x.toString(16).padStart(2, '0')).join('');
}
function equal(a: string, b: string) {
  if (a.length !== b.length) return false;
  let x = 0;
  for (let i = 0; i < a.length; i++) x |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return x === 0;
}
function priceMinor(v: unknown): number | null {
  if (typeof v === 'number') return Number.isFinite(v) && v >= 0 ? Math.round(v * 100) : null;
  const s = clean(v, 80);
  if (/^free$/i.test(s)) return 0;
  const n = s.replace(/₦|NGN/gi, '').replace(/,/g, '').replace(/\s/g, '');
  if (!/^\d+(?:\.\d{1,2})?$/.test(n)) return null;
  const amount = Math.round(Number(n) * 100);
  return Number.isSafeInteger(amount) ? amount : null;
}
function count(v: unknown): number | null {
  if (v === undefined) return 0;
  return typeof v === 'number' && Number.isSafeInteger(v) && v >= 0 ? v : null;
}
async function bankDetails() {
  const names = await secrets.listSecretNames();
  const keys = ['MANUAL_TRANSFER_BANK_NAME', 'MANUAL_TRANSFER_ACCOUNT_NAME', 'MANUAL_TRANSFER_ACCOUNT_NUMBER'];
  if (!keys.every(k => names.includes(k))) return null;
  const values = await Promise.all(keys.map(k => secrets.readSecret(k)));
  if (!values.every(v => String(v ?? '').trim())) return null;
  const instructions = names.includes('MANUAL_TRANSFER_INSTRUCTIONS')
    ? await secrets.readSecret('MANUAL_TRANSFER_INSTRUCTIONS') : '';
  return { bankName: String(values[0]), accountName: String(values[1]), accountNumber: String(values[2]), instructions: String(instructions ?? '') };
}
async function getBooking(id: string) {
  const [r] = await db.get<Registration>('registrations', [id], { consistent: true });
  return r;
}
async function hasAccess(ctx: RouterContext, r: Registration) {
  const token = clean((ctx.body as Record<string, unknown> | undefined)?.accessToken, 160);
  return token.length >= 32 && equal(await hash(token), r.accessTokenHash);
}
function isDbError(err: unknown, codes: string[]) {
  return isAppDatabaseError(err) && codes.includes(err.code);
}

export async function createRegistration(ctx: RouterContext) {
  const b = (ctx.body ?? {}) as Record<string, unknown>;
  const eventId = clean(b.eventId, 100);
  const key = clean(b.idempotencyKey, 80);
  const token = clean(b.accessToken, 160);
  const name = clean(b.purchaserName, 120);
  const email = clean(b.purchaserEmail, 200).toLowerCase();
  const phone = clean(b.purchaserPhone, 40);
  const method = clean(b.paymentMethod, 40);
  const attendees = (Array.isArray(b.attendees) ? b.attendees : []).map(x =>
    clean(typeof x === 'string' ? x : (x as Record<string, unknown>)?.name, 120)
  );
  if (!eventId || !validKey(key) || token.length < 32) return error('A valid event, booking key and access token are required.', 400);
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return error('Enter the purchaser name and a valid email address.', 400);
  if (!attendees.length || attendees.some(x => !x)) return error('Provide a name for every ticket holder.', 400);
  const payloadHash = await hash(JSON.stringify({ eventId, name, email, phone, attendees, method }));
  const [prior] = await db.get<any>('registration_requests', [key], { consistent: true });
  if (prior) {
    if (prior.owner !== email || prior.payloadHash !== payloadHash) return error('This booking key was already used for different details.', 409);
    const saved = await getBooking(prior.registrationId);
    if (!saved) return error('The booking is being reconciled. Retry with the same booking key.', 503);
    return json({ registrationId: saved.id, status: saved.status, paymentReference: saved.paymentReference,
      amountMinor: saved.amountMinor, currency: saved.currency, ticketCount: saved.attendeeCount,
      transferDetails: saved.amountMinor ? await bankDetails() : null, replayed: true });
  }
  const [event] = await db.get<EventRecord>('events', [eventId], { consistent: true });
  if (!event || event.status !== 'published') return error('This event is not open for registration.', 404);
  if (event.date && Number.isFinite(Date.parse(event.date))) {
    const d = new Date(event.date); const today = new Date(); d.setHours(0,0,0,0); today.setHours(0,0,0,0);
    if (d < today) return error('Registration for this event has closed.', 409);
  }
  const unit = priceMinor(event.price);
  if (unit === null) return error('The event ticket price is not configured correctly.', 409);
  if (unit > 0 && method !== 'manual_transfer') return error('Automated bank transfer and USSD remain disabled pending provider sandbox validation. Select manual bank transfer.', 409);
  const details = unit > 0 ? await bankDetails() : null;
  if (unit > 0 && !details) return error('Paid checkout is not enabled yet. Approved bank details or a sandbox-verified payment provider must be configured first.', 503);
  const held = count(event.heldCount); const confirmed = count(event.confirmedCount);
  if (held === null || confirmed === null) return error('Event inventory requires administrator reconciliation.', 503);
  if (typeof event.capacity === 'number' && held + confirmed + attendees.length > event.capacity)
    return error('There are not enough tickets remaining for this quantity.', 409);

  const id = crypto.randomUUID(); const paymentId = crypto.randomUUID();
  const reference = 'ULC-' + crypto.randomUUID().replace(/-/g, '').slice(0, 12).toUpperCase();
  const createdAt = new Date().toISOString(); const free = unit === 0;
  const expiresAt = free ? null : new Date(Date.now() + 30 * 60_000).toISOString();
  const ticketRows: Array<Record<string, unknown>> = [];
  const batchIds: string[] = [];
  for (const attendeeName of attendees) ticketRows.push({
    id: crypto.randomUUID(), registrationId: id, eventId, attendeeName,
    status: free ? 'issued' : 'pending_payment', createdAt,
  });
  const booking: Registration = {
    id, eventId, eventTitle: clean(event.title, 200), purchaserName: name, purchaserEmail: email,
    purchaserPhone: phone, attendeeCount: attendees.length,
    amountMinor: unit * attendees.length, currency: 'NGN', status: free ? 'confirmed' : 'pending_payment',
    paymentStatus: free ? 'not_required' : 'awaiting_transfer', paymentMethod: free ? 'free' : 'manual_transfer',
    paymentId, paymentReference: reference, ticketBatchIds: batchIds, accessTokenHash: await hash(token),
    createdAt, expiresAt,
  };
  const ops: any[] = [
    db.tx.update('events', [{ id: eventId, record: free
      ? { heldCount: increment(0), confirmedCount: increment(attendees.length) }
      : { heldCount: increment(attendees.length) },
      if: { heldCount: event.heldCount, confirmedCount: event.confirmedCount } }], { patch: true }),
    db.tx.add('registrations', [booking]),
    db.tx.add('registration_requests', [{ id: key, owner: email, payloadHash, registrationId: id, createdAt }]),
    db.tx.add('payment_attempts', [{ id: paymentId, registrationId: id, method: free ? 'free' : 'manual_transfer',
      status: free ? 'not_required' : 'awaiting_transfer', amountMinor: unit * attendees.length,
      currency: 'NGN', reference, createdAt }]),
  ];
  for (let i = 0; i < ticketRows.length; i += BATCH) {
    const chunk = ticketRows.slice(i, i + BATCH);
    const batchId = crypto.randomUUID(); batchIds.push(batchId);
    ops.push(db.tx.add('tickets', chunk));
    ops.push(db.tx.add('registration_ticket_batches', [{ id: batchId, registrationId: id, ticketIds: chunk.map(x => x.id) }]));
  }
  booking.ticketBatchIds = batchIds;
  const size = new TextEncoder().encode(JSON.stringify({ booking, ticketRows, ops: ops.length })).byteLength;
  if (ops.length > 100 || size > MAX_TX_BYTES) return error('This booking exceeds the safe atomic transaction size. Reduce the quantity or split the booking.', 413);
  try {
    await db.transact(ops);
  } catch (err) {
    if (isDbError(err, ['AppDatabaseDuplicateId', 'AppDatabaseUnknownOutcome'])) {
      const [receipt] = await db.get<any>('registration_requests', [key], { consistent: true });
      if (receipt?.owner === email && receipt?.payloadHash === payloadHash && receipt?.registrationId) {
        const saved = await getBooking(receipt.registrationId);
        if (saved) return json({ registrationId: saved.id, status: saved.status,
          paymentReference: saved.paymentReference, amountMinor: saved.amountMinor, currency: 'NGN',
          ticketCount: saved.attendeeCount, transferDetails: saved.amountMinor ? await bankDetails() : null, replayed: true });
        return error('The booking is still being reconciled. Retry with the same booking key.', 503);
      }
      if (receipt) return error('This booking key belongs to another booking.', 409);
      return error('The booking result is being reconciled. Retry with the same booking key.', 503);
    }
    if (isDbError(err, ['AppDatabaseConflict', 'AppDatabaseConditionFailed']))
      return error('Availability changed during checkout. Refresh and retry with the same booking key.', 409);
    throw err;
  }
  return json({ registrationId: id, status: booking.status, paymentReference: reference,
    amountMinor: booking.amountMinor, currency: 'NGN', ticketCount: attendees.length,
    transferDetails: details, ticketIds: free ? ticketRows.map(x => x.id) : [], expiresAt }, 201);
}

export async function registrationStatus(ctx: RouterContext) {
  const r = await getBooking(ctx.params.id);
  if (!r) return error('Booking not found.', 404);
  if (!await hasAccess(ctx, r)) return error('Booking access denied.', 403);
  const batches = r.ticketBatchIds.length ? await db.get<any>('registration_ticket_batches', r.ticketBatchIds, { consistent: true }) : [];
  const ids = batches.flatMap(x => x?.ticketIds ?? []);
  return json({ registrationId: r.id, eventTitle: r.eventTitle, status: r.status, paymentStatus: r.paymentStatus,
    paymentReference: r.paymentReference, amountMinor: r.amountMinor, currency: r.currency,
    attendeeCount: r.attendeeCount, expiresAt: r.expiresAt, ticketIds: r.status === 'confirmed' ? ids : [] });
}

export async function submitManualTransfer(ctx: RouterContext) {
  const r = await getBooking(ctx.params.id);
  if (!r) return error('Booking not found.', 404);
  if (!await hasAccess(ctx, r)) return error('Booking access denied.', 403);
  const reference = clean((ctx.body as Record<string, unknown>)?.transferReference, 100);
  if (!reference) return error('Enter the bank transfer reference.', 400);
  if (r.status !== 'pending_payment' || !['awaiting_transfer', 'manual_rejected'].includes(r.paymentStatus))
    return error('This booking is not awaiting a transfer reference.', 409);
  if (r.expiresAt && Date.parse(r.expiresAt) < Date.now()) return error('The payment hold has expired. Contact the event team before transferring.', 409);
  const now = new Date().toISOString();
  try {
    await db.transact([
      db.tx.update('registrations', [{ id: r.id, record: { paymentStatus: 'manual_review', transferReference: reference, transferSubmittedAt: now },
        if: { status: 'pending_payment', paymentStatus: r.paymentStatus } }], { patch: true }),
      db.tx.update('payment_attempts', [{ id: r.paymentId, record: { status: 'manual_review', transferReference: reference, updatedAt: now },
        if: { status: r.paymentStatus } }], { patch: true }),
      db.tx.add('payment_audit', [{ id: crypto.randomUUID(), registrationId: r.id, action: 'transfer_submitted', actor: r.purchaserEmail, reference, createdAt: now }]),
    ]);
  } catch (err) {
    if (isDbError(err, ['AppDatabaseConditionFailed', 'AppDatabaseConflict'])) return error('Booking status changed. Refresh before retrying.', 409);
    throw err;
  }
  return json({ ok: true, status: 'manual_review', message: 'Reference received. Tickets remain inactive until the bank credit is independently verified.' });
}

export async function adminListRegistrations(ctx: RouterContext) {
  const page = await db.list<Registration>('registrations', { limit: 100, ...(ctx.query.nextToken ? { nextToken: ctx.query.nextToken } : {}) });
  return json({ registrations: page.items.map(r => ({ id: r.id, eventId: r.eventId, eventTitle: r.eventTitle,
    purchaserName: r.purchaserName, purchaserEmail: r.purchaserEmail, purchaserPhone: r.purchaserPhone,
    attendeeCount: r.attendeeCount, amountMinor: r.amountMinor, currency: r.currency, status: r.status,
    paymentStatus: r.paymentStatus, paymentMethod: r.paymentMethod, paymentReference: r.paymentReference,
    transferReference: (r as any).transferReference, createdAt: r.createdAt, expiresAt: r.expiresAt })),
    nextToken: page.nextToken ?? null });
}

export async function adminConfirmManualTransfer(ctx: RouterContext) {
  const b = (ctx.body ?? {}) as Record<string, unknown>;
  if (b.bankCreditVerified !== true) return error('Confirm actual credit in the business bank account before proceeding.', 400);
  if (typeof b.verifiedAmountMinor !== 'number' || !Number.isSafeInteger(b.verifiedAmountMinor)) return error('Enter the verified bank credit amount in kobo.', 400);
  const reason = clean(b.reason, 500);
  if (!reason) return error('Enter an audit note for this verification.', 400);
  const r = await getBooking(ctx.params.id);
  if (!r) return error('Booking not found.', 404);
  if (r.status !== 'pending_payment' || r.paymentStatus !== 'manual_review') return error('This booking is not awaiting verification.', 409);
  if (b.verifiedAmountMinor !== r.amountMinor) return error('The verified bank credit amount does not match the booking total. Do not issue tickets; escalate the discrepancy.', 409);
  if (r.expiresAt && Date.parse(r.expiresAt) < Date.now()) return error('The payment hold has expired. Reconcile this late payment separately.', 409);
  const [event] = await db.get<EventRecord>('events', [r.eventId], { consistent: true });
  if (!event) return error('Event record is missing. Reconcile manually.', 409);
  const held = count(event.heldCount); const confirmed = count(event.confirmedCount);
  if (held === null || confirmed === null || held < r.attendeeCount) return error('Event inventory is inconsistent.', 409);
  const batches = r.ticketBatchIds.length ? await db.get<any>('registration_ticket_batches', r.ticketBatchIds, { consistent: true }) : [];
  const ticketIds = batches.flatMap(x => x?.ticketIds ?? []);
  if (ticketIds.length !== r.attendeeCount) return error('Ticket records are incomplete.', 409);
  const now = new Date().toISOString(); const actor = ctx.user?.email ?? ctx.user?.userId ?? 'administrator';
  const ops: any[] = [
    db.tx.update('events', [{ id: r.eventId, record: { heldCount: increment(-r.attendeeCount), confirmedCount: increment(r.attendeeCount) },
      if: { heldCount: event.heldCount, confirmedCount: event.confirmedCount } }], { patch: true }),
    db.tx.update('registrations', [{ id: r.id, record: { status: 'confirmed', paymentStatus: 'manually_confirmed',
      verifiedAt: now, verifiedBy: actor, verificationNote: reason }, if: { status: 'pending_payment', paymentStatus: 'manual_review' } }], { patch: true }),
    db.tx.update('payment_attempts', [{ id: r.paymentId, record: { status: 'manually_confirmed', verifiedAt: now, verifiedBy: actor },
      if: { status: 'manual_review' } }], { patch: true }),
    db.tx.add('payment_audit', [{ id: crypto.randomUUID(), registrationId: r.id, action: 'manual_transfer_confirmed', actor, reason, verifiedAmountMinor: b.verifiedAmountMinor, createdAt: now }]),
  ];
  for (let i = 0; i < ticketIds.length; i += BATCH) {
    const ids = ticketIds.slice(i, i + BATCH);
    ops.push(db.tx.update('tickets', ids.map(id => ({ id, record: { status: 'issued', issuedAt: now }, if: { status: 'pending_payment' } })), { patch: true }));
  }
  if (ops.length > 100) return error('This booking exceeds the safe atomic confirmation limit. Escalate for controlled reconciliation.', 409);
  try { await db.transact(ops); }
  catch (err) {
    if (isDbError(err, ['AppDatabaseConditionFailed', 'AppDatabaseConflict'])) return error('Booking or inventory changed during verification. Refresh and retry.', 409);
    if (isDbError(err, ['AppDatabaseUnknownOutcome'])) return error('Verification is being reconciled. Refresh before taking another action.', 503);
    throw err;
  }
  return json({ ok: true, status: 'confirmed', ticketCount: ticketIds.length });
}

export async function adminRejectManualTransfer(ctx: RouterContext) {
  const reason = clean((ctx.body as Record<string, unknown> | undefined)?.reason, 500);
  if (!reason) return error('Enter a reason for rejecting this reference.', 400);
  const r = await getBooking(ctx.params.id);
  if (!r) return error('Booking not found.', 404);
  if (r.status !== 'pending_payment' || r.paymentStatus !== 'manual_review') return error('This booking is not awaiting review.', 409);
  const now = new Date().toISOString(); const actor = ctx.user?.email ?? ctx.user?.userId ?? 'administrator';
  try {
    await db.transact([
      db.tx.update('registrations', [{ id: r.id, record: { paymentStatus: 'manual_rejected', transferRejectionReason: reason, rejectedAt: now, rejectedBy: actor },
        if: { status: 'pending_payment', paymentStatus: 'manual_review' } }], { patch: true }),
      db.tx.update('payment_attempts', [{ id: r.paymentId, record: { status: 'manual_rejected', rejectionReason: reason, updatedAt: now },
        if: { status: 'manual_review' } }], { patch: true }),
      db.tx.add('payment_audit', [{ id: crypto.randomUUID(), registrationId: r.id, action: 'manual_transfer_rejected', actor, reason, createdAt: now }]),
    ]);
  } catch (err) {
    if (isDbError(err, ['AppDatabaseConditionFailed', 'AppDatabaseConflict'])) return error('Booking changed during review. Refresh before retrying.', 409);
    throw err;
  }
  return json({ ok: true, status: 'manual_rejected' });
}

export async function adminCheckInTicket(ctx: RouterContext) {
  const [ticket] = await db.get<any>('tickets', [clean(ctx.params.id, 100)], { consistent: true });
  if (!ticket) return error('Ticket not found.', 404);
  if (ticket.status !== 'issued') return error('Ticket is not valid for check-in or has already been used.', 409);
  const r = await getBooking(ticket.registrationId);
  if (!r || r.status !== 'confirmed') return error('Booking is not confirmed.', 409);
  const now = new Date().toISOString(); const actor = ctx.user?.email ?? ctx.user?.userId ?? 'administrator';
  try {
    await db.transact([
      db.tx.update('tickets', [{ id: ticket.id, record: { status: 'checked_in', checkedInAt: now, checkedInBy: actor }, if: { status: 'issued' } }], { patch: true }),
      db.tx.add('payment_audit', [{ id: crypto.randomUUID(), registrationId: r.id, ticketId: ticket.id, action: 'ticket_checked_in', actor, createdAt: now }]),
    ]);
  } catch (err) {
    if (isDbError(err, ['AppDatabaseConditionFailed', 'AppDatabaseConflict'])) return error('This ticket was checked in by another administrator.', 409);
    throw err;
  }
  return json({ ok: true, ticketId: ticket.id, status: 'checked_in' });
}


export async function expirePendingRegistrations() {
  const [state] = await db.get<any>('registration_expiry_state', ['cursor'], { consistent: true });
  const page = await db.list<Registration>('registrations', {
    limit: 100,
    ...(state?.nextToken ? { nextToken: state.nextToken } : {}),
  });
  let processed = 0;
  for (const r of page.items) {
    if (processed >= 20) break;
    if (r.status !== 'pending_payment' || !r.expiresAt || Date.parse(r.expiresAt) >= Date.now()) continue;
    const [event] = await db.get<EventRecord>('events', [r.eventId], { consistent: true });
    if (!event) continue;
    const held = count(event.heldCount);
    if (held === null || held < r.attendeeCount) continue;
    const now = new Date().toISOString();
    try {
      await db.transact([
        db.tx.update('events', [{
          id: r.eventId,
          record: { heldCount: increment(-r.attendeeCount) },
          if: { heldCount: event.heldCount, confirmedCount: event.confirmedCount },
        }], { patch: true }),
        db.tx.update('registrations', [{
          id: r.id,
          record: { status: 'expired', paymentStatus: 'expired', expiredAt: now },
          if: { status: 'pending_payment', paymentStatus: r.paymentStatus },
        }], { patch: true }),
        db.tx.update('payment_attempts', [{
          id: r.paymentId,
          record: { status: 'expired', expiredAt: now },
          if: { status: r.paymentStatus },
        }], { patch: true }),
        db.tx.add('payment_audit', [{
          id: crypto.randomUUID(), registrationId: r.id, action: 'booking_expired',
          actor: 'system', createdAt: now,
        }]),
      ]);
      processed++;
    } catch (err) {
      if (isDbError(err, ['AppDatabaseConditionFailed', 'AppDatabaseConflict'])) continue;
      throw err;
    }
  }
  const nextCursor = page.nextToken ?? null;
  const cursorRecord = { nextToken: nextCursor, updatedAt: new Date().toISOString() };
  if (state) {
    await db.tx.update('registration_expiry_state', [{
      id: 'cursor', record: cursorRecord,
    }], { patch: true });
  } else {
    await db.tx.add('registration_expiry_state', [{ id: 'cursor', ...cursorRecord }]);
  }
  return { statusCode: 200, processed };
}
