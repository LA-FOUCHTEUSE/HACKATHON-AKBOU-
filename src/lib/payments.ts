import "server-only";

// Payments are mocked. No real gateway is integrated and no full card number is ever accepted or stored.

export interface ChargeInput {
  amountDZD: number;
  reference: string; // sponsorshipId | donationId
  card: { last4: string; holderName: string };
}
export interface ChargeResult {
  status: "CONFIRMED" | "FAILED";
  transactionId: string;
}

export interface PaymentProvider {
  charge(input: ChargeInput): Promise<ChargeResult>;
}

// Demo implementation: always succeeds after a short delay.
export class MockEdahabiaProvider implements PaymentProvider {
  async charge(input: ChargeInput): Promise<ChargeResult> {
    void input;
    await new Promise((resolve) => setTimeout(resolve, 900));
    return { status: "CONFIRMED", transactionId: "MOCK-" + crypto.randomUUID() };
  }
}

// TODO (roadmap, not implemented): real SATIM / Algerie Poste gateway.
// export class SatimProvider implements PaymentProvider { ... }

export const payments: PaymentProvider = new MockEdahabiaProvider();
