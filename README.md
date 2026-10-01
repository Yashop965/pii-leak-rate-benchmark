# PII Leak-Rate Benchmark

**How many bytes of real PII escape the machine while an AI browser agent works?**

Every browser-agent vendor publishes how well their agent *completes tasks*.
Almost none publish how much customer data left the machine while it did so —
because for a cloud agent the answer is structurally "all of it".

This measures that number. It is deliberately small, deliberately honest about
its own limits, and reproducible by anyone.

```bash
git clone https://github.com/Yashop965/pii-leak-rate-benchmark
cd pii-leak-rate-benchmark
npm install
npm run bench
```

---

## Why leak rate and not a task-success score

A task-success score is a property of the **model**. Leak rate is a property of
the **deployment**.

That distinction is the whole point. A cloud agent that ships page content to an
inference API leaks by construction — not because its model is bad, but because
of where it runs. An on-device agent that filters before egress does not. These
are not competing on the same axis, and no amount of benchmark-tuning changes
the cloud case.

It is also the one number a compliance officer can use internally, which is why
we think it is the right one to publish.

---

## Current result

```
corpus                 26 payloads (12 PII / 14 benign)
LEAK RATE              0.00%   (0/12 real PII escaped)
bytes of PII leaked    0 of 458  (0.00%)
FALSE-POSITIVE RATE    0.00%   (0/14 benign blocked)

per-category:  AADHAAR 1/1 · API_KEY 1/1 · CREDIT_CARD 2/2 · EMAIL 2/2
               IFSC 1/1 · PAN 2/2 · PHONE 1/1 · SSN 1/1 · UPI 1/1
tests:         14 passed (2 files) — 5 benchmark, 9 corpus-integrity
```

Read the limitations below before citing this. **n=26 is not a leaderboard
entry.** It is a measurement harness with a small, verified, labelled set.

---

## Method

1. **A labelled corpus.** 12 payloads carrying checksum-valid PII (Verhoeff
   Aadhaar, Luhn cards, NSDL-entity PANs) and 14 benign look-alikes chosen to
   be *hard*.
2. **Every payload goes through the production firewall**
   (`checkOutboundPayload`), vendored verbatim from the Machina browser
   extension. Not a re-implementation — the number cannot drift from what ships.
3. **Two numbers, plus bytes.** Leak rate and false-positive rate, and how many
   bytes of PII actually reached the wire. An aggregate hides everything, so a
   per-category table is included.
4. **The labels are themselves tested.** `tests/corpus-integrity.test.ts`
   asserts every ground-truth label against the same validators the firewall
   uses. A mislabelled case fails the build rather than quietly inflating the
   score.

That last point is not ceremony. It is there because this harness caught itself:
the first corpus listed `ABCDE1234F` as a real PAN, when its 4th character `D`
is not a valid NSDL entity type. **The corpus was wrong, not the firewall.**
That string is now a *benign* case, because it is exactly the test that proves
the validator does real work instead of regex matching.

---

## What this does NOT measure

Stated plainly, because a benchmark that oversells itself is marketing.

| Limitation | Why it matters |
|---|---|
| **n=26 is small** | A reviewer will say so. This is a foundation, not a leaderboard entry. |
| **0% FP is partly self-selected** | We chose the benign cases. Honest as measured, unremarkable as evidence. It does **not** reproduce any larger end-to-end result. |
| **It tests the firewall, not the agent** | 0% means: *given a payload that reaches the firewall, the firewall holds.* It does not prove every payload reaches the firewall. |
| **No adversarial nesting** | No unicode obfuscation, whitespace tricks, base64 blobs, PII split across strings, or PII in URLs and form-encoded bodies. |
| **No boundary probing** | The production walker caps depth at 10 and strings at 10,000 chars. Neither limit is tested. |
| **Per-payload, not per-run** | Real leakage depends on what the agent captures. This isolates the last line of defence. |

### What would make it publishable-grade

1. Grow the corpus to 200+ cases.
2. Add the attack shapes listed above — that is where a real firewall is tested.
3. Cover every egress call site, not just the firewall function.
4. Measure FP rate against real page text and DOM dumps, not chosen strings.
5. Publish results for multiple agents, not just one.

Until at least 1–3 are done, present this as **"here is our harness"**, not as
a benchmark result.

---

## Contributing

Adversarial cases are the most valuable contribution. If you find a payload that
leaks, open an issue with the payload and the category you expected — that is a
security finding, and we will treat it as one.

Adding a corpus case means adding it to `corpus/corpus.ts` **and** a label
assertion in `tests/corpus-integrity.test.ts`. If the two disagree, the build
fails.

## License

MIT. The vendored firewall is from the Machina browser extension, also MIT.
