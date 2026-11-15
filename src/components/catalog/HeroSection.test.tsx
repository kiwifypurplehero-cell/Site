import React from 'react'
import { render, screen } from '@testing-library/react'
import { HeroSection } from './HeroSection'

describe('HeroSection', () => {
  it('renders headline and subheadline', () => {
    render(<HeroSection />)
    expect(screen.getByRole('heading', { level: 1 })).toHaveTextContent(/engineered for icons/i)
    expect(screen.getByText(/experience/i)).toBeInTheDocument()
  })
  it('renders CTA button linking to /models', () => {
    render(<HeroSection />)
    const link = screen.getByRole('link', { name: /explore models/i })
    expect(link).toHaveAttribute('href', '/models')
  })
  it('hero image has proper alt text', () => {
    render(<HeroSection />)
    const img = screen.getByRole('img', { name: /porsche/i })
    expect(img).toHaveAttribute('alt', 'Porsche 911 driving on coastal road')
  })
})