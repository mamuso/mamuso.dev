// Process the photos inside the content/originals folder
import * as fs from 'fs-extra'
import path from 'path'
import { getPaletteFromURL } from 'color-thief-node'
import * as exif from 'fast-exif'
import sharp from 'sharp'

// -----------------------------------------------------------
// Folders
const imageFolder: string = 'content/assets/originals/'
const thumbFolder: string = 'content/assets/feed/'
const dataFolder: string = 'content/posts/'

// Image dimensions
const WEB_IMAGE_WIDTH = 2048
const GALLERY_IMAGE_HEIGHT = 640

// -----------------------------------------------------------
// Types
interface ExifData {
  image?: {
    Make?: string
    Model?: string
  }
  exif?: {
    DateTimeOriginal?: string
    ISO?: number
    FNumber?: number
    ExposureBiasValue?: number
    ExposureTime?: number
    PixelXDimension?: number
    PixelYDimension?: number
  }
  gps?: {
    GPSLatitude?: [number, number, number]
    GPSLongitude?: [number, number, number]
  }
}

// -----------------------------------------------------------

const convertGPSToDecimal = (coords: [number, number, number] | undefined): number | null => {
  if (!coords || coords.length !== 3) return null
  return coords[0] + coords[1] / 60 + coords[2] / 3600
}

const processPhotos = async () => {
  try {
    const files = await fs.readdir(imageFolder)

    for (const file of files) {
      try {
        const targetImage = `${imageFolder}${file}`
        const exifData = await exif.read(targetImage) as ExifData | undefined

        // Validate required EXIF fields
        if (!exifData || !exifData.exif?.DateTimeOriginal) {
          console.warn(`Skipping ${file}: Missing EXIF data`)
          continue
        }

        // Establish basename for each original
        const dateOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
        const dateShot: string = new Date(exifData.exif.DateTimeOriginal)
          .toLocaleDateString('es-es', dateOptions)
          .split('/')
          .reverse()
          .join('-')
        const basename: string = `${dateShot}-${path.basename(file, path.extname(file))}`
        const mds = await fs.readdir(dataFolder)

        // Check if file is already processed
        const processed = mds.some(md => md.startsWith(basename))

        if (processed) {
          console.log(`Skipping ${basename}: Already processed`)
          continue
        }

        // Get color palette from image
        const palette = await getPaletteFromURL(targetImage)
        const hexPalette = palette.map((color: number[]) =>
          '#' + ((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16).slice(1)
        )

        // Convert GPS coordinates
        const gpsLatitude = convertGPSToDecimal(exifData.gps?.GPSLatitude)
        const gpsLongitude = convertGPSToDecimal(exifData.gps?.GPSLongitude)

        // Get actual image dimensions after rotation is applied
        const imageMetadata = await sharp(targetImage).rotate().metadata()
        const actualWidth = imageMetadata.width || 0
        const actualHeight = imageMetadata.height || 0
        const isPortrait = actualHeight > actualWidth

        // Save images - resize based on orientation
        // Note: rotate() applies EXIF orientation automatically
        let resizedImagePath: string
        if (isPortrait) {
          // Portrait: resize by height
          resizedImagePath = `${thumbFolder}${basename}.jpg`
          await sharp(targetImage)
            .rotate()
            .resize({ height: WEB_IMAGE_WIDTH, withoutEnlargement: true })
            .jpeg({ mozjpeg: true })
            .toFile(resizedImagePath)
        } else {
          // Landscape: resize by width
          resizedImagePath = `${thumbFolder}${basename}.jpg`
          await sharp(targetImage)
            .rotate()
            .resize({ width: WEB_IMAGE_WIDTH, withoutEnlargement: true })
            .jpeg({ mozjpeg: true })
            .toFile(resizedImagePath)
        }

        await sharp(targetImage)
          .rotate()
          .resize({ height: GALLERY_IMAGE_HEIGHT, withoutEnlargement: true })
          .jpeg({ mozjpeg: true })
          .toFile(`${thumbFolder}gallery-${basename}.jpg`)

        // Get actual dimensions from the resized image
        const resizedMetadata = await sharp(resizedImagePath).metadata()
        const resizedWidth = resizedMetadata.width || 0
        const resizedHeight = resizedMetadata.height || 0

        // Compose object to save in md file
        const mdContent =
          `---\n` +
          `title: ''\n` +
          `date: '${dateShot}'\n` +
          `basename: '${basename}.jpg'\n` +
          `category: photo\n` +
          `camera: "${exifData.image?.Make || 'Unknown'} ${exifData.image?.Model || ''}"\n` +
          `iso: ${exifData.exif?.ISO || 0}\n` +
          `fnumber: ${exifData.exif?.FNumber || 0}\n` +
          `exposureBiasValue: ${Math.round((exifData.exif?.ExposureBiasValue || 0) * 10) / 10}\n` +
          `exposureTime: "1/${Math.round(1 / (exifData.exif?.ExposureTime || 1))}"\n` +
          `GPSLatitude: ${gpsLatitude?.toFixed(6) || 0}\n` +
          `GPSLongitude: ${gpsLongitude?.toFixed(6) || 0}\n` +
          `width: ${resizedWidth}\n` +
          `height: ${resizedHeight}\n` +
          `colorPalette: ['${hexPalette.join("', '")}']\n` +
          `---`

        // Save md file
        await fs.writeFile(`${dataFolder}${basename}.md`, mdContent)
        console.log(`${basename} saved!`)

      } catch (error) {
        console.error(`Error processing ${file}:`, error)
        continue
      }
    }

    console.log('Photo processing complete!')

  } catch (error) {
    console.error('Error reading image folder:', error)
    process.exit(1)
  }
}

processPhotos()
