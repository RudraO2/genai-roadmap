import type { ReactNode } from 'react'

export type MapView = 'map' | 'list'

export interface MapControlsProps {
  view: MapView
  onView: (view: MapView) => void
  /** Null when the map cannot be shown at this width, which disables the toggle. */
  mapAvailable: boolean
  search: string
  onSearch: (term: string) => void
  showOptional: boolean
  onShowOptional: (value: boolean) => void
  hideDone: boolean
  onHideDone: (value: boolean) => void
  zoom: number
  onZoom: (zoom: number) => void
}

export const ZOOM_MIN = 0.5
export const ZOOM_MAX = 1.4
const ZOOM_STEP = 0.1

const round = (value: number): number => Math.round(value * 100) / 100

/**
 * The instrument strip above the map: find a quest, choose what is on screen, and
 * change the scale. Every control here is a filter on the same layout — none of
 * them navigates, so nothing you are looking at moves out from under you.
 */
export function MapControls({
  view,
  onView,
  mapAvailable,
  search,
  onSearch,
  showOptional,
  onShowOptional,
  hideDone,
  onHideDone,
  zoom,
  onZoom,
}: MapControlsProps): ReactNode {
  return (
    <div className="controls">
      <div className="controls__group controls__group--find">
        <label className="controls__search">
          <span className="controls__label">Find</span>
          <input
            type="search"
            className="controls__input"
            value={search}
            placeholder="rag, agents, lora, prompt…"
            onChange={(event) => onSearch(event.target.value)}
          />
        </label>
      </div>

      <div className="controls__group">
        <button
          type="button"
          className="controls__toggle"
          aria-pressed={showOptional}
          onClick={() => onShowOptional(!showOptional)}
        >
          Side quests
        </button>
        <button
          type="button"
          className="controls__toggle"
          aria-pressed={hideDone}
          onClick={() => onHideDone(!hideDone)}
        >
          Hide done
        </button>
      </div>

      <div className="controls__group">
        <button
          type="button"
          className="controls__toggle"
          aria-pressed={view === 'map'}
          disabled={!mapAvailable}
          onClick={() => onView('map')}
        >
          Map
        </button>
        <button
          type="button"
          className="controls__toggle"
          aria-pressed={view === 'list'}
          onClick={() => onView('list')}
        >
          List
        </button>
      </div>

      {view === 'map' ? (
        <div className="controls__group controls__group--zoom">
          <button
            type="button"
            className="controls__step"
            aria-label="Zoom out"
            disabled={zoom <= ZOOM_MIN}
            onClick={() => onZoom(round(Math.max(ZOOM_MIN, zoom - ZOOM_STEP)))}
          >
            −
          </button>
          <button type="button" className="controls__zoom" onClick={() => onZoom(1)}>
            {Math.round(zoom * 100)}%
          </button>
          <button
            type="button"
            className="controls__step"
            aria-label="Zoom in"
            disabled={zoom >= ZOOM_MAX}
            onClick={() => onZoom(round(Math.min(ZOOM_MAX, zoom + ZOOM_STEP)))}
          >
            +
          </button>
        </div>
      ) : null}
    </div>
  )
}
