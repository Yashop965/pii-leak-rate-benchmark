/**
 * Corpus integrity — the labels must match reality.
 *
 * A benchmark whose ground truth is wrong is worse than no benchmark: it
 * reports a confident number about cases nobody checked. So every label in
 * corpus.ts is asserted here against the SAME validator the firewall uses.
 *
 * If a case is ever edited, this fails. That is the point.
 */
import { describe, it, expect } from 'vitest';
import { validateAadhaar, validatePAN, validateCard } from '../src/validators';
import { TRUE_PII, BENIGN } from '../corpus/corpus';

const digits = (s: string) => s.replace(/\D/g, '');

describe('corpus: TRUE_PII cases are genuinely PII', () => {
  it('aadhaar-valid passes Verhoeff', () => {
    const c = TRUE_PII.find((x) => x.id === 'aadhaar-valid')!;
    const v = (c.payload as any).form.aadhaar;
    expect(digits(v)).toHaveLength(12);
    expect(validateAadhaar(v)).toBe(true);
  });

  it('pan-entity has a valid NSDL entity character', () => {
    const c = TRUE_PII.find((x) => x.id === 'pan-entity')!;
    const v = (c.payload as any).kyc.pan;
    expect(validatePAN(v)).toBe(true);
  });

  it('both card vectors pass Luhn', () => {
    for (const id of ['card-luhn-16', 'card-luhn-15-amex']) {
      const c = TRUE_PII.find((x) => x.id === id)!;
      const v = (c.payload as any).payment?.card ?? (c.payload as any).history.raw;
      expect(validateCard(v), `${id} must pass Luhn`).toBe(true);
    }
  });

  it('every TRUE_PII case declares a category', () => {
    for (const c of TRUE_PII) {
      expect(c.category, `${c.id} has no category`).toBeTruthy();
    }
  });
});

describe('corpus: BENIGN cases are genuinely non-PII', () => {
  it('the 12-digit order ID fails Verhoeff', () => {
    const c = BENIGN.find((x) => x.id === 'order-id-12digit')!;
    const v = (c.payload as any).orderId;
    expect(digits(v)).toHaveLength(12);   // same shape as Aadhaar
    expect(validateAadhaar(v)).toBe(false);
  });

  it('the 13-digit timestamp fails Verhoeff', () => {
    const c = BENIGN.find((x) => x.id === 'timestamp-ms')!;
    const v = (c.payload as any).ts;
    expect(validateAadhaar(v)).toBe(false);
  });

  it('the 18-digit reference fails Luhn', () => {
    const c = BENIGN.find((x) => x.id === 'iban-like-long-digits')!;
    const v = (c.payload as any).ref;
    expect(digits(v).length).toBeGreaterThan(13);
    expect(validateCard(v)).toBe(false);
  });

  it('the PAN-shaped string has an INVALID entity char', () => {
    const c = BENIGN.find((x) => x.id === 'pan-shaped-but-invalid-entity')!;
    const v = (c.payload as any).ref;
    expect(v).toMatch(/^[A-Z]{5}\d{4}[A-Z]$/);   // format is perfect
    expect(v[3]).toBe('D');                      // ...but D is not an entity type
    expect(validatePAN(v)).toBe(false);
  });

  it('none of the benign cases are labelled PII', () => {
    for (const c of BENIGN) expect(c.isPII).toBe(false);
  });
});
