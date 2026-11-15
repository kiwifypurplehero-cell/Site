import Image from 'next/image'

export function BrandStory() {
  return (
    <section className="section-padding bg-porsche-chalk/30" aria-labelledby="story-heading">
      <div className="container-porsche">
        <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-center">
          <div className="relative aspect-[4/3] rounded-2xl overflow-hidden">
            <Image
              src="https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80"
              alt="Porsche factory craftsmanship"
              fill
              priority
              sizes="(max-width: 1024px) 100vw, 50vw"
              className="object-cover"
              quality={90}
            />
          </div>
          <div>
            <span className="text-sm font-medium text-porsche-red uppercase tracking-wider mb-4 block">
              Our Philosophy
            </span>
            <h2 id="story-heading" className="text-4xl sm:text-5xl font-bold tracking-tight text-porsche-black mb-6">
              Engineering Excellence,<br />Since 1931
            </h2>
            <div className="space-y-4 text-lg text-porsche-black/70">
              <p>
                For over 90 years, Porsche has built vehicles that transcend mere transportation. Each model carries the DNA of our racing heritage — precision engineering, uncompromising performance, and timeless design.
              </p>
              <p>
                From the air-cooled 911 that defined a genre to the Taycan that electrified it, we believe that innovation honors tradition. Every Porsche is developed in Weissach, tested at the Nürburgring, and built for the driver who demands more.
              </p>
              <p>
                This is not just manufacturing. This is the pursuit of the perfect drive.
              </p>
            </div>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href="/about" className="inline-flex items-center gap-2 text-porsche-red font-medium hover:underline">
                Discover Our History
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
              <a href="/museum" className="inline-flex items-center gap-2 text-porsche-black/70 font-medium hover:text-porsche-red transition-colors">
                Visit the Museum
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}