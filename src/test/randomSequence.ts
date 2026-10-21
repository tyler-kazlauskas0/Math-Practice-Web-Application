import type { RandomSource } from '../utils/random'

/** The largest value `Math.random` can return, which makes `randomInt` pick its maximum. */
export const ALMOST_ONE = 0.9999999

/** A fake random source that returns `values` in order, repeating from the start when done. */
export function randomSequence(...values: number[]): RandomSource {
  let index = 0
  return () => values[index++ % values.length]
}

/** Runs `check` on many samples. */
export function repeat(times: number, check: () => void) {
  for (let i = 0; i < times; i++) check()
}
