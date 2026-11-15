import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { InquiryForm } from './InquiryForm'

describe('InquiryForm', () => {
  const originalFetch = global.fetch

  beforeEach(() => {
    global.fetch = vi.fn()
  })

  afterEach(() => {
    global.fetch = originalFetch
  })

  it('shows validation errors for empty submit', async () => {
    render(<InquiryForm vehicleSlug="test" />)
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))
    expect(await screen.findByText(/name must be at least 2 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument()
    expect(await screen.findByText(/message must be at least 10 characters/i)).toBeInTheDocument()
    expect(await screen.findByText(/must agree to the privacy policy/i)).toBeInTheDocument()
  })
  it('submits valid form and shows success', async () => {
    const mockFetch = vi.fn().mockResolvedValue(new Response(null, { status: 200 }))
    global.fetch = mockFetch

    render(<InquiryForm vehicleSlug="911-carrera-s" />)
    fireEvent.change(screen.getByLabelText(/name/i), { target: { value: 'John Doe' } })
    fireEvent.change(screen.getByLabelText(/email/i), { target: { value: 'john@example.com' } })
    fireEvent.change(screen.getByLabelText(/phone/i), { target: { value: '555-1234' } })
    fireEvent.change(screen.getByLabelText(/message/i), { target: { value: 'Interested in test drive' } })
    fireEvent.click(screen.getByLabelText(/consent/i))
    fireEvent.click(screen.getByRole('button', { name: /submit/i }))

    // Wait for the async submission to complete and success message to appear
    await waitFor(() => {
      expect(screen.getByText(/thank you for your inquiry/i)).toBeInTheDocument()
    })
  })
})