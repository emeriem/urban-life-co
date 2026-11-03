/**
 * Provider-neutral contract for Urban Life Co. checkout.
 *
 * A concrete adapter must not be registered as active until bank-transfer and
 * USSD sandbox acceptance tests have passed. This module intentionally ships
 * no live provider implementation and never accepts client payment success.
 */
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
  supportedBanks: string[];
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
}
export interface PaymentProvider {
  getCapabilities(): Promise<PaymentCapabilities>;
  createBankTransfer(input: {
    merchantReference: string;
    amountMinor: number;
    currency: string;
    customerEmail: string;
  }): Promise<PaymentInstruction>;
  initiateUssd(input: {
    merchantReference: string;
    amountMinor: number;
    currency: string;
    customerEmail: string;
    bankCode: string;
  }): Promise<PaymentInstruction>;
  verifyTransaction(providerReference: string): Promise<VerifiedPayment>;
  verifyWebhook(rawBody: string, signature: string): Promise<VerifiedPayment>;
}

/** Safe default until a named provider has passed the approved sandbox matrix. */
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
  async createBankTransfer() {
    throw new Error('Automated bank transfer is not configured.');
  },
  async initiateUssd() {
    throw new Error('USSD is not configured.');
  },
  async verifyTransaction() {
    throw new Error('No payment provider is configured.');
  },
  async verifyWebhook() {
    throw new Error('No payment provider is configured.');
  },
};
