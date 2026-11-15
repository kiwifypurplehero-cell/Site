import type { Vehicle, VehicleSpecs, Dimensions } from '@/types/vehicle'

const baseDimensions: Dimensions = {
  length: '182.9 in',
  width: '72.9 in',
  height: '51.2 in',
  wheelbase: '104.3 in',
  weight: '3,241 lbs',
}

const createVehicle = (
  id: string,
  model: string,
  variant: string,
  year: number,
  price: number,
  specs: Omit<VehicleSpecs, 'dimensions'> & { dimensions?: Partial<Dimensions> },
  features: string[],
  description: string
): Vehicle => {
  const slug = `${model.toLowerCase()}-${variant.toLowerCase().replace(/\s+/g, '-').replace(/\./g, '')}`
  return {
    id,
    slug,
    model,
    variant,
    year,
    price,
    currency: 'USD',
    images: [
      `https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=1200&q=80`,
      `https://images.unsplash.com/photo-1552519507-da3b142c6e3d?w=1200&q=80`,
      `https://images.unsplash.com/photo-1503736334956-4c8f8e92946d?w=1200&q=80`,
    ],
    specs: {
      ...specs,
      dimensions: { ...baseDimensions, ...specs.dimensions },
    },
    features,
    availability: 'in-stock' as const,
    description,
    seo: {
      title: `${year} Porsche ${model} ${variant}`,
      description: `Explore the ${year} Porsche ${model} ${variant}. ${description}`,
      ogImage: `https://images.unsplash.com/photo-1544829099-b9a0c5303bea?w=1200&q=80`,
    },
  }
}

export const vehicles: Vehicle[] = [
  // 911 Models
  createVehicle(
    '911-carrera-s',
    '911',
    'Carrera S',
    2024,
    135000,
    {
      engine: '3.0L Twin-Turbo Flat-6',
      power: '443 hp',
      torque: '390 lb-ft',
      transmission: '8-speed PDK',
      drivetrain: 'RWD',
      acceleration: '0-60 in 3.5s',
      topSpeed: '191 mph',
      fuelEconomy: '18/24 MPG',
    },
    ['Sport Chrono Package', 'PASM Sport Suspension', 'Sport Exhaust', '20/21-inch Carrera S Wheels'],
    'The 911 Carrera S combines everyday usability with track-ready performance. Its twin-turbo flat-six delivers instant response, while the PDK transmission shifts in milliseconds.'
  ),
  createVehicle(
    '911-turbo-s',
    '911',
    'Turbo S',
    2024,
    230000,
    {
      engine: '3.8L Twin-Turbo Flat-6',
      power: '640 hp',
      torque: '590 lb-ft',
      transmission: '8-speed PDK',
      drivetrain: 'AWD',
      acceleration: '0-60 in 2.6s',
      topSpeed: '205 mph',
      fuelEconomy: '15/20 MPG',
      dimensions: { weight: '3,649 lbs' },
    },
    ['Porsche Active Suspension Management', 'Porsche Torque Vectoring Plus', 'Carbon Ceramic Brakes', '20/21-inch Turbo S Wheels', 'Sport Chrono Package'],
    'The flagship 911 Turbo S redefines supercar performance with all-weather capability. 640 horsepower, all-wheel drive, and rear-axle steering make it unbeatable on any road.'
  ),
  createVehicle(
    '911-gt3',
    '911',
    'GT3',
    2024,
    180000,
    {
      engine: '4.0L Naturally Aspirated Flat-6',
      power: '502 hp',
      torque: '346 lb-ft',
      transmission: '7-speed PDK',
      drivetrain: 'RWD',
      acceleration: '0-60 in 3.2s',
      topSpeed: '197 mph',
      fuelEconomy: '14/20 MPG',
      dimensions: { weight: '3,126 lbs' },
    },
    ['Motorsport-derived engine', 'Rear-axle steering', 'Carbon fiber reinforced plastic components', 'Michelin Pilot Sport Cup 2 R tires'],
    'Born from motorsport, the 911 GT3 is the purest expression of the 911 lineage. A high-revving naturally aspirated engine and track-focused aerodynamics deliver an unfiltered driving experience.'
  ),

  // Taycan Models
  createVehicle(
    'taycan-turbo',
    'Taycan',
    'Turbo',
    2024,
    190000,
    {
      engine: 'Dual Electric Motors',
      power: '670 hp (Overboost)',
      torque: '626 lb-ft',
      transmission: '2-speed transmission (rear)',
      drivetrain: 'AWD',
      acceleration: '0-60 in 3.0s',
      topSpeed: '161 mph',
      fuelEconomy: '69 MPGe',
      dimensions: { weight: '5,132 lbs' },
    },
    ['800-volt architecture', 'Performance Battery Plus', 'Porsche Active Suspension Management', '21-inch Mission E Design Wheels', 'Panoramic Glass Roof'],
    'The Taycan Turbo brings Porsche performance to the electric era. 800-volt charging, dual motors, and a two-speed rear transmission deliver sports car dynamics with zero emissions.'
  ),
  createVehicle(
    'taycan-4s',
    'Taycan',
    '4S',
    2024,
    115000,
    {
      engine: 'Dual Electric Motors',
      power: '562 hp (Overboost)',
      torque: '479 lb-ft',
      transmission: '2-speed transmission (rear)',
      drivetrain: 'AWD',
      acceleration: '0-60 in 3.8s',
      topSpeed: '155 mph',
      fuelEconomy: '71 MPGe',
      dimensions: { weight: '4,773 lbs' },
    },
    ['Performance Battery', 'Porsche Traction Management', '20-inch Taycan Aero Wheels', 'Adaptive Air Suspension'],
    'The Taycan 4S offers the perfect balance of performance and range. With up to 562 hp in overboost and 800-volt fast charging, it makes electric performance accessible.'
  ),
  createVehicle(
    'taycan-gts',
    'Taycan',
    'GTS',
    2024,
    150000,
    {
      engine: 'Dual Electric Motors',
      power: '590 hp (Overboost)',
      torque: '626 lb-ft',
      transmission: '2-speed transmission (rear)',
      drivetrain: 'AWD',
      acceleration: '0-60 in 3.5s',
      topSpeed: '155 mph',
      fuelEconomy: '70 MPGe',
      dimensions: { weight: '4,960 lbs' },
    },
    ['Sport Chrono Package', 'Porsche Torque Vectoring Plus', 'Adaptive Air Suspension with PASM', '20/21-inch Turbo S Wheels', 'Race-Tex Interior'],
    'The Taycan GTS sits at the sweet spot of the lineup. More power than the 4S, more agility than the Turbo, with distinctive GTS styling inside and out.'
  ),

  // Cayenne Models
  createVehicle(
    'cayenne-s',
    'Cayenne',
    'S',
    2024,
    105000,
    {
      engine: '4.0L Twin-Turbo V8',
      power: '468 hp',
      torque: '442 lb-ft',
      transmission: '8-speed Tiptronic S',
      drivetrain: 'AWD',
      acceleration: '0-60 in 4.6s',
      topSpeed: '164 mph',
      fuelEconomy: '16/22 MPG',
      dimensions: { weight: '4,773 lbs', length: '193.7 in', height: '66.8 in' },
    },
    ['Air Suspension', 'Porsche Active Suspension Management', '20-inch Cayenne Design Wheels', 'Panoramic Roof', 'Bose Surround Sound'],
    'The Cayenne S proves an SUV can be a true Porsche. A twin-turbo V8, air suspension, and torque vectoring make it as capable on a mountain pass as it is practical for daily life.'
  ),
  createVehicle(
    'cayenne-turbo-gt',
    'Cayenne',
    'Turbo GT',
    2024,
    200000,
    {
      engine: '4.0L Twin-Turbo V8',
      power: '631 hp',
      torque: '626 lb-ft',
      transmission: '8-speed Tiptronic S',
      drivetrain: 'AWD',
      acceleration: '0-60 in 3.1s',
      topSpeed: '186 mph',
      fuelEconomy: '14/20 MPG',
      dimensions: { weight: '4,927 lbs', length: '193.7 in', height: '65.7 in' },
    },
    ['Carbon Ceramic Brakes', 'Porsche Dynamic Chassis Control', '22-inch GT Design Wheels', 'Carbon Fiber Roof', 'Alcantara Interior', 'Rear-Axle Steering'],
    'The Cayenne Turbo GT is the fastest SUV on the Nürburgring. 631 hp, carbon ceramic brakes, and active aerodynamics rewrite the rules of what an SUV can achieve.'
  ),
  createVehicle(
    'cayenne-e-hybrid',
    'Cayenne',
    'E-Hybrid',
    2024,
    95000,
    {
      engine: '3.0L Turbo V6 + Electric Motor',
      power: '463 hp',
      torque: '479 lb-ft',
      transmission: '8-speed Tiptronic S',
      drivetrain: 'AWD',
      acceleration: '0-60 in 4.7s',
      topSpeed: '158 mph',
      fuelEconomy: '48 MPGe',
      dimensions: { weight: '5,258 lbs', length: '193.7 in', height: '66.8 in' },
    },
    ['25.9 kWh Battery', 'Electric Range up to 27 miles', 'Porsche Active Suspension Management', '20-inch Cayenne Design Wheels', 'Hybrid-specific displays'],
    'The Cayenne E-Hybrid combines V6 power with electric efficiency. Drive emission-free in the city, then unleash 463 combined horsepower on the open road.'
  ),

  // Macan Models
  createVehicle(
    'macan-s',
    'Macan',
    'S',
    2024,
    70000,
    {
      engine: '2.9L Twin-Turbo V6',
      power: '375 hp',
      torque: '383 lb-ft',
      transmission: '7-speed PDK',
      drivetrain: 'AWD',
      acceleration: '0-60 in 4.6s',
      topSpeed: '158 mph',
      fuelEconomy: '17/23 MPG',
      dimensions: { weight: '4,277 lbs', length: '184.8 in', height: '63.9 in' },
    },
    ['Porsche Traction Management', '19-inch Macan S Wheels', 'LED Headlights', 'Power Steering Plus', 'Sport Chrono Package'],
    'The Macan S brings sports car DNA to the compact SUV segment. Sharp handling, a responsive V6, and Porsche Torque Vectoring make every drive engaging.'
  ),
  createVehicle(
    'macan-gts',
    'Macan',
    'GTS',
    2024,
    85000,
    {
      engine: '2.9L Twin-Turbo V6',
      power: '434 hp',
      torque: '405 lb-ft',
      transmission: '7-speed PDK',
      drivetrain: 'AWD',
      acceleration: '0-60 in 4.1s',
      topSpeed: '167 mph',
      fuelEconomy: '16/22 MPG',
      dimensions: { weight: '4,376 lbs', length: '184.8 in', height: '63.3 in' },
    },
    ['Sport Exhaust', '20-inch RS Spyder Design Wheels', 'Adaptive Air Suspension', 'Alcantara Interior', 'GTS Exterior Package'],
    'The Macan GTS adds 59 hp and GTS-specific tuning. Lowered air suspension, sport exhaust, and distinctive styling make it the driver\'s choice in the compact SUV lineup.'
  ),
  createVehicle(
    'macan-turbo',
    'Macan',
    'Turbo',
    2024,
    95000,
    {
      engine: '2.9L Twin-Turbo V6',
      power: '434 hp',
      torque: '405 lb-ft',
      transmission: '7-speed PDK',
      drivetrain: 'AWD',
      acceleration: '0-60 in 4.1s',
      topSpeed: '167 mph',
      fuelEconomy: '16/22 MPG',
      dimensions: { weight: '4,420 lbs', length: '184.8 in', height: '63.3 in' },
    },
    ['Carbon Ceramic Brakes', '21-inch Turbo Wheels', 'Adaptive Air Suspension', 'Full Leather Interior', 'Panoramic Roof', 'BOSE Surround Sound'],
    'The Macan Turbo is the pinnacle of the compact SUV range. Maximum performance, maximum luxury, and the unmistakable presence of a Turbo badge.'
  ),

  // Panamera Models
  createVehicle(
    'panamera-4s',
    'Panamera',
    '4S',
    2024,
    125000,
    {
      engine: '2.9L Twin-Turbo V6',
      power: '443 hp',
      torque: '405 lb-ft',
      transmission: '8-speed PDK',
      drivetrain: 'AWD',
      acceleration: '0-60 in 3.9s',
      topSpeed: '179 mph',
      fuelEconomy: '17/24 MPG',
      dimensions: { weight: '4,453 lbs', length: '198.8 in', height: '55.9 in' },
    },
    ['Adaptive Air Suspension', 'Porsche Active Suspension Management', '20-inch Panamera Design Wheels', 'Panoramic Roof', '4-Zone Climate Control'],
    'The Panamera 4S blends sports car performance with executive sedan comfort. All-wheel drive, a twin-turbo V6, and a luxurious interior make every journey first-class.'
  ),
  createVehicle(
    'panamera-turbo-s',
    'Panamera',
    'Turbo S',
    2024,
    210000,
    {
      engine: '4.0L Twin-Turbo V8',
      power: '621 hp',
      torque: '604 lb-ft',
      transmission: '8-speed PDK',
      drivetrain: 'AWD',
      acceleration: '0-60 in 2.9s',
      topSpeed: '196 mph',
      fuelEconomy: '15/21 MPG',
      dimensions: { weight: '4,850 lbs', length: '198.8 in', height: '55.9 in' },
    },
    ['Porsche Dynamic Chassis Control', 'Carbon Ceramic Brakes', '21-inch Turbo S Wheels', 'Rear-Axle Steering', 'Full Leather Interior', 'Burmester 3D Surround Sound'],
    'The Panamera Turbo S is a supercar in executive clothing. 621 hp, rear-axle steering, and active aerodynamics deliver performance that defies its size and weight.'
  ),
  createVehicle(
    'panamera-gts',
    'Panamera',
    'GTS',
    2024,
    155000,
    {
      engine: '4.0L Twin-Turbo V8',
      power: '473 hp',
      torque: '457 lb-ft',
      transmission: '8-speed PDK',
      drivetrain: 'AWD',
      acceleration: '0-60 in 3.7s',
      topSpeed: '181 mph',
      fuelEconomy: '16/22 MPG',
      dimensions: { weight: '4,564 lbs', length: '198.8 in', height: '55.3 in' },
    },
    ['Sport Exhaust', '20/21-inch GTS Wheels', 'Adaptive Air Suspension', 'Alcantara Roof Lining', 'GTS Interior Package', 'Porsche Torque Vectoring Plus'],
    'The Panamera GTS brings V8 sound and GTS agility to the luxury sedan. Sharper suspension tuning, distinctive styling, and that unmistakable V8 soundtrack.'
  ),

  // 718 Models
  createVehicle(
    '718-cayman-gts',
    '718',
    'Cayman GTS 4.0',
    2024,
    105000,
    {
      engine: '4.0L Naturally Aspirated Flat-6',
      power: '394 hp',
      torque: '309 lb-ft',
      transmission: '6-speed Manual',
      drivetrain: 'RWD',
      acceleration: '0-60 in 4.3s',
      topSpeed: '182 mph',
      fuelEconomy: '18/25 MPG',
      dimensions: { weight: '3,055 lbs', length: '172.4 in', width: '70.9 in', height: '51.1 in', wheelbase: '96.5 in' },
    },
    ['Porsche Torque Vectoring', 'Sport Suspension (20mm lower)', '20-inch GTS Wheels', 'Sport Chrono Package', 'Alcantara Interior'],
    'The 718 Cayman GTS 4.0 returns to a naturally aspirated flat-six. Mid-engine balance, a six-speed manual, and 394 hp make it the purist\'s choice.'
  ),
  createVehicle(
    '718-boxster-spyder',
    '718',
    'Boxster Spyder',
    2024,
    110000,
    {
      engine: '4.0L Naturally Aspirated Flat-6',
      power: '414 hp',
      torque: '317 lb-ft',
      transmission: '6-speed Manual',
      drivetrain: 'RWD',
      acceleration: '0-60 in 4.2s',
      topSpeed: '187 mph',
      fuelEconomy: '18/25 MPG',
      dimensions: { weight: '3,031 lbs', length: '172.4 in', width: '70.9 in', height: '50.6 in', wheelbase: '96.5 in' },
    },
    ['Lightweight Convertible Top', 'Porsche Torque Vectoring', 'Sport Suspension (20mm lower)', '20-inch Spyder Wheels', 'Carbon Fiber Bucket Seats', 'Sport Chrono Package'],
    'The Boxster Spyder is the ultimate open-top 718. A manual roof, 414 hp naturally aspirated engine, and lightweight construction deliver an unfiltered driving experience.'
  ),
]

export function getVehicleBySlug(slug: string): Vehicle | undefined {
  return vehicles.find(v => v.slug === slug)
}

export function getVehiclesByModel(model: string): Vehicle[] {
  return vehicles.filter(v => v.model.toLowerCase() === model.toLowerCase())
}

export interface FilterOptions {
  model?: string
  year?: number
  minPrice?: number
  maxPrice?: number
  bodyStyle?: string
  availability?: Vehicle['availability']
}

export function filterVehicles(options: FilterOptions): Vehicle[] {
  return vehicles.filter(v => {
    if (options.model && v.model.toLowerCase() !== options.model.toLowerCase()) return false
    if (options.year && v.year !== options.year) return false
    if (options.minPrice && v.price < options.minPrice) return false
    if (options.maxPrice && v.price > options.maxPrice) return false
    if (options.availability && v.availability !== options.availability) return false
    return true
  })
}

export function sortVehicles(vehicles: Vehicle[], sortBy: 'price-asc' | 'price-desc' | 'year' | 'power'): Vehicle[] {
  return [...vehicles].sort((a, b) => {
    switch (sortBy) {
      case 'price-asc':
        return a.price - b.price
      case 'price-desc':
        return b.price - a.price
      case 'year':
        return b.year - a.year
      case 'power':
        const powerA = parseInt(a.specs.power)
        const powerB = parseInt(b.specs.power)
        return powerB - powerA
      default:
        return 0
    }
  })
}