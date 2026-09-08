import fs from 'node:fs'
import { join, basename } from 'node:path'
import { parseEditorialDate } from './editorial-date.ts'
import type { PostType } from './types'

export function validatePost(raw: Record<string, unknown>, file: string, slug: string, content: string, assetsDirectory: string): PostType {
  const fail = (field: string, reason: string): never => { throw new Error(`${file}: ${field} ${reason}`) }
  const string = (field: string, required = false): string | undefined => {
    const value = raw[field]
    if (value === undefined && !required) return undefined
    if (typeof value !== 'string' || !value.trim()) return fail(field, 'must be a non-empty string')
    return value
  }
  const number = (field: string, min = -Infinity, max = Infinity): number | undefined => {
    const value = raw[field]
    if (value === undefined) return undefined
    if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) return fail(field, `must be a finite number between ${min} and ${max}`)
    return value
  }
  const title = string('title', true)!
  const date = string('date', true)!
  try { parseEditorialDate(date) } catch { fail('date', 'must be a valid YYYY-MM-DD calendar day') }
  const category = raw.category ?? 'note'
  if (category !== 'photo' && category !== 'note' && category !== 'code') return fail('category', 'must be photo, note or code')
  const image = string('basename', category === 'photo')
  let dimensions: { basename: string; width: number; height: number } | undefined
  if (image !== undefined) {
    if (basename(image) !== image || image.includes('\\') || image === '.' || image === '..') fail('basename', 'must be a filename without path components')
    const width = number('width', 1), height = number('height', 1)
    if (!Number.isInteger(width) || !Number.isInteger(height)) fail('width/height', 'must be positive integer image dimensions')
    if (!fs.existsSync(join(assetsDirectory, image)) || !fs.statSync(join(assetsDirectory, image)).isFile()) fail('basename', `references a missing image: ${image}`)
    dimensions = { basename: image, width: width!, height: height! }
  } else if (raw.width !== undefined || raw.height !== undefined) fail('basename', 'is required when dimensions are provided')

  const photoStack = string('photoStack')
  const photoStackTitle = string('photoStackTitle')
  const photoStackOrder = number('photoStackOrder', 0)
  if (photoStack !== undefined) {
    if (category !== 'photo') fail('photoStack', 'is only allowed on photos')
    if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(photoStack)) fail('photoStack', 'must be a URL slug')
    if (!photoStackTitle) fail('photoStackTitle', 'is required for a stack')
  } else if (photoStackTitle !== undefined || photoStackOrder !== undefined) fail('photoStack', 'is required with stack title or order')
  if (photoStackOrder !== undefined && !Number.isInteger(photoStackOrder)) fail('photoStackOrder', 'must be an integer')

  // Older imports used the string "NaN" for unavailable GPS data. Never expose it as a coordinate.
  const coordinate = (field: string, limit: number) => raw[field] === 'NaN' ? undefined : number(field, -limit, limit)
  const GPSLatitude = coordinate('GPSLatitude', 90), GPSLongitude = coordinate('GPSLongitude', 180)
  if ((GPSLatitude === undefined) !== (GPSLongitude === undefined)) fail('GPSLatitude/GPSLongitude', 'must be provided together')
  const colorPalette = raw.colorPalette
  if (colorPalette !== undefined && (!Array.isArray(colorPalette) || !colorPalette.every(color => typeof color === 'string' && /^#[\da-f]{6}$/i.test(color)))) fail('colorPalette', 'must be an array of six-digit hex colors')
  const exposureTime = string('exposureTime')
  if (exposureTime !== undefined && (!/^\d+(?:\.\d+)?(?:\/\d+(?:\.\d+)?)?$/.test(exposureTime) || exposureTime.split('/').some(value => Number(value) <= 0))) fail('exposureTime', 'must be a positive duration or fraction')
  const common = {
    title, date, slug, content, summary: string('summary'), photoStack, photoStackTitle, photoStackOrder,
    camera: string('camera'), iso: number('iso', 1), fnumber: number('fnumber', Number.MIN_VALUE),
    exposureBiasValue: number('exposureBiasValue'), exposureTime, GPSLatitude, GPSLongitude,
    colorPalette: colorPalette as string[] | undefined,
  }
  if (category === 'photo') return { ...common, ...dimensions!, category }
  return dimensions ? { ...common, ...dimensions, category } : { ...common, category }
}
