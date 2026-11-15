import { VehicleCard } from './VehicleCard'
import type { Vehicle } from '@/types/vehicle'

interface VehicleGridProps {
  vehicles: Vehicle[]
}

export function VehicleGrid({ vehicles }: VehicleGridProps) {
  if (vehicles.length === 0) {
    return (
      <div className="text-center py-20" role="status">
        <svg className="mx-auto h-16 w-16 text-porsche-chalk mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <h3 className="text-xl font-semibold text-porsche-black mb-2">No vehicles found</h3>
        <p className="text-porsche-black/60">Try adjusting your filters to see more results.</p>
      </div>
    )
  }

  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
      role="list"
      aria-label="Vehicle listings"
    >
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  )
}