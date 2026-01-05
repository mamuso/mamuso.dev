'use client'

import { useEffect } from 'react'

export default function PhotoGallery() {
  useEffect(() => {
    const galleries = document.querySelectorAll('.photo-gallery')
    const galleryHeight = 320

    const loadHandlers: Array<{ img: HTMLImageElement; handler: () => void }> = []

    galleries.forEach((gallery) => {
      const galleryImages = gallery.querySelectorAll('img')

      galleryImages.forEach((image) => {
        const img = image as HTMLImageElement

        const handleImageLoad = () => {
          const imageWidth = img.naturalWidth || img.width
          const imageHeight = img.naturalHeight || img.height

          if (!imageWidth || !imageHeight) return

          const wrapper = document.createElement('div')
          const flexGrowValue = (imageWidth * galleryHeight) / imageHeight
          wrapper.style.width = `${flexGrowValue}px`
          wrapper.style.flexGrow = String(flexGrowValue)

          const spacer = document.createElement('i')
          spacer.style.paddingBottom = `${(imageHeight / imageWidth) * 100}%`

          img.parentNode?.insertBefore(wrapper, img)
          wrapper.appendChild(spacer)
          wrapper.appendChild(img)
          img.classList.add('loaded')
        }

        // If image is already loaded (cached), process immediately
        if (img.complete && img.naturalWidth) {
          handleImageLoad()
        } else {
          // Otherwise wait for load event
          img.addEventListener('load', handleImageLoad)
          loadHandlers.push({ img, handler: handleImageLoad })
        }
      })
    })

    // Cleanup function to remove event listeners
    return () => {
      loadHandlers.forEach(({ img, handler }) => {
        img.removeEventListener('load', handler)
      })
    }
  }, [])

  return <></>
}
