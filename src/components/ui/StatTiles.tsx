import type { CSSProperties } from 'react'
import './statTiles.css'

export interface StatTile {
  label: string
  value: string | number
}

/** A row of big numbers with labels, e.g. "10 Questions · 8 Right". */
function StatTiles({ tiles, label }: { tiles: StatTile[]; label?: string }) {
  return (
    <dl
      className="stat-tiles"
      aria-label={label}
      style={{ '--tile-count': tiles.length } as CSSProperties}
    >
      {tiles.map((tile) => (
        <div key={tile.label} className="stat-tiles__item">
          <dt>{tile.label}</dt>
          <dd>{tile.value}</dd>
        </div>
      ))}
    </dl>
  )
}

export default StatTiles
