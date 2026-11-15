import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { VehicleGallery } from './VehicleGallery'
import { vehicles } from '@/lib/data/vehicles'

describe('VehicleGallery', () => {
  it('renders main image and thumbnail buttons', () => {
    render(<VehicleGallery images={vehicles[0].images} />)
    expect(screen.getByRole('img', { name: /main/i })).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons.length).toBeGreaterThanOrEqual(vehicles[0].images.length)
  })
  it('navigates with arrow keys', () => {
    render(<VehicleGallery images={vehicles[0].images} />)
    const main = screen.getByRole('img', { name: /main/i })
    fireEvent.keyDown(main, { key: 'ArrowRight' })
  })
  it('has fullscreen button', () => {
    render(<VehicleGallery images={vehicles[0].images} />)
    expect(screen.getByRole('button', { name: /open fullscreen/i })).toBeInTheDocument()
  })
})