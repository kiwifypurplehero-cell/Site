'use client'

import React from 'react'
import { X, Filter } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetTrigger, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { useFilters } from '@/hooks/use-filters'
import { formatPrice } from '@/lib/utils'

const models = [
  { value: '911', label: '911' },
  { value: 'taycan', label: 'Taycan' },
  { value: 'cayenne', label: 'Cayenne' },
  { value: 'macan', label: 'Macan' },
  { value: 'panamera', label: 'Panamera' },
  { value: '718', label: '718' },
]

const availabilities = [
  { value: 'in-stock', label: 'In Stock' },
  { value: 'pre-order', label: 'Pre-Order' },
]

export function FilterSidebar() {
  const { filters, updateFilters, clearFilters, hasActiveFilters, activeFilterCount } = useFilters()
  const [mobileOpen, setMobileOpen] = React.useState(false)

  const handleModelChange = (value: string) => {
    updateFilters({ model: value || undefined })
  }

  const handleYearChange = (value: string) => {
    updateFilters({ year: value ? parseInt(value) : undefined })
  }

  const handlePriceChange = (value: number[]) => {
    updateFilters({
      minPrice: value[0] > 0 ? value[0] : undefined,
      maxPrice: value[1] < 300000 ? value[1] : undefined,
    })
  }

  const handleAvailabilityChange = (value: string) => {
    updateFilters({ availability: (value as 'in-stock' | 'pre-order' | 'sold') || undefined })
  }

  return (
    <>
      <Button
        variant="outline"
        className="w-full sm:w-auto lg:hidden gap-2"
        onClick={() => setMobileOpen(true)}
      >
        <Filter className="h-4 w-4" aria-hidden="true" />
        Filters
        {hasActiveFilters && (
          <span className="bg-porsche-red text-white text-xs font-medium px-2 py-0.5 rounded-full">
            {activeFilterCount}
          </span>
        )}
      </Button>

      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetTrigger asChild>
          <Button variant="outline" className="w-full sm:w-auto lg:hidden gap-2">
            <Filter className="h-4 w-4" aria-hidden="true" />
            Filters
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="w-full sm:w-96 p-0">
          <SheetHeader className="px-6 py-4 border-b border-porsche-chalk">
            <div className="flex items-center justify-between">
              <SheetTitle className="text-lg">Filters</SheetTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" aria-hidden="true" />
                  Clear All
                </Button>
              )}
            </div>
          </SheetHeader>
          <div className="p-6 space-y-8 overflow-y-auto max-h-[calc(100vh-4rem)]">
            <FilterSection>
              <FilterLabel>Model</FilterLabel>
              <Select value={filters.model || ''} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Models</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <Separator />

            <FilterSection>
              <FilterLabel>Year</FilterLabel>
              <Select value={filters.year?.toString() || ''} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {[2024, 2023, 2022, 2021].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <Separator />

            <FilterSection>
              <FilterLabel>
                Price Range
                <span className="ml-2 text-sm font-normal text-porsche-black/50">
                  ({formatPrice(filters.minPrice || 0)} - {formatPrice(filters.maxPrice || 300000)})
                </span>
              </FilterLabel>
              <Slider
                max={300000}
                step={5000}
                value={[
                  filters.minPrice || 0,
                  filters.maxPrice || 300000,
                ]}
                onValueChange={handlePriceChange}
              />
            </FilterSection>

            <Separator />

            <FilterSection>
              <FilterLabel>Availability</FilterLabel>
              <Select value={filters.availability || ''} onValueChange={handleAvailabilityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {availabilities.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          </div>
        </SheetContent>
      </Sheet>

      <aside className="hidden lg:block w-72 flex-shrink-0">
        <Card className="sticky top-24">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Filters</CardTitle>
              {hasActiveFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters}>
                  <X className="h-4 w-4 mr-1" aria-hidden="true" />
                  Clear
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-8">
            <FilterSection>
              <FilterLabel>Model</FilterLabel>
              <Select value={filters.model || ''} onValueChange={handleModelChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Models" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Models</SelectItem>
                  {models.map((model) => (
                    <SelectItem key={model.value} value={model.value}>
                      {model.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <Separator />

            <FilterSection>
              <FilterLabel>Year</FilterLabel>
              <Select value={filters.year?.toString() || ''} onValueChange={handleYearChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All Years" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Years</SelectItem>
                  {[2024, 2023, 2022, 2021].map((year) => (
                    <SelectItem key={year} value={year.toString()}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>

            <Separator />

            <FilterSection>
              <FilterLabel>
                Price Range
                <span className="ml-2 text-sm font-normal text-porsche-black/50">
                  ({formatPrice(filters.minPrice || 0)} - {formatPrice(filters.maxPrice || 300000)})
                </span>
              </FilterLabel>
              <Slider
                max={300000}
                step={5000}
                value={[
                  filters.minPrice || 0,
                  filters.maxPrice || 300000,
                ]}
                onValueChange={handlePriceChange}
              />
            </FilterSection>

            <Separator />

            <FilterSection>
              <FilterLabel>Availability</FilterLabel>
              <Select value={filters.availability || ''} onValueChange={handleAvailabilityChange}>
                <SelectTrigger>
                  <SelectValue placeholder="All" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All</SelectItem>
                  {availabilities.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </FilterSection>
          </CardContent>
        </Card>
      </aside>
    </>
  )
}

function FilterSection({ children }: { children: React.ReactNode }) {
  return <div className="space-y-2">{children}</div>
}

function FilterLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-porsche-black">{children}</label>
}