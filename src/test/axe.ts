import axe from 'axe-core'

/**
 * Runs the axe accessibility checker on the page and returns its violations. Color contrast
 * is skipped because jsdom doesn't render styles; it is checked separately against the theme.
 */
export async function findAccessibilityViolations(root: Element = document.body) {
  const results = await axe.run(root, {
    rules: { 'color-contrast': { enabled: false } },
  })
  return results.violations.map(
    (violation) =>
      `${violation.id}: ${violation.help}\n  ${violation.nodes.map((node) => node.target.join(' ')).join('\n  ')}`,
  )
}
