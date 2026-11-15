import { Metadata } from 'next'
import { FilterSidebar } from '@/components/catalog/FilterSidebar'
import { FilterChips } from '@/components/catalog/FilterChips'
import { VehicleGrid } from '@/components/catalog/VehicleGrid'
import { filterVehicles, vehicles } from '@/lib/data/vehicles'
import type { FilterOptions } from '@/lib/data/vehicles'

export const metadata: Metadata = {
  title: 'All Models',
  description: 'Explore the complete Porsche model lineup. Filter by model, year, price, and availability to find your perfect Porsche.',
}

interface ModelsPageProps {
  searchParams: Promise<{
    model?: string
    year?: string
    minPrice?: string
    maxPrice?: string
    availability?: string
  }>
}

export default async function ModelsPage({ searchParams }: ModelsPageProps) {
  const params = await searchParams

  const filterOptions: FilterOptions = {
    model: params.model,
    year: params.year ? parseInt(params.year) : undefined,
    minPrice: params.minPrice ? parseInt(params.minPrice) : undefined,
    maxPrice: params.maxPrice ? parseInt(params.maxPrice) : undefined,
    availability: params.availability as FilterOptions['availability'],
  }

  const filteredVehicles = filterVehicles(filterOptions)

  return (
    <>
      <div className="mb-8 lg:mb-12">
        <h1 className="text-4xl sm:text-5xl font-bold tracking-tight text-porsche-black mb-4">
          All Models
        </h1>
        <p className="text-lg text-porsche-black/60 max-w-2xl">
          Explore our complete lineup of sports cars, SUVs, and electric vehicles. Use the filters to narrow down your search.
        </p>
      </div>

      <FilterChips />

      <div className="flex flex-col lg:flex-row gap-8">
        <FilterSidebar />
        <div className="flex-1 min-w-0">
          <VehicleGrid vehicles={filteredVehicles} />
          <div className="mt-8 text-center text-porsche-black/60">
            Showing {filteredVehicles.length} of {vehicles.length} vehicles
          </div>
        </div>
      </div>
    </>
  )
}