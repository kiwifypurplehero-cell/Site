import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden" aria-labelledby="hero-heading">
      <div className="absolute inset-0 z-0">
        <Image
          src="https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=1920&q=80"
          alt="Porsche 911 driving on coastal road"
          fill
          priority
          sizes="100vw"
          className="object-cover"
          quality={90}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-porsche-black/80 via-porsche-black/40 to-transparent" />
      </div>

      <div className="container-porsche relative z-10 pt-16 pb-24">
        <div className="max-w-3xl">
          <h1 id="hero-heading" className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight text-white text-balance mb-6">
            Engineered for{' '}
            <span className="text-porsche-red">Icons</span>
          </h1>
          <p className="text-xl sm:text-2xl text-white/90 mb-10 max-w-2xl leading-relaxed">
            Experience the legacy of performance. From the iconic 911 to the electric Taycan, every Porsche is built to stir the soul.
          </p>
          <div className="flex flex-col sm:flex-row gap-4">
            <Button size="lg" asChild className="gap-2">
              <Link href="/models">
                Explore Models
                <ArrowRight className="h-5 w-5" aria-hidden="true" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10">
              <Link href="/configurator">Build Your Porsche</Link>
            </Button>
          </div>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 animate-bounce" aria-hidden="true">
        <svg className="h-8 w-8 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
        </svg>
      </div>
    </section>
  )
}