/** A function returning a number from 0 (inclusive) to 1 (exclusive), like `Math.random`. */
export type RandomSource = () => number

/**
 * Returns a random whole number from `min` to `max`, including both ends.
 * Pass `random` to control the result in tests.
 */
export function randomInt(min: number, max: number, random: RandomSource = Math.random): number {
  if (!Number.isInteger(min) || !Number.isInteger(max)) {
    throw new RangeError(`randomInt needs whole numbers, got ${min} and ${max}`)
  }
  if (min > max) {
    throw new RangeError(`randomInt needs min <= max, got ${min} and ${max}`)
  }
  return min + Math.floor(random() * (max - min + 1))
}

/** Returns a random item from a non-empty array. */
export function pickRandom<T>(items: readonly T[], random: RandomSource = Math.random): T {
  if (items.length === 0) {
    throw new RangeError('pickRandom needs at least one item')
  }
  return items[randomInt(0, items.length - 1, random)]
}

/** Returns a shuffled copy of `items` (Fisher–Yates). The original array is not changed. */
export function shuffle<T>(items: readonly T[], random: RandomSource = Math.random): T[] {
  const result = [...items]
  for (let i = result.length - 1; i > 0; i--) {
    const j = randomInt(0, i, random)
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}
