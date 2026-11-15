import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowRight } from 'lucide-react'

export function CTASection() {
  return (
    <section className="section-padding bg-porsche-black" aria-labelledby="cta-heading">
      <div className="container-porsche text-center">
        <h2 id="cta-heading" className="text-4xl sm:text-5xl font-bold tracking-tight text-white mb-6">
          Ready to Configure Your Porsche?
        </h2>
        <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10">
          Build your dream sports car, SUV, or electric vehicle. Choose your model, color, wheels, and options — then find a dealer near you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button size="lg" asChild className="gap-2 bg-porsche-red hover:bg-porsche-red/90">
            <Link href="/models">
              Explore Models
              <ArrowRight className="h-5 w-5" aria-hidden="true" />
            </Link>
          </Button>
          <Button size="lg" variant="outline" asChild className="border-white text-white hover:bg-white/10">
            <Link href="/configurator">Start Configuring</Link>
          </Button>
        </div>
      </div>
    </section>
  )
}