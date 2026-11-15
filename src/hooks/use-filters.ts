'use client'

import { useState, useCallback, useMemo } from 'react'
import { useSearchParams, useRouter, usePathname } from 'next/navigation'
import type { FilterOptions } from '@/lib/data/vehicles'

const DEFAULT_FILTERS: FilterOptions = {
  model: undefined,
  year: undefined,
  minPrice: undefined,
  maxPrice: undefined,
  availability: undefined,
}

export function useFilters() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const pathname = usePathname()

  const [filters, setFilters] = useState<FilterOptions>(() => {
    return {
      model: searchParams.get('model') || undefined,
      year: searchParams.get('year') ? parseInt(searchParams.get('year')!) : undefined,
      minPrice: searchParams.get('minPrice') ? parseInt(searchParams.get('minPrice')!) : undefined,
      maxPrice: searchParams.get('maxPrice') ? parseInt(searchParams.get('maxPrice')!) : undefined,
      availability: searchParams.get('availability') as FilterOptions['availability'] || undefined,
    }
  })

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    const updated = { ...filters, ...newFilters }
    setFilters(updated)

    const params = new URLSearchParams()
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value))
      }
    })

    router.push(`${pathname}?${params.toString()}`, { scroll: false })
  }, [filters, router, pathname])

  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS)
    router.push(pathname, { scroll: false })
  }, [router, pathname])

  const hasActiveFilters = useMemo(() => {
    return Object.values(filters).some(v => v !== undefined)
  }, [filters])

  const activeFilterCount = useMemo(() => {
    return Object.values(filters).filter(v => v !== undefined).length
  }, [filters])

  return {
    filters,
    updateFilters,
    clearFilters,
    hasActiveFilters,
    activeFilterCount,
  }
}