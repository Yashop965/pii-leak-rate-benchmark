/**
 * PIIType — copied verbatim from the Machina extension's `src/types/index.ts`
 * (line 26). The benchmark vendors the type so `firewall.ts` and `types.ts`
 * compile standalone, exactly as they do in the product.
 *
 * This is a TYPE, erased at runtime. Nothing here can change the benchmark
 * result; it exists so the vendored source is unmodified apart from its import
 * path.
 */
export type PIIType =
  | 'AADHAAR'
  | 'PAN'
  | 'CREDIT_CARD'
  | 'IFSC'
  | 'PHONE'
  | 'EMAIL'
  | 'PASSWORD_FIELD'
  | 'API_KEY'
  | 'FACE_DETECTED'
  | 'TEXT_PASSWORD';
