'use client'

import React from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { toast } from '@/components/ui/use-toast'
import { Check, Loader2 } from 'lucide-react'

const inquirySchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  preferredContact: z.enum(['email', 'phone', 'text']),
  message: z.string().min(10, 'Message must be at least 10 characters'),
  consent: z.boolean().refine((val) => val === true, 'You must agree to the privacy policy'),
  honeypot: z.string().optional(),
})

type InquiryFormData = z.infer<typeof inquirySchema>

interface InquiryFormProps {
  vehicleSlug: string
}

export function InquiryForm({ vehicleSlug }: InquiryFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false)
  const [submitStatus, setSubmitStatus] = React.useState<'idle' | 'success' | 'error'>('idle')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<InquiryFormData>({
    resolver: zodResolver(inquirySchema),
    defaultValues: {
      preferredContact: 'email',
    },
  })

  const onSubmit = async (data: InquiryFormData) => {
    if (data.honeypot) return

    setIsSubmitting(true)
    setSubmitStatus('idle')

    try {
      const response = await fetch('/api/inquiry', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, vehicleSlug }),
      })

      if (!response.ok) throw new Error('Submission failed')

      setSubmitStatus('success')
      toast({ title: 'Thank you!', description: 'We\'ll be in touch soon.', variant: 'success' })
      reset()
    } catch {
      setSubmitStatus('error')
      toast({ title: 'Error', description: 'Please try again later.', variant: 'destructive' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section aria-labelledby="inquiry-heading" className="py-8 bg-porsche-chalk/30 rounded-xl">
      <h2 id="inquiry-heading" className="text-2xl font-bold text-porsche-black mb-6">
        Request More Information
      </h2>

      {submitStatus === 'success' && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg text-green-800" role="alert">
          <div className="flex items-center gap-2">
            <Check className="h-5 w-5 flex-shrink-0" aria-hidden="true" />
            <span>Thank you for your inquiry! A Porsche specialist will contact you shortly.</span>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate data-testid="inquiry-form">
        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="name">Full Name *</Label>
            <Input
              id="name"
              placeholder="John Doe"
              {...register('name')}
              aria-invalid={!!errors.name}
              aria-describedby={errors.name ? 'name-error' : undefined}
            />
            {errors.name && (
              <p id="name-error" className="mt-1 text-sm text-red-600" role="alert">{errors.name.message}</p>
            )}
          </div>
          <div>
            <Label htmlFor="email">Email Address *</Label>
            <Input
              id="email"
              type="email"
              placeholder="john@example.com"
              {...register('email')}
              aria-invalid={!!errors.email}
              aria-describedby={errors.email ? 'email-error' : undefined}
            />
            {errors.email && (
              <p id="email-error" className="mt-1 text-sm text-red-600" role="alert">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-6">
          <div>
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="(555) 123-4567"
              {...register('phone')}
            />
          </div>
          <div>
            <Label htmlFor="preferredContact">Preferred Contact Method</Label>
            <Select
              value={''}
              onValueChange={(value) => {}}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="text">Text Message</SelectItem>
              </SelectContent>
            </Select>
            <Select
              {...register('preferredContact')}
              defaultValue="email"
            >
              <SelectTrigger className="hidden">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="email">Email</SelectItem>
                <SelectItem value="phone">Phone Call</SelectItem>
                <SelectItem value="text">Text Message</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="message">Message *</Label>
          <Textarea
            id="message"
            placeholder="I'm interested in scheduling a test drive for the 911 Carrera S..."
            rows={4}
            {...register('message')}
            aria-invalid={!!errors.message}
            aria-describedby={errors.message ? 'message-error' : undefined}
          />
          {errors.message && (
            <p id="message-error" className="mt-1 text-sm text-red-600" role="alert">{errors.message.message}</p>
          )}
        </div>

        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="consent"
            {...register('consent')}
            aria-invalid={!!errors.consent}
            aria-describedby={errors.consent ? 'consent-error' : undefined}
            className="mt-1 h-4 w-4 rounded border-porsche-chalk text-porsche-red focus:ring-porsche-red"
          />
          <Label htmlFor="consent" className="text-sm text-porsche-black/70 cursor-pointer">
            I agree to the <a href="/privacy" className="text-porsche-red hover:underline">Privacy Policy</a> and consent to being contacted by Porsche. *
          </Label>
        </div>
        {errors.consent && (
          <p id="consent-error" className="text-sm text-red-600" role="alert">{errors.consent.message}</p>
        )}

        <input type="hidden" {...register('honeypot')} tabIndex={-1} autoComplete="off" />

        <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="h-5 w-5 animate-spin mr-2" aria-hidden="true" />
              Submitting...
            </>
          ) : (
            'Submit Inquiry'
          )}
        </Button>
      </form>
    </section>
  )
}