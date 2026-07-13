// Note: this particular file was completely AI Generated

/**
 * A fast, deterministic 3D hash function that scrambles x, y, and z bits.
 * Returns an unsigned 32-bit integer.
 */
function hash3D(x: number, y: number, z: number): number {
    // 1. Force inputs to signed 32-bit integers
    let u = x | 0;
    let v = y | 0;
    let w = z | 0;

    // 2. Initial high-entropy multi-axis scramble using prime multipliers
    u = Math.imul(u, 1664525) + Math.imul(v, 1013904223) + w;
    v = Math.imul(v, 1664525) + Math.imul(w, 1013904223) + u;
    w = Math.imul(w, 1664525) + Math.imul(u, 1013904223) + v;

    // 3. Xorshift bit-folding to scatter local bit patterns
    u ^= u >>> 16;
    v ^= v >>> 16;
    w ^= w >>> 16;

    // 4. Secondary cross-mix multiplication
    u += Math.imul(v, w);
    v += Math.imul(w, u);
    w += Math.imul(u, v);

    // 5. Final distribution step to ensure complete avalanching
    let finalHash = u ^ (v >>> 15) ^ (w >>> 13);
    
    // Return as an unsigned 32-bit integer (0 to 4294967295)
    return finalHash >>> 0;
}

/**
 * Returns a pseudorandom integer from 0 to mod - 1.
 * Non-continuous, deterministic based on x, y, z.
 */
export function noiseFixed(x: number, y: number, z: number, mod: number): number {
    if (mod <= 0) return 0;
    // Modulo arithmetic on the raw 32-bit hash
    return hash3D(x, y, z) % mod;
}

/**
 * Returns a pseudorandom float from 0.0 (inclusive) to 1.0 (exclusive).
 * Non-continuous, deterministic based on x, y, z.
 */
export function noiseFloat(x: number, y: number, z: number = 0): number {
    // Divide by 2^32 (4294967296) to map the unsigned 32-bit int to the [0, 1) range
    return hash3D(x, y, z) / 4294967296;
}