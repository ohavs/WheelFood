/**
 * Deterministic PRNG.
 *
 * Used where a "random" result must stay stable across renders (and match
 * between server and client), e.g. the slices drawn onto the wheel. Real
 * randomness is reintroduced by folding a nonce into the seed whenever the
 * user asks for a reshuffle.
 */
export function seededRandom(seed: string): () => number {
  // xmur3 hash → 32-bit state, then mulberry32 for the stream.
  let h = 1779033703 ^ seed.length;
  for (let i = 0; i < seed.length; i += 1) {
    h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  let state = (h ^= h >>> 16) >>> 0;

  return function next() {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
