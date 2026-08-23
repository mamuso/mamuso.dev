import { parsePostDate } from './constants'
import type { PostCategory, PostFrontmatter } from './types'

export function parsePostFrontmatter(
  value: unknown,
  source = 'post frontmatter'
): PostFrontmatter {
  if (!isRecord(value)) throw new TypeError(`${source} must be an object`)

  const title = requiredString(value, 'title', source)
  const date = requiredString(value, 'date', source)
  try {
    parsePostDate(date)
  } catch (error) {
    throw new RangeError(`${source}.date is invalid: ${date}`, { cause: error })
  }

  return {
    title,
    date,
    summary: optionalString(value, 'summary', source),
    category: optionalCategory(value.category, source),
    basename: optionalString(value, 'basename', source),
    camera: optionalString(value, 'camera', source),
    iso: optionalNumber(value, 'iso', source),
    fnumber: optionalNumber(value, 'fnumber', source),
    exposureBiasValue: optionalNumber(value, 'exposureBiasValue', source),
    exposureTime: optionalString(value, 'exposureTime', source),
    GPSLatitude: optionalCoordinate(value, 'GPSLatitude', source),
    GPSLongitude: optionalCoordinate(value, 'GPSLongitude', source),
    width: optionalNumber(value, 'width', source),
    height: optionalNumber(value, 'height', source),
    colorPalette: optionalStringArray(value, 'colorPalette', source),
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function requiredString(
  value: Record<string, unknown>,
  field: string,
  source: string
): string {
  const result = optionalString(value, field, source)
  if (result === undefined) throw new TypeError(`${source}.${field} is required`)
  return result
}

function optionalString(
  value: Record<string, unknown>,
  field: string,
  source: string
): string | undefined {
  const fieldValue = value[field]
  if (fieldValue === undefined) return undefined
  if (typeof fieldValue !== 'string' || fieldValue.length === 0) {
    throw new TypeError(`${source}.${field} must be a non-empty string`)
  }
  return fieldValue
}

function optionalNumber(
  value: Record<string, unknown>,
  field: string,
  source: string
): number | undefined {
  const fieldValue = value[field]
  if (fieldValue === undefined) return undefined
  if (typeof fieldValue !== 'number' || !Number.isFinite(fieldValue)) {
    throw new TypeError(`${source}.${field} must be a finite number`)
  }
  return fieldValue
}

function optionalCoordinate(
  value: Record<string, unknown>,
  field: string,
  source: string
): number | undefined {
  if (value[field] === 'NaN') return undefined
  return optionalNumber(value, field, source)
}

function optionalCategory(
  value: unknown,
  source: string
): PostCategory | undefined {
  if (value === undefined) return undefined
  if (value === 'photo' || value === 'note' || value === 'code') return value
  throw new TypeError(`${source}.category is not a supported category`)
}

function optionalStringArray(
  value: Record<string, unknown>,
  field: string,
  source: string
): string[] | undefined {
  const fieldValue = value[field]
  if (fieldValue === undefined) return undefined
  if (!Array.isArray(fieldValue) || !fieldValue.every((item) => typeof item === 'string')) {
    throw new TypeError(`${source}.${field} must be an array of strings`)
  }
  return fieldValue
}
