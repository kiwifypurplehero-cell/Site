export interface Dimensions {
  length: string
  width: string
  height: string
  wheelbase: string
  weight: string
}

export interface VehicleSpecs {
  engine: string
  power: string
  torque: string
  transmission: string
  drivetrain: string
  acceleration: string
  topSpeed: string
  fuelEconomy: string
  dimensions: Dimensions
}

export interface SEOData {
  title: string
  description: string
  ogImage: string
}

export interface Vehicle {
  id: string
  slug: string
  model: string
  variant: string
  year: number
  price: number
  currency: 'USD'
  images: string[]
  specs: VehicleSpecs
  features: string[]
  availability: 'in-stock' | 'pre-order' | 'sold'
  description: string
  seo: SEOData
}