'use client'

import React from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { X, ChevronLeft, ChevronRight, Maximize } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent } from '@/components/ui/dialog'

interface VehicleGalleryProps {
  images: string[]
}

export function VehicleGallery({ images }: VehicleGalleryProps) {
  const [currentIndex, setCurrentIndex] = React.useState(0)
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  const next = () => setCurrentIndex((prev) => (prev + 1) % images.length)
  const prev = () => setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isFullscreen) return
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') prev()
      else if (e.key === 'Escape') setIsFullscreen(false)
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isFullscreen])

  const renderImage = (src: string, alt: string, priority = false, sizes = '100vw') => (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className="object-cover"
      quality={90}
    />
  )

  return (
    <div className="relative">
      <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-porsche-chalk">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.3 }}
          className="absolute inset-0"
          role="img"
          aria-label={`Main image ${currentIndex + 1} of ${images.length}`}
        >
          {renderImage(images[currentIndex], `Porsche ${images[currentIndex]}`, true)}
        </motion.div>

        <AnimatePresence>
          {isFullscreen && (
            <Dialog open={isFullscreen} onOpenChange={setIsFullscreen}>
              <DialogContent className="max-w-[90vw] max-h-[90vh] p-0">
                <button
                  onClick={() => setIsFullscreen(false)}
                  className="absolute top-4 right-4 z-10 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                  aria-label="Close fullscreen"
                >
                  <X className="h-6 w-6" />
                </button>
                <div className="relative aspect-[16/9]">
                  <motion.img
                    key={currentIndex}
                    src={images[currentIndex]}
                    alt={`Porsche fullscreen ${currentIndex + 1}`}
                    className="w-full h-full object-contain"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                  />
                </div>
                {images.length > 1 && (
                  <>
                    <button
                      onClick={prev}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      aria-label="Previous image"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      onClick={next}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
                      aria-label="Next image"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </DialogContent>
            </Dialog>
          )}
        </AnimatePresence>

        {images.length > 1 && !isFullscreen && (
          <>
            <button
              onClick={prev}
              className="absolute left-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              onClick={next}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors opacity-0 group-hover:opacity-100"
              aria-label="Next image"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          </>
        )}

        <button
          onClick={() => setIsFullscreen(true)}
          className="absolute top-3 right-3 p-2 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          aria-label="Open fullscreen gallery"
        >
          <Maximize className="h-5 w-5" />
        </button>
      </div>

      {images.length > 1 && (
        <div className="flex gap-3 mt-4 overflow-x-auto pb-2" role="tablist" aria-label="Image thumbnails">
          {images.map((image, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              role="tab"
              aria-selected={index === currentIndex}
              aria-label={`View image ${index + 1}`}
              className={`
                flex-shrink-0 w-24 h-16 rounded-lg overflow-hidden border-2 transition-all
                ${index === currentIndex
                  ? 'border-porsche-red ring-2 ring-porsche-red ring-offset-2'
                  : 'border-transparent hover:border-porsche-chalk'
                }
              `}
            >
              <Image
                src={image}
                alt={`Thumbnail ${index + 1}`}
                fill
                className="object-cover"
                sizes="96px"
                quality={75}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  )
}