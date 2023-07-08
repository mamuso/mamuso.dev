'use client'

import React, { useEffect } from 'react'
export default function PhotoGallery() {
  useEffect(() => {
    const gallery = document.querySelectorAll('.photo-gallery')
    const galleryHeight = 320

    gallery.forEach((gallery) => {
      const galleryImages = gallery.querySelectorAll('img')
      galleryImages.forEach((image) => {
        const src = image.src
        image.src = ''
        image.src = src
        image.addEventListener('load', (e) => {
          const imageWidth = image.width
          const imageHeight = image.height

          const wrapper = document.createElement('div')
          wrapper.style.cssText = `width:${(imageWidth * galleryHeight) / imageHeight}px;flex-grow: ${(imageWidth * galleryHeight) / imageHeight}`

          const spacer = document.createElement('i')
          spacer.style.cssText = `padding-bottom: ${(imageHeight / imageWidth) * 100}%`

          image?.parentNode?.insertBefore(wrapper, image)
          wrapper.appendChild(spacer)
          image.className = 'loaded'
          wrapper.appendChild(image)
        })
      })
    })
  }, [])
  return <></>
}
