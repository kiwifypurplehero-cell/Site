import Link from 'next/link'
import Image from 'next/image'
import { vehicles } from '@/lib/data/vehicles'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import { ArrowRight } from 'lucide-react'

const featuredSlugs = ['911-turbo-s', 'taycan-turbo', 'cayenne-turbo-gt']

export function FeaturedModels() {
  const featuredVehicles = featuredSlugs
    .map(slug => vehicles.find(v => v.slug === slug))
    .filter((v): v is typeof vehicles[0] => v !== undefined)

  return (
    <section className="section-padding bg-white" aria-labelledby="featured-heading">
      <div className="container-porsche">
        <div className="text-center mb-16">
          <h2 id="featured-heading" className="text-4xl sm:text-5xl font-bold tracking-tight text-porsche-black mb-4">
            Featured Models
          </h2>
          <p className="text-lg text-porsche-black/60 max-w-2xl mx-auto">
            Hand-selected highlights from our lineup — each representing the pinnacle of its class.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {featuredVehicles.map((vehicle) => (
            <article key={vehicle.id} className="group">
              <Link
                href={`/models/${vehicle.slug}`}
                className="block h-full"
                aria-label={`View ${vehicle.model} ${vehicle.variant} details`}
              >
                <Card className="h-full overflow-hidden transition-all duration-300 hover:shadow-card-hover">
                  <div className="relative aspect-[16/10] overflow-hidden">
                    <Image
                      src={vehicle.images[0]}
                      alt={`${vehicle.model} ${vehicle.variant}`}
                      fill
                      sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      quality={85}
                    />
                  </div>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-porsche-red uppercase tracking-wider">
                        {vehicle.model}
                      </span>
                      <span className="text-sm text-porsche-black/60">{vehicle.year}</span>
                    </div>
                    <h3 className="text-xl font-bold text-porsche-black mb-1">{vehicle.variant}</h3>
                    <p className="text-2xl font-bold text-porsche-black mb-4">{formatPrice(vehicle.price)}</p>
                    <p className="text-porsche-black/60 text-sm line-clamp-2">{vehicle.description}</p>
                  </CardContent>
                  <CardFooter className="pt-0 pb-6 px-6">
                    <Button variant="ghost" size="sm" className="w-full gap-2 group-hover:gap-4 transition-all">
                      View Details
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden="true" />
                    </Button>
                  </CardFooter>
                </Card>
              </Link>
            </article>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" asChild>
            <Link href="/models">View All Models <ArrowRight className="h-5 w-5" aria-hidden="true" /></Link>
          </Button>
        </div>
      </div>
    </section>
  )
}