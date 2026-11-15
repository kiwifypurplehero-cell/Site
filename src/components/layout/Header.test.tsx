import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import { Header } from './Header'

describe('Header', () => {
  it('renders Porsche logo', () => {
    render(<Header />)
    expect(screen.getByRole('img', { name: /porsche/i })).toBeInTheDocument()
  })
  it('renders navigation links', () => {
    render(<Header />)
    const links = screen.getAllByRole('link', { name: /models/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
  })
  it('opens mobile menu on hamburger click', () => {
    render(<Header />)
    fireEvent.click(screen.getByRole('button', { name: /menu/i }))
    const links = screen.getAllByRole('link', { name: /models/i })
    expect(links.length).toBeGreaterThanOrEqual(1)
  })
})