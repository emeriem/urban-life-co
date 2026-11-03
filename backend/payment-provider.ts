/**
 * Flutterwave v4 sandbox adapter for Urban Life Co.
 *
 * This adapter deliberately targets the Flutterwave developer sandbox only.
 * Production credentials and endpoints are not accepted by this implementation.
 * Payment completion must be confirmed by fetching the charge server-side.
 */
import { secrets } from '@appdeploy/sdk';

export type PaymentMethod = 'bank_transfer' | 'ussd';
export type NormalizedPaymentStatus =
  | 'created'
  | 'awaiting_customer'
  | 'pending_verification'
  | 'succeeded'
  | 'failed'
  | 'expired'
  | 'cancelled';

export interface PaymentCapabilities {
  provider: string;
  enabled: boolean;
  currency: string[];
  bankTransfer: boolean;
  ussd: boolean;
  supportedBanks: Array<{ code: string; name: string }>;
  disabledReason?: string;
}
export interface PaymentInstruction {
  providerReference: string;
  method: PaymentMethod;
  amountMinor: number;
  currency: string;
  instructions: Record<string, string>;
  expiresAt?: string;
}
export interface VerifiedPayment {
  providerReference: string;
  merchantReference: string;
  amountMinor: number;
  currency: string;
  status: NormalizedPaymentStatus;
  paidAt?: string;
  customerId?: string;
}
export interface PaymentProvider {
  getCapabilities(): Promise<PaymentCapabilities>;
  createBankTransfer(input: {
    merchantReference: string;
    amountMinor: number;
    currency: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
  }): Promise<PaymentInstruction>;
  initiateUssd(input: {
    merchantReference: string;
    amountMinor: number;
    currency: string;
    customerEmail: string;
    customerName: string;
    customerPhone?: string;
    bankCode: string;
  }): Promise<PaymentInstruction>;
  verifyTransaction(providerReference: string): Promise<VerifiedPayment>;
  verifyWebhook(rawBody: string, signature: string): Promise<VerifiedPayment>;
}

const API_BASE = 'https://developersandbox-api.flutterwave.com';
const TOKEN_URL = 'https://idp.flutterwave.com/realms/flutterwave/protocol/openid-connect/token';
let cachedToken = '';
let cachedTokenExpiresAt = 0;

const asRecord = (value: unknown): Record<string, any> =>
  value && typeof value === 'object' ? value as Record<string, any> : {};
const splitName = (name: string) => {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  return { first: parts[0] || 'Urban', last: parts.slice(1).join(' ') || 'Customer' };
};
const amountToMinor = (value: unknown) => {
  const amount = Number(value);
  if (!Number.isFinite(amount) || amount < 0 || !Number.isSafeInteger(Math.round(amount * 100)))
    throw new Error('Flutterwave returned an invalid transaction amount.');
  return Math.round(amount * 100);
};
const mapStatus = (status: unknown): NormalizedPaymentStatus => {
  const value = String(status ?? '').toLowerCase();
  if (['succeeded', 'successful', 'completed', 'success'].includes(value)) return 'succeeded';
  if (['failed', 'failure'].includes(value)) return 'failed';
  if (['expired'].includes(value)) return 'expired';
  if (['cancelled', 'canceled'].includes(value)) return 'cancelled';
  if (['pending', 'processing', 'new'].includes(value)) return 'pending_verification';
  return 'created';
};
const safeError = (payload: Record<string, any>, status: number) => {
  const message = String(payload?.error?.message ?? payload?.message ?? 'Payment provider request failed.').slice(0, 240);
  return new Error('Flutterwave sandbox (' + status + '): ' + message);
};

async function configuredNames() {
  return secrets.listSecretNames();
}
async function readCredentials() {
  const names = await configuredNames();
  if (!names.includes('FLUTTERWAVE_SANDBOX_CLIENT_ID') ||
      !names.includes('FLUTTERWAVE_SANDBOX_CLIENT_SECRET') ||
      !names.includes('FLUTTERWAVE_SANDBOX_WEBHOOK_SECRET')) return null;
  const [clientId, clientSecret, webhookSecret] = await Promise.all([
    secrets.readSecret('FLUTTERWAVE_SANDBOX_CLIENT_ID'),
    secrets.readSecret('FLUTTERWAVE_SANDBOX_CLIENT_SECRET'),
    secrets.readSecret('FLUTTERWAVE_SANDBOX_WEBHOOK_SECRET'),
  ]);
  if (![clientId, clientSecret, webhookSecret].every(value => value.trim())) return null;
  return { clientId, clientSecret, webhookSecret };
}
async function accessToken() {
  const credentials = await readCredentials();
  if (!credentials) throw new Error('Flutterwave sandbox credentials are not configured.');
  if (cachedToken && Date.now() < cachedTokenExpiresAt - 60_000) return cachedToken;
  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id: credentials.clientId,
      client_secret: credentials.clientSecret,
      grant_type: 'client_credentials',
    }),
  });
  const payload = asRecord(await response.json().catch(() => ({})));
  if (!response.ok || !payload.access_token) throw safeError(payload, response.status);
  cachedToken = String(payload.access_token);
  cachedTokenExpiresAt = Date.now() + Math.max(60, Number(payload.expires_in) || 600) * 1000;
  return cachedToken;
}
async function apiRequest(path: string, options: {
  method?: string;
  body?: Record<string, unknown>;
  idempotencyKey?: string;
} = {}) {
  const token = await accessToken();
  const headers: Record<string, string> = {
    Authorization: 'Bearer ' + token,
    Accept: 'application/json',
    'Content-Type': 'application/json',
    'X-Trace-Id': crypto.randomUUID(),
  };
  if (options.idempotencyKey) headers['X-Idempotency-Key'] = options.idempotencyKey;
  const response = await fetch(API_BASE + path, {
    method: options.method ?? 'GET',
    headers,
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const payload = asRecord(await response.json().catch(() => ({})));
  if (!response.ok) throw safeError(payload, response.status);
  if (payload.status === 'failed') throw safeError(payload, response.status || 400);
  return asRecord(payload.data);
}
async function createCustomer(input: {
  merchantReference: string;
  customerEmail: string;
  customerName: string;
  customerPhone?: string;
}) {
  const name = splitName(input.customerName);
  const digits = String(input.customerPhone ?? '').replace(/\D/g, '');
  const localNumber = digits.startsWith('234') ? digits.slice(3) : digits.startsWith('0') ? digits.slice(1) : digits;
  const validNigeriaPhone = /^\d{10}$/.test(localNumber) ? localNumber : '';
  return apiRequest('/customers', {
    method: 'POST',
    idempotencyKey: input.merchantReference + '-customer',
    body: {
      name,
      email: input.customerEmail,
      ...(validNigeriaPhone ? { phone: { country_code: '234', number: validNigeriaPhone } } : {}),
    },
  });
}

function toVerified(data: Record<string, any>): VerifiedPayment {
  const status = mapStatus(data.status);
  return {
    providerReference: String(data.id ?? ''),
    merchantReference: String(data.reference ?? ''),
    amountMinor: amountToMinor(data.amount),
    currency: String(data.currency ?? '').toUpperCase(),
    status,
    ...(data.created_datetime ? { paidAt: String(data.created_datetime) } : {}),
    ...(data.customer_id ? { customerId: String(data.customer_id) } : {}),
  };
}

export const flutterwaveSandboxProvider: PaymentProvider = {
  async getCapabilities() {
    const names = await configuredNames();
    const enabled = ['FLUTTERWAVE_SANDBOX_CLIENT_ID', 'FLUTTERWAVE_SANDBOX_CLIENT_SECRET', 'FLUTTERWAVE_SANDBOX_WEBHOOK_SECRET']
      .every(name => names.includes(name));
    if (!enabled) return {
      provider: 'flutterwave-v4-sandbox',
      enabled: false,
      currency: ['NGN'],
      bankTransfer: false,
      ussd: false,
      supportedBanks: [],
      disabledReason: 'Sandbox credentials and webhook signing secret are not configured.',
    };
    try {
      const data = await apiRequest('/banks?country=NG');
      const banks = Array.isArray(data) ? data : [];
      return {
        provider: 'flutterwave-v4-sandbox',
        enabled: true,
        currency: ['NGN'],
        bankTransfer: true,
        ussd: banks.length > 0,
        supportedBanks: banks.map((bank: any) => ({ code: String(bank.code), name: String(bank.name) }))
          .filter((bank: { code: string; name: string }) => bank.code && bank.name),
      };
    } catch {
      return {
        provider: 'flutterwave-v4-sandbox',
        enabled: false,
        currency: ['NGN'],
        bankTransfer: false,
        ussd: false,
        supportedBanks: [],
        disabledReason: 'Sandbox credentials could not be validated against the bank directory.',
      };
    }
  },

  async createBankTransfer(input) {
    if (input.currency !== 'NGN') throw new Error('Flutterwave bank transfer supports NGN only.');
    const customer = await createCustomer(input);
    const account = await apiRequest('/virtual-accounts', {
      method: 'POST',
      idempotencyKey: input.merchantReference + '-virtual-account',
      body: {
        reference: input.merchantReference,
        customer_id: String(customer.id),
        expiry: 1800,
        amount: input.amountMinor / 100,
        currency: 'NGN',
        account_type: 'dynamic',
        narration: 'Urban Life Co event ticket ' + input.merchantReference,
      },
    });
    if (!account.account_number || !account.account_bank_name)
      throw new Error('Flutterwave did not return a usable virtual account.');
    return {
      providerReference: String(account.id ?? account.reference ?? input.merchantReference),
      method: 'bank_transfer',
      amountMinor: input.amountMinor,
      currency: 'NGN',
      instructions: {
        bankName: String(account.account_bank_name),
        accountNumber: String(account.account_number),
        accountName: String(account.note ?? 'Urban Life Co'),
        note: String(account.note ?? 'Transfer the exact amount to the generated account.'),
      },
      ...(account.account_expiration_datetime ? { expiresAt: String(account.account_expiration_datetime) } : {}),
    };
  },

  async initiateUssd(input) {
    if (input.currency !== 'NGN') throw new Error('Flutterwave USSD supports NGN only.');
    const banksData = await apiRequest('/banks?country=NG');
    const banks = Array.isArray(banksData) ? banksData : [];
    const bank = banks.find((item: any) => String(item.code) === input.bankCode);
    if (!bank) throw new Error('The selected bank is not in Flutterwave’s current Nigeria USSD bank directory.');
    const customer = await createCustomer(input);
    const paymentMethod = await apiRequest('/payment-methods', {
      method: 'POST',
      idempotencyKey: input.merchantReference + '-ussd-method',
      body: { type: 'ussd', ussd: { account_bank: input.bankCode } },
    });
    const charge = await apiRequest('/charges', {
      method: 'POST',
      idempotencyKey: input.merchantReference + '-ussd-charge',
      body: {
        reference: input.merchantReference,
        currency: 'NGN',
        customer_id: String(customer.id),
        payment_method_id: String(paymentMethod.id),
        amount: input.amountMinor / 100,
        meta: { source: 'urban-life-co', booking_reference: input.merchantReference },
      },
    });
    const note = String(charge.next_action?.payment_instruction?.note ?? '');
    if (!note) throw new Error('Flutterwave did not return USSD authorization instructions.');
    return {
      providerReference: String(charge.id),
      method: 'ussd',
      amountMinor: input.amountMinor,
      currency: 'NGN',
      instructions: { bankName: String(bank.name), bankCode: input.bankCode, note },
    };
  },

  async verifyTransaction(providerReference) {
    if (!providerReference || providerReference.length > 100) throw new Error('Invalid provider transaction reference.');
    const data = await apiRequest('/charges/' + encodeURIComponent(providerReference));
    return toVerified(data);
  },

  async verifyWebhook(rawBody, signature) {
    const credentials = await readCredentials();
    if (!credentials) throw new Error('Flutterwave sandbox credentials are not configured.');
    if (!rawBody || !signature) throw new Error('Missing webhook body or signature.');
    const key = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(credentials.webhookSecret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['sign'],
    );
    const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(rawBody));
    const expected = btoa(String.fromCharCode(...new Uint8Array(digest)));
    if (expected.length !== signature.length) throw new Error('Invalid Flutterwave webhook signature.');
    let mismatch = 0;
    for (let i = 0; i < expected.length; i++) mismatch |= expected.charCodeAt(i) ^ signature.charCodeAt(i);
    if (mismatch !== 0) throw new Error('Invalid Flutterwave webhook signature.');
    const event = asRecord(JSON.parse(rawBody));
    const data = asRecord(event.data);
    if (!data.id) throw new Error('Flutterwave webhook is missing the charge ID.');
    return this.verifyTransaction(String(data.id));
  },
};

/** Safe default until sandbox credentials are supplied and QA passes. */
export const unconfiguredPaymentProvider: PaymentProvider = {
  async getCapabilities() {
    return {
      provider: 'unconfigured',
      enabled: false,
      currency: ['NGN'],
      bankTransfer: false,
      ussd: false,
      supportedBanks: [],
      disabledReason: 'No provider has passed sandbox verification and been configured.',
    };
  },
  async createBankTransfer() { throw new Error('Automated bank transfer is not configured.'); },
  async initiateUssd() { throw new Error('USSD is not configured.'); },
  async verifyTransaction() { throw new Error('No payment provider is configured.'); },
  async verifyWebhook() { throw new Error('No payment provider is configured.'); },
};
