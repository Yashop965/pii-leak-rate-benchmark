/**
 * Report renderer. Split out so the harness reads as method, not formatting.
 */
import type { Case } from '../corpus/corpus';

export interface Row {
  id: string;
  category?: string;
  isPII: boolean;
  blocked: boolean;
  blockedCategory?: string;
  correctReason: boolean;
}

const pct = (n: number, d: number) => (d === 0 ? '0.00' : ((n / d) * 100).toFixed(2));

export function renderReport(rows: Row[], corpus: Case[]): string {
  const pii = rows.filter((r) => r.isPII);
  const benign = rows.filter((r) => !r.isPII);
  const leaked = pii.filter((r) => !r.blocked);
  const noise = benign.filter((r) => r.blocked);

  const size = (id: string) =>
    JSON.stringify(corpus.find((c) => c.id === id)!.payload).length;
  const leakedBytes = leaked.reduce((n, r) => n + size(r.id), 0);
  const totalPiiBytes = pii.reduce((n, r) => n + size(r.id), 0);

  const L: string[] = [
    '',
    '╔══════════════════════════════════════════════════════════════╗',
    '║           PII LEAK-RATE BENCHMARK                            ║',
    '╚══════════════════════════════════════════════════════════════╝',
    '',
    `  corpus                 ${rows.length} payloads (${pii.length} PII / ${benign.length} benign)`,
    `  LEAK RATE              ${pct(leaked.length, pii.length)}%   (${leaked.length}/${pii.length} real PII escaped)`,
    `  bytes of PII leaked    ${leakedBytes} of ${totalPiiBytes}  (${pct(leakedBytes, totalPiiBytes)}%)`,
    `  FALSE-POSITIVE RATE    ${pct(noise.length, benign.length)}%   (${noise.length}/${benign.length} benign blocked)`,
    '',
    '  per-category:',
  ];

  const byCat = new Map<string, { tot: number; leaked: number }>();
  for (const r of pii) {
    const c = r.category ?? 'UNKNOWN';
    const e = byCat.get(c) ?? { tot: 0, leaked: 0 };
    e.tot += 1;
    if (!r.blocked) e.leaked += 1;
    byCat.set(c, e);
  }
  for (const [c, e] of [...byCat.entries()].sort()) {
    L.push(`    ${c.padEnd(16)} ${e.tot - e.leaked}/${e.tot} blocked`);
  }

  if (leaked.length) {
    L.push('', '  LEAKED (escaped the firewall):');
    for (const r of leaked) L.push(`    x ${r.id}  [${r.category}]`);
  }
  if (noise.length) {
    L.push('', '  FALSE POSITIVES (benign text wrongly blocked):');
    for (const r of noise) L.push(`    ! ${r.id}  -> ${r.blockedCategory}`);
  }

  L.push('');
  return L.join('\n');
}
