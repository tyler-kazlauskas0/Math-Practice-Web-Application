// @vitest-environment node
/// <reference types="node" />
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

// Tests normally ignore stylesheets, so read this one from disk.
const css = readFileSync(new URL('./global.css', import.meta.url), 'utf8')

// The color tokens, read straight from the stylesheet so a future color change is checked too.
const colors = Object.fromEntries(
  [...css.matchAll(/--color-([\w-]+):\s*(#[0-9a-fA-F]{6})/g)].map(([, name, hex]) => [name, hex]),
)

function luminance(hex: string) {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/** The WCAG contrast ratio between two colors, from 1 (none) to 21 (black on white). */
function contrast(a: string, b: string) {
  const [light, dark] = [luminance(colors[a]), luminance(colors[b])].sort((x, y) => y - x)
  return (light + 0.05) / (dark + 0.05)
}

describe('color contrast (WCAG AA)', () => {
  it.each([
    ['text', 'bg'],
    ['text', 'surface'],
    ['text', 'primary-light'],
    ['text-muted', 'bg'],
    ['text-muted', 'surface'],
    ['text-muted', 'primary-light'],
    ['primary', 'surface'],
    ['primary', 'bg'],
    ['primary', 'primary-light'],
    ['on-primary', 'primary'],
    ['on-primary', 'primary-hover'],
    ['on-primary', 'success'],
    ['on-primary', 'error'],
    ['error', 'surface'],
    ['error', 'bg'],
    ['success', 'surface'],
    ['success', 'bg'],
  ])('%s text on %s is at least 4.5:1', (text, background) => {
    expect(contrast(text, background)).toBeGreaterThanOrEqual(4.5)
  })

  it.each([
    ['focus', 'bg'],
    ['focus', 'surface'],
    ['border-control', 'bg'],
    ['border-control', 'surface'],
    ['border-control', 'primary-light'],
  ])('%s against %s is at least 3:1 (outlines of controls and focus)', (part, background) => {
    expect(contrast(part, background)).toBeGreaterThanOrEqual(3)
  })
})
