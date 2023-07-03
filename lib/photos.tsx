// Process the photos inside the content/originals folder
import * as fs from 'fs-extra'
import path from 'path'
import { getPaletteFromURL } from 'color-thief-node'
const exif = require('fast-exif')
import sharp from 'sharp'

// -----------------------------------------------------------
// Folders
const imageFolder: string = 'content/assets/originals/'
const thumbFolder: string = 'content/assets/feed/'
const dataFolder: string = 'content/posts/'

// -----------------------------------------------------------

const processPhotos = async () => {
  fs.readdir(imageFolder, (err, files) => {
    files.forEach(async (file) => {
      const targetImage = `${imageFolder}${file}`
      exif
        .read(targetImage)
        .then(async (exif: any) => {
          // Establish basename for each original
          const dateoptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' }
          const dateshot: string = new Date(exif.exif.DateTimeOriginal).toLocaleDateString('es-es', dateoptions).split('/').reverse().join('-')
          const basename: string = `${dateshot}-${path.basename(file, path.extname(file))}`
          const mds = fs.readdirSync(dataFolder)

          // Check if file is already processed
          let processed = false
          for (let md of mds) {
            if (md.startsWith(basename)) {
              processed = true
            }
          }
          if (!processed) {
            // Get Color palette from image
            const palette = await getPaletteFromURL(targetImage)
            const hexPalette = palette.map((color: number[]) => '#' + ((1 << 24) + (color[0] << 16) + (color[1] << 8) + color[2]).toString(16).slice(1))

            // Compose objedt to save in md file
            const mdContent =
              `---\n` +
              `title: ''\n` +
              `date: '${dateshot}'\n` +
              `basename: '${basename}'\n` +
              `category: photo\n` +
              `camera: "${exif.image.Make} ${exif.image.Model}"\n` +
              `iso: ${exif.exif.ISO}\n` +
              `fnumber: ${exif.exif.FNumber}\n` +
              `exposureBiasValue: ${Math.round(exif.exif.ExposureBiasValue * 10) / 10}\n` +
              `exposureTime: "1/${Math.round(1 / exif.exif.ExposureTime)}"\n` +
              `GPSLatitude: ${(exif.gps?.GPSLatitude[0] + exif.gps?.GPSLatitude[1] / 60 + exif.gps?.GPSLatitude[2] / 3600).toFixed(6)}\n` +
              `GPSLongitude: ${(exif.gps?.GPSLongitude[0] + exif.gps?.GPSLongitude[1] / 60 + exif.gps?.GPSLongitude[2] / 3600).toFixed(6)}\n` +
              `width: ${exif.exif.PixelXDimension}\n` +
              `height: ${exif.exif.PixelYDimension}\n` +
              `colorPalette: ['${hexPalette.join("', '")}']\n` +
              `---`

            // Save image
            const sharpImage = sharp(targetImage)
            sharpImage.resize(4096, 4096, { fit: 'inside' }).toFile(`${thumbFolder}${basename}.jpg`)

            // Save md file
            fs.writeFile(`${dataFolder}${basename}.md`, mdContent, (err) => {
              if (err) throw err
              console.log(`${basename} saved!`)
            })
          }
        })
        .catch(console.error)
    })
  })
}

processPhotos()
