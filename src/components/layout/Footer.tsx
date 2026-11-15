import Link from 'next/link'
import { Shield, MapPin, Phone, Mail, Facebook, Twitter, Instagram, Monitor } from 'lucide-react'

const footerLinks = {
  models: [
    { name: '911', href: '/models?model=911' },
    { name: 'Taycan', href: '/models?model=taycan' },
    { name: 'Cayenne', href: '/models?model=cayenne' },
    { name: 'Macan', href: '/models?model=macan' },
    { name: 'Panamera', href: '/models?model=panamera' },
    { name: '718', href: '/models?model=718' },
  ],
  company: [
    { name: 'About Porsche', href: '/about' },
    { name: 'Newsroom', href: '/newsroom' },
    { name: 'Careers', href: '/careers' },
    { name: 'Sustainability', href: '/sustainability' },
    { name: 'Porsche Museum', href: '/museum' },
  ],
  support: [
    { name: 'Contact Us', href: '/contact' },
    { name: 'Find a Dealer', href: '/dealer-locator' },
    { name: 'Owner Resources', href: '/owners' },
    { name: 'Roadside Assistance', href: '/roadside' },
    { name: 'Financial Services', href: '/finance' },
  ],
  legal: [
    { name: 'Privacy Policy', href: '/privacy' },
    { name: 'Terms of Use', href: '/terms' },
    { name: 'Cookie Policy', href: '/cookies' },
    { name: 'Accessibility', href: '/accessibility' },
    { name: 'Legal Notice', href: '/legal' },
  ],
}

const socialLinks = [
  { name: 'Facebook', href: 'https://facebook.com/porsche', icon: Facebook },
  { name: 'Twitter', href: 'https://twitter.com/porsche', icon: Twitter },
  { name: 'Instagram', href: 'https://instagram.com/porsche', icon: Instagram },
  { name: 'YouTube', href: 'https://youtube.com/porsche', icon: Monitor },
]

export function Footer() {
  return (
    <footer className="bg-porsche-black text-white" role="contentinfo">
      <div className="container-porsche py-16 lg:py-24">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 lg:gap-12">
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center space-x-2 mb-6" aria-label="Porsche Home">
              <svg
                role="img"
                aria-label="Porsche"
                viewBox="0 0 120 120"
                className="h-10 w-10 text-white"
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
              <span className="text-xl font-bold tracking-tight">Porsche</span>
            </Link>
            <p className="text-porsche-chalk text-sm leading-relaxed mb-6">
              Engineered for icons since 1931. Driving dreams, building legends.
            </p>
            <div className="flex space-x-6">
              {socialLinks.map((social) => (
                <a
                  key={social.name}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={social.name}
                  className="text-porsche-chalk hover:text-white transition-colors"
                >
                  <social.icon className="h-5 w-5" aria-hidden="true" />
                </a>
              ))}
            </div>
          </div>

          <nav aria-label="Models">
            <h3 className="font-semibold text-lg mb-4">Models</h3>
            <ul className="space-y-3">
              {footerLinks.models.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-porsche-chalk hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Company">
            <h3 className="font-semibold text-lg mb-4">Company</h3>
            <ul className="space-y-3">
              {footerLinks.company.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-porsche-chalk hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Support">
            <h3 className="font-semibold text-lg mb-4">Support</h3>
            <ul className="space-y-3">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-porsche-chalk hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-label="Legal">
            <h3 className="font-semibold text-lg mb-4">Legal</h3>
            <ul className="space-y-3">
              {footerLinks.legal.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="text-porsche-chalk hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="mt-12 pt-8 border-t border-porsche-graphite">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-porsche-chalk text-sm">
              © {new Date().getFullYear()} Porsche Cars North America, Inc. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-sm text-porsche-chalk">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4" aria-hidden="true" />
                <span>One Porsche Drive, Atlanta, GA 30354</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="h-4 w-4" aria-hidden="true" />
                <span>1-800-PORSCHE</span>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4" aria-hidden="true" />
                <span>info@porsche.us</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}