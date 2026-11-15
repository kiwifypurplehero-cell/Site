import { vehicles, getVehicleBySlug, filterVehicles } from './vehicles'

describe('Vehicle data', () => {
  it('has at least 12 vehicles across 6 model lines', () => {
    expect(vehicles.length).toBeGreaterThanOrEqual(12)
    const models = new Set(vehicles.map(v => v.model))
    expect(models.size).toBeGreaterThanOrEqual(6)
  })
  it('each vehicle has required fields', () => {
    vehicles.forEach(v => {
      expect(v.id).toBeTruthy()
      expect(v.slug).toMatch(/^[a-z0-9-]+$/)
      expect(v.price).toBeGreaterThan(0)
      expect(v.images.length).toBeGreaterThan(0)
    })
  })
  it('getVehicleBySlug returns correct vehicle', () => {
    const v = getVehicleBySlug(vehicles[0].slug)
    expect(v).toEqual(vehicles[0])
  })
  it('getVehicleBySlug returns undefined for unknown slug', () => {
    expect(getVehicleBySlug('non-existent')).toBeUndefined()
  })
  it('filterVehicles filters by model', () => {
    const result = filterVehicles({ model: '911' })
    expect(result.every(v => v.model === '911')).toBe(true)
  })
  it('filterVehicles filters by price range', () => {
    const result = filterVehicles({ minPrice: 100000, maxPrice: 200000 })
    expect(result.every(v => v.price >= 100000 && v.price <= 200000)).toBe(true)
  })
})