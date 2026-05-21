/**
 * AI Provider abstraction — InteliCont
 *
 * Providers are swappable from the admin settings panel without touching
 * business logic. The rule-based provider works with zero config.
 */

export interface AccountHint {
  id:   string;
  code: string;
  name: string;
  nature: string | null;
}

export interface ProposedLine {
  accountId:    string | null;   // null = could not resolve
  accountCode:  string;
  accountName:  string;
  debit:        number;
  credit:       number;
  description:  string;
}

export interface JournalProposal {
  lines:       ProposedLine[];
  confidence:  number;           // 0-1
  reasoning:   string;
  provider:    string;
  model:       string | null;
}

export interface AIProviderInput {
  docType:     string;
  issuerRuc:   string;
  issuerName:  string;
  receiverRuc: string | null;
  total:       number;
  iva10:       number;
  iva5:        number;
  ivaExento:   number;
  subtotal:    number;
  currency:    string;
  issueDate:   string;
  docNumber:   string | null;
  lines:       Array<{
    description: string;
    quantity:    number;
    unitPrice:   number;
    ivaRate:     number;
    ivaAmount:   number;
    lineTotal:   number;
  }>;
  /** Accounts available for this entity — passed to the provider for grounding */
  accounts:    AccountHint[];
  /** Is this entity the buyer (purchasing) or the seller (selling)? */
  perspective: "buyer" | "seller";
}

export interface AIProvider {
  readonly name: string;
  readonly model: string | null;
  propose(input: AIProviderInput): Promise<JournalProposal>;
}
