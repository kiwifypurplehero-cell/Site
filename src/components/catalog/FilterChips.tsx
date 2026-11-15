'use client'

import React from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFilters } from '@/hooks/use-filters'
import { formatPrice } from '@/lib/utils'

const modelLabels: Record<string, string> = {
  '911': '911',
  'taycan': 'Taycan',
  'cayenne': 'Cayenne',
  'macan': 'Macan',
  'panamera': 'Panamera',
  '718': '718',
}

const availabilityLabels: Record<string, string> = {
  'in-stock': 'In Stock',
  'pre-order': 'Pre-Order',
}

export function FilterChips() {
  const { filters, updateFilters, hasActiveFilters, clearFilters } = useFilters()

  const chips = React.useMemo(() => {
    const items: Array<{ label: string; onRemove: () => void }> = []

    if (filters.model) {
      items.push({
        label: `Model: ${modelLabels[filters.model] || filters.model}`,
        onRemove: () => updateFilters({ model: undefined }),
      })
    }

    if (filters.year) {
      items.push({
        label: `Year: ${filters.year}`,
        onRemove: () => updateFilters({ year: undefined }),
      })
    }

    if (filters.minPrice || filters.maxPrice) {
      const min = filters.minPrice || 0
      const max = filters.maxPrice || 300000
      items.push({
        label: `Price: ${formatPrice(min)} - ${formatPrice(max)}`,
        onRemove: () => updateFilters({ minPrice: undefined, maxPrice: undefined }),
      })
    }

    if (filters.availability) {
      items.push({
        label: `Availability: ${availabilityLabels[filters.availability] || filters.availability}`,
        onRemove: () => updateFilters({ availability: undefined }),
      })
    }

    return items
  }, [filters, updateFilters])

  if (!hasActiveFilters) return null

  return (
    <div className="flex flex-wrap gap-2 mb-6" role="list" aria-label="Active filters">
      {chips.map((chip, index) => (
        <Button
          key={index}
          variant="secondary"
          size="sm"
          className="gap-1.5 h-8 px-3"
          onClick={chip.onRemove}
          aria-label={`Remove filter: ${chip.label}`}
        >
          {chip.label}
          <X className="h-3 w-3" aria-hidden="true" />
        </Button>
      ))}
      {chips.length > 1 && (
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-3 text-porsche-black/60 hover:text-porsche-red"
          onClick={clearFilters}
        >
          Clear all
        </Button>
      )}
    </div>
  )
}