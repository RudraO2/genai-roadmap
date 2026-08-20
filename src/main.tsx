import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'

import App from './App.tsx'
import './index.css'

// The phone browser's own chrome, painted in the app's paper. Read from the
// stylesheet rather than written into index.html, because theme.css is the one
// file allowed to hold a colour value and swapping the theme has to swap this
// with it. Nothing depends on it, so a browser without the tag loses nothing.
const themeColour = document.querySelector('meta[name="theme-color"]')
if (themeColour) {
  const paper = getComputedStyle(document.documentElement).getPropertyValue('--surface-base').trim()
  if (paper) themeColour.setAttribute('content', paper)
}

const container = document.getElementById('root')
if (!container) throw new Error('missing #root element')

createRoot(container).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
