/**
 * src/lib/book-palette.ts
 * ---------------------------------------------------------------
 * Intelligent automated color palette generator for books.
 * Automatically generates harmonious, high-contrast gradients
 * (dark-mode and light-mode friendly) based on book title & genres,
 * or extracts them from uploaded cover images.
 * ---------------------------------------------------------------
 */

import { extractDominantColors } from './extract-colors'
import path from 'path'
import fs from 'fs'

// Curated luxury color palettes with balanced contrast for dark & light UI
const GENRE_PALETTES: Record<string, { from: string; to: string; accent: string }[]> = {
  classic: [
    { from: '#3b2d1f', to: '#1a140e', accent: '#f4d35e' }, // Warm Antique Gold & Leather
    { from: '#2e1065', to: '#0f0728', accent: '#fbbf24' }, // Royal Imperial Purple & Gold
    { from: '#1e3a5f', to: '#0d1b2a', accent: '#e0a96d' }, // Oxford Navy & Bronze
    { from: '#4a154b', to: '#1e0520', accent: '#f6c90e' }, // Vintage Plum & Ochre
  ],
  adventure: [
    { from: '#064e3b', to: '#022c22', accent: '#34d399' }, // Deep Forest Emerald
    { from: '#1e3a8a', to: '#0f172a', accent: '#38bdf8' }, // Ocean Depth & Azure
    { from: '#78350f', to: '#451a03', accent: '#fb923c' }, // Desert Terracotta & Sunset
    { from: '#134e4a', to: '#042f2e', accent: '#2dd4bf' }, // Nordic Pine & Turquoise
  ],
  fantasy: [
    { from: '#581c87', to: '#2e1065', accent: '#c084fc' }, // Mystic Amethyst
    { from: '#1e1b4b', to: '#090820', accent: '#818cf8' }, // Starry Midnight Sky
    { from: '#0f766e', to: '#042f2e', accent: '#5eead4' }, // Elven Teal
    { from: '#831843', to: '#4c0519', accent: '#f472b6' }, // Enchanted Crimson
  ],
  mystery: [
    { from: '#18181b', to: '#09090b', accent: '#e4e4e7' }, // Obsidian & Silver
    { from: '#312e81', to: '#1e1b4b', accent: '#a5b4fc' }, // Noir Indigo
    { from: '#1c1917', to: '#0c0a09', accent: '#d97706' }, // Shadow & Amber Gaslight
  ],
  romance: [
    { from: '#881337', to: '#4c0519', accent: '#fda4af' }, // Velvet Rose
    { from: '#701a75', to: '#4a044e', accent: '#f0abfc' }, // Orchid & Silk
    { from: '#9a3412', to: '#431407', accent: '#fdba74' }, // Warm Autumn Copper
  ],
  scifi: [
    { from: '#0c4a6e', to: '#082f49', accent: '#38bdf8' }, // Cyber Azure
    { from: '#3730a3', to: '#1e1b4b', accent: '#818cf8' }, // Deep Nebula
    { from: '#042f2e', to: '#021e1d', accent: '#2dd4bf' }, // Matrix Emerald
  ],
  philosophy: [
    { from: '#27272a', to: '#18181b', accent: '#f4d35e' }, // Titanium & Gold
    { from: '#3f3f46', to: '#18181b', accent: '#67e8f9' }, // Slate & Cyan
    { from: '#451a03', to: '#1c0a00', accent: '#f59e0b' }, // Ancient Papyrus & Amber
  ],
}

/** Deterministic hash for string */
function stringHash(str: string): number {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash)
}

/**
 * Automatically generates an intelligent, harmonious color palette
 * for a book based on its title and genres.
 */
export function generateBookPalette(title: string, genres: string[] = []): { coverFrom: string; coverTo: string; coverAccent: string } {
  const normGenres = genres.map((g) => g.toLowerCase().trim())

  let targetCategory = 'classic'
  if (normGenres.some((g) => g.includes('advent') || g.includes('سفر') || g.includes('ماجرا'))) {
    targetCategory = 'adventure'
  } else if (normGenres.some((g) => g.includes('fant') || g.includes('جادو') || g.includes('فانتزی'))) {
    targetCategory = 'fantasy'
  } else if (normGenres.some((g) => g.includes('myst') || g.includes('detect') || g.includes('جنایی') || g.includes('معما'))) {
    targetCategory = 'mystery'
  } else if (normGenres.some((g) => g.includes('rom') || g.includes('عاشق') || g.includes('عاطفی'))) {
    targetCategory = 'romance'
  } else if (normGenres.some((g) => g.includes('sci') || g.includes('space') || g.includes('علمی'))) {
    targetCategory = 'scifi'
  } else if (normGenres.some((g) => g.includes('phil') || g.includes('essay') || g.includes('فلسف'))) {
    targetCategory = 'philosophy'
  }

  const palettes = GENRE_PALETTES[targetCategory] || GENRE_PALETTES.classic
  const index = stringHash(title || 'book') % palettes.length
  const selected = palettes[index]
  return {
    coverFrom: selected.from,
    coverTo: selected.to,
    coverAccent: selected.accent,
  }
}

/**
 * Tries to extract colors from a Payload Media document or file on disk.
 */
export async function extractColorsFromMediaDoc(
  mediaDocOrId: any,
  payload: any,
): Promise<{ coverFrom: string; coverTo: string; coverAccent: string } | null> {
  try {
    let mediaDoc = mediaDocOrId
    if (typeof mediaDocOrId === 'string' || typeof mediaDocOrId === 'number') {
      mediaDoc = await payload.findByID({
        collection: 'media',
        id: mediaDocOrId,
      })
    }

    if (!mediaDoc || !mediaDoc.filename) return null

    // Look for file in public/media or uploads
    const possiblePaths = [
      path.join(process.cwd(), 'public', 'media', mediaDoc.filename),
      path.join(process.cwd(), 'media', mediaDoc.filename),
      path.join(process.cwd(), 'public', 'covers', mediaDoc.filename),
    ]

    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        const buffer = await fs.promises.readFile(filePath)
        const extracted = await extractDominantColors(buffer)
        if (extracted) {
          return {
            coverFrom: extracted.from,
            coverTo: extracted.to,
            coverAccent: extracted.accent,
          }
        }
      }
    }
  } catch (err) {
    console.error('[extractColorsFromMediaDoc] error:', err)
  }
  return null
}
