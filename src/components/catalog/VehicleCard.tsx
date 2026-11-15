import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { formatPrice } from '@/lib/utils'
import type { Vehicle } from '@/types/vehicle'
import { ArrowRight } from 'lucide-react'

interface VehicleCardProps {
  vehicle: Vehicle
}

export function VehicleCard({ vehicle }: VehicleCardProps) {
  const availabilityLabels = {
    'in-stock': 'In Stock',
    'pre-order': 'Pre-Order',
    'sold': 'Sold',
  }

  return (
    <article>
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
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-500 group-hover:scale-105"
              quality={85}
            />
            <div className="absolute top-3 left-3">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/95 backdrop-blur-sm text-porsche-black">
                {availabilityLabels[vehicle.availability]}
              </span>
            </div>
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
            <ul className="space-y-2 text-sm text-porsche-black/70" role="list" aria-label="Key features">
              {vehicle.features.slice(0, 3).map((feature, index) => (
                <li key={index} className="flex items-center gap-2">
                  <svg className="h-4 w-4 text-porsche-red flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  {feature}
                </li>
              ))}
            </ul>
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
  )
}