import React from 'react'
import { render, screen } from '@testing-library/react'
import { SpecsTable } from './SpecsTable'
import { vehicles } from '@/lib/data/vehicles'

describe('SpecsTable', () => {
  it('renders spec sections with correct data', () => {
    render(<SpecsTable specs={vehicles[0].specs} />)
    expect(screen.getByText(/performance/i)).toBeInTheDocument()
    expect(screen.getByText(/dimensions/i)).toBeInTheDocument()
    expect(screen.getByText(vehicles[0].specs.engine)).toBeInTheDocument()
    expect(screen.getByText(vehicles[0].specs.power)).toBeInTheDocument()
  })
  it('uses proper table semantics', () => {
    render(<SpecsTable specs={vehicles[0].specs} />)
    expect(screen.getByRole('table')).toBeInTheDocument()
    const rowgroups = screen.getAllByRole('rowgroup')
    expect(rowgroups.length).toBe(3) // Performance, Efficiency, Dimensions
  })
})