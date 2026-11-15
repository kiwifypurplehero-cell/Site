import React from 'react'
import { render, screen } from '@testing-library/react'
import { VehicleCard } from './VehicleCard'
import { vehicles } from '@/lib/data/vehicles'

describe('VehicleCard', () => {
  it('renders model, variant, price, and image', () => {
    render(<VehicleCard vehicle={vehicles[0]} />)
    expect(screen.getByText(vehicles[0].model)).toBeInTheDocument()
    expect(screen.getByText(vehicles[0].variant)).toBeInTheDocument()
    expect(screen.getByText(new RegExp(vehicles[0].price.toLocaleString()))).toBeInTheDocument()
    expect(screen.getByRole('img')).toBeInTheDocument()
  })
  it('links to model detail page', () => {
    render(<VehicleCard vehicle={vehicles[0]} />)
    expect(screen.getByRole('link')).toHaveAttribute('href', `/models/${vehicles[0].slug}`)
  })
  it('shows availability badge', () => {
    render(<VehicleCard vehicle={vehicles[0]} />)
    expect(screen.getByText(/in.stock/i)).toBeInTheDocument()
  })
})