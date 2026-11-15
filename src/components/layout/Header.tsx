'use client'

import * as React from 'react'
import Link from 'next/link'
import { Menu, X, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetTrigger, SheetClose } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'

const navigation = [
  { name: 'Models', href: '/models' },
  { name: 'Configurator', href: '/configurator' },
  { name: 'Owners', href: '/owners' },
  { name: 'Find a Dealer', href: '/dealer-locator' },
]

export function Header() {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false)

  return (
    <header className="fixed top-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-b border-porsche-chalk">
      <div className="container-porsche">
        <div className="flex h-16 items-center justify-between">
          <Link href="/" className="flex items-center space-x-2" aria-label="Porsche Home">
            <svg
              role="img"
              aria-label="Porsche"
              viewBox="0 0 120 120"
              className="h-10 w-10 text-porsche-black"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <rect width="120" height="120" rx="20" fill="currentColor" />
              <text
                x="50%"
                y="58%"
                dominantBaseline="middle"
                textAnchor="middle"
                fontFamily="system-ui, sans-serif"
                fontSize="48"
                fontWeight="bold"
                fill="white"
              >
                P
              </text>
            </svg>
            <span className="hidden sm:block text-xl font-bold tracking-tight text-porsche-black">
              Porsche
            </span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8" aria-label="Main navigation">
            {navigation.map((item) => (
              <Link
                key={item.name}
                href={item.href}
                className="text-sm font-medium text-porsche-black/80 hover:text-porsche-red transition-colors"
              >
                {item.name}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/contact">Contact</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/models">Explore Models</Link>
            </Button>
          </div>

          <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" className="md:hidden" aria-label={mobileMenuOpen ? 'Close menu' : 'Open menu'}>
                {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-72 p-0">
              <nav className="flex flex-col p-6 space-y-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    href={item.href}
                    className="text-lg font-medium text-porsche-black/80 hover:text-porsche-red transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {item.name}
                  </Link>
                ))}
                <Separator className="my-4" />
                <Button className="w-full" asChild>
                  <Link href="/models" onClick={() => setMobileMenuOpen(false)}>Explore Models</Link>
                </Button>
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/contact" onClick={() => setMobileMenuOpen(false)}>Contact Us</Link>
                </Button>
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

function Separator({ className }: { className?: string }) {
  return <hr className={cn('border-porsche-chalk', className)} />
}