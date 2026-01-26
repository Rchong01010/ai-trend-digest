import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Calculate similarity between two strings using word overlap (Jaccard similarity)
export function similarity(a: string, b: string): number {
  if (!a || !b) return 0

  // Normalize and tokenize
  const normalize = (str: string) =>
    str
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2) // Ignore very short words

  const wordsA = normalize(a)
  const wordsB = normalize(b)
  const setA = new Set(wordsA)
  const setB = new Set(wordsB)

  if (setA.size === 0 || setB.size === 0) return 0

  // Calculate intersection
  let intersectionSize = 0
  setA.forEach(word => {
    if (setB.has(word)) intersectionSize++
  })

  // Jaccard similarity: intersection / union
  const unionSize = setA.size + setB.size - intersectionSize
  return intersectionSize / unionSize
}

// Check if a trend title is too similar to any existing trends
export function isDuplicate(
  newTitle: string,
  existingTitles: string[],
  threshold: number = 0.8
): boolean {
  for (const existing of existingTitles) {
    if (similarity(newTitle, existing) > threshold) {
      return true
    }
  }
  return false
}
