/**
 * The labelled corpus.
 *
 * Every payload below was checked against the checksum in `src/validators.ts`
 * — this file asserts the label matches reality, so a mislabelled case fails
 * loudly instead of quietly inflating the score.
 *
 * Design rule: benign cases must be HARD. A 12-digit order ID, an 18-digit
 * reference that fails Luhn, a PAN-shaped string with an invalid NSDL entity
 * character. A benchmark whose negatives are trivial measures nothing.
 */

export interface Case {
  id: string;
  payload: unknown;
  isPII: boolean;
  category?: string;
  /** Why this case is here — read this before changing a label. */
  note?: string;
}

export const TRUE_PII: Case[] = [
  { id: 'aadhaar-valid', isPII: true, category: 'AADHAAR',
    note: 'Verhoeff checksum passes. 999999990019 is the published test vector. ' +
          'Found by the corpus-integrity test: the first value used here ' +
          '(3675 9834 6015) is NOT a valid Aadhaar, so the label was wrong.',
    payload: { form: { aadhaar: '999999990019' } } },
  { id: 'pan-entity', isPII: true, category: 'PAN',
    note: '4th char P = individual, a valid NSDL entity type.',
    payload: { kyc: { pan: 'ABCPE1234F' } } },
  { id: 'card-luhn-16', isPII: true, category: 'CREDIT_CARD',
    payload: { payment: { card: '4111 1111 1111 1111' } } },
  { id: 'card-luhn-15-amex', isPII: true, category: 'CREDIT_CARD',
    payload: { history: { raw: '378282246310005' } } },
  { id: 'email', isPII: true, category: 'EMAIL',
    payload: { contact: 'arjun.sharma@example-client.in' } },
  { id: 'phone-india', isPII: true, category: 'PHONE',
    payload: { phone: '+919876543210' } },
  { id: 'ifsc', isPII: true, category: 'IFSC',
    payload: { bank: { ifsc: 'HDFC0001234' } } },
  { id: 'upi-vpa', isPII: true, category: 'UPI',
    payload: { payee: 'merchant@hdfcbank' } },
  { id: 'ssn-us', isPII: true, category: 'SSN',
    note: 'Category is SSN, which is NOT in the PIIType union in pii-type.ts. ' +
          'The firewall returns it anyway, so the type union is narrower than ' +
          'the runtime behaviour. Worth a separate issue - do not "fix" the ' +
          'corpus to match the type, the firewall is the authority here.',
    payload: { tax: { ssn: '123-45-6789' } } },
  { id: 'api-key-assignment', isPII: true, category: 'API_KEY',
    note: 'Label:value form, matched by the assignment rule.',
    payload: { config: 'api_key=«redacted:sk-…»' } },
  // The assignment rule above needs a real-looking value to bite on. These are
  // the bare-prefix rules added in #164 (fix: close two fail-open paths). They
  // are matched by prefix alone, with no key=value around them - which is
  // exactly why they are separate patterns and why dropping them is dangerous.
  { id: 'api-key-openai-prefix', isPII: true, category: 'API_KEY',
    note: 'Bare sk- prefix, no assignment. Requires the #164 prefix rule.',
    payload: { note: 'found token sk-abcdefghij0123456789ABCD in the page source' } },
  { id: 'api-key-aws-access-key-id', isPII: true, category: 'API_KEY',
    payload: { note: 'config contained AKIAIOSFODNN7EXAMPLE inline' } },
  { id: 'api-key-github-pat', isPII: true, category: 'API_KEY',
    payload: { note: 'leaked ghp_abcdefghijklmnopqrstuvwxyz0123456789 in a log' } },
  { id: 'api-key-jwt', isPII: true, category: 'API_KEY',
    payload: { header: 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U' } },
  { id: 'nested-array-deep', isPII: true, category: 'EMAIL',
    note: 'Deep recursion — the walker must descend, not just read the top level.',
    payload: { a: { b: { c: { d: ['ok', 'ok', 'leak@target.com'] } } } } },
  { id: 'pii-in-prose', isPII: true, category: 'PAN',
    note: 'PII hidden in a long free-text field, not a labelled key.',
    payload: { note: 'Please confirm the KYC for ABCPE1234F before we proceed.' } },
];

export const BENIGN: Case[] = [
  { id: 'order-id-12digit', isPII: false,
    note: '12 digits, same shape as Aadhaar, fails the Verhoeff checksum.',
    payload: { orderId: '2024 0917 4521' } },
  { id: 'timestamp-ms', isPII: false,
    note: '13 digits, same shape as Aadhaar, fails the checksum.',
    payload: { ts: '1726480000000' } },
  { id: 'build-hash', isPII: false,
    payload: { sha: 'a1b2c3d4e5f6' } },
  { id: 'product-sku', isPII: false,
    payload: { sku: 'WIDGET-5000-BLUE-L' } },
  { id: 'price', isPII: false,
    payload: { total: 'INR 12,499.00' } },
  { id: 'iban-like-long-digits', isPII: false,
    note: '18 digits, would pass a naive 13-19 digit card rule, fails Luhn.',
    payload: { ref: '123456789012345678' } },
  { id: 'plain-sentence', isPII: false,
    payload: 'Please summarise the quarterly numbers and flag anything unusual.' },
  { id: 'html-snippet', isPII: false,
    payload: { dom: '<div class="row"><span>Total</span><span>1200</span></div>' } },
  { id: 'url-no-email', isPII: false,
    payload: { link: 'https://example.com/reports/2026/q1' } },
  { id: 'username-not-email', isPII: false,
    payload: { user: 'admin' } },
  { id: 'empty-string', isPII: false,
    payload: { note: '' } },
  { id: 'already-redacted', isPII: false,
    note: 'A previous pass already replaced it; redaction must be idempotent.',
    payload: { ssn: '[REDACTED]' } },
  { id: 'nested-benign', isPII: false,
    payload: { items: [{ name: 'Widget A' }, { name: 'Widget B' }] } },
  { id: 'pan-shaped-but-invalid-entity', isPII: false,
    note: 'ABCDE1234F is well-formed EXCEPT its 4th char, D, which is not a ' +
          'valid NSDL entity type. This is the case that proves the validator ' +
          'does real work instead of regex matching. Found by this harness ' +
          'during authoring — the first corpus wrongly listed it as real PII.',
    payload: { ref: 'ABCDE1234F' } },
];

export const ALL: Case[] = [...TRUE_PII, ...BENIGN];
