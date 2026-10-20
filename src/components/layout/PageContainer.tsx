import type { ReactNode } from 'react'

interface PageContainerProps {
  /** Shown as the page's main heading. Leave out if the page renders its own `<h1>`. */
  title?: string
  children: ReactNode
}

/** Wraps a page's content with consistent width and spacing. */
function PageContainer({ title, children }: PageContainerProps) {
  return (
    <main id="main-content" className="page-container" tabIndex={-1}>
      {title && <h1>{title}</h1>}
      {children}
    </main>
  )
}

export default PageContainer
