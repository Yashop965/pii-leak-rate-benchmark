/**
 * PII Leak-Rate Benchmark
 * ======================
 *
 * Measures the number no browser-agent vendor publishes:
 *
 *   how many bytes of real PII escape the machine?
 *
 * Task-success scores measure the model. This measures the DEPLOYMENT. An
 * agent that streams page content to a vendor's inference servers leaks by
 * construction; one that filters before egress does not. That is the whole
 * claim, and this harness exists to make it falsifiable.
 *
 * The firewall under test is vendored verbatim from the Machina extension
 * (src/firewall.ts). It is not a re-implementation, so the number cannot
 * drift from what ships.
 *
 *   npm install && npm run bench
 */
import { describe, it, expect } from 'vitest';
import { checkOutboundPayload } from '../src/firewall';
import { ALL, type Case } from '../corpus/corpus';
import { renderReport, type Row } from './report';

function runOne(c: Case): Row {
  const r = checkOutboundPayload(c.payload);
  const blocked = !r.passed;
  const blockedCategory = (r as { blockedCategory?: string }).blockedCategory;
  return {
    id: c.id,
    category: c.category,
    isPII: c.isPII,
    blocked,
    blockedCategory,
    // Blocked is not enough — it must be blocked FOR THE RIGHT REASON.
    correctReason: c.isPII
      ? blocked && (!c.category || blockedCategory === c.category)
      : !blocked,
  };
}

describe('PII leak-rate benchmark', () => {
  const rows = ALL.map(runOne);

  it('reports the benchmark', () => {
    // eslint-disable-next-line no-console
    console.log(renderReport(rows, ALL));
    expect(rows.length).toBe(ALL.length);
  });

  it('leak rate is 0% — no real PII escapes', () => {
    const leaked = rows.filter((r) => r.isPII && !r.blocked);
    const detail = leaked.map((r) => `${r.id} [${r.category}]`).join(', ');
    expect(leaked.length, `PII leaked: ${detail || 'none'}`).toBe(0);
  });

  it('blocks for the correct category, not merely any reason', () => {
    const wrong = rows.filter((r) => r.isPII && r.blocked && !r.correctReason);
    const detail = wrong
      .map((r) => `${r.id}: expected ${r.category}, got ${r.blockedCategory}`)
      .join('; ');
    expect(wrong.length, `wrong-category blocks: ${detail || 'none'}`).toBe(0);
  });

  it('false-positive rate stays under 20% on hard negatives', () => {
    const noise = rows.filter((r) => !r.isPII && r.blocked).length;
    const benign = rows.filter((r) => !r.isPII).length;
    expect(noise / benign, `false positives: ${noise}/${benign}`).toBeLessThan(0.2);
  });

  it('zero bytes of PII reach the wire', () => {
    const leaked = rows.filter((r) => r.isPII && !r.blocked);
    const bytes = leaked.reduce(
      (n, r) => n + JSON.stringify(ALL.find((c) => c.id === r.id)!.payload).length, 0);
    expect(bytes, 'bytes of PII that reached the wire').toBe(0);
  });
});
