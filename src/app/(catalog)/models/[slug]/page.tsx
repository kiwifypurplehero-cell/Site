import { Metadata } from 'next'
import { notFound } from 'next/navigation'
import { getVehicleBySlug, vehicles } from '@/lib/data/vehicles'
import { VehicleGallery } from '@/components/catalog/VehicleGallery'
import { SpecsTable } from '@/components/catalog/SpecsTable'
import { FeaturesList } from '@/components/catalog/FeaturesList'
import { InquiryForm } from '@/components/catalog/InquiryForm'

export async function generateStaticParams() {
  return vehicles.map((vehicle) => ({ slug: vehicle.slug }))
}

interface ModelDetailPageProps {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: ModelDetailPageProps): Promise<Metadata> {
  const { slug } = await params
  const vehicle = getVehicleBySlug(slug)

  if (!vehicle) {
    return { title: 'Model Not Found' }
  }

  return {
    title: `${vehicle.year} ${vehicle.model} ${vehicle.variant}`,
    description: vehicle.seo?.description || `Explore the ${vehicle.year} ${vehicle.model} ${vehicle.variant}. View specifications, features, and request more information.`,
    openGraph: {
      title: `${vehicle.year} ${vehicle.model} ${vehicle.variant} | Porsche Catalog`,
      description: vehicle.seo?.description || `Explore the ${vehicle.year} ${vehicle.model} ${vehicle.variant}.`,
      images: vehicle.images[0] ? [vehicle.images[0]] : [],
      type: 'website',
    },
  }
}

export default async function ModelDetailPage({ params }: ModelDetailPageProps) {
  const { slug } = await params
  const vehicle = getVehicleBySlug(slug)

  if (!vehicle) {
    notFound()
  }

  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(vehicle.price)

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-[60vh] min-h-[400px] flex items-end" aria-labelledby="model-heading">
        <div className="absolute inset-0 z-0">
          <img
            src={vehicle.images[0]}
            alt={`${vehicle.year} ${vehicle.model} ${vehicle.variant}`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-porsche-black/80 via-porsche-black/20 to-transparent" />
        </div>
        <div className="relative z-10 w-full px-4 py-16 sm:px-6 lg:px-8">
          <div className="max-w-4xl">
            <p className="text-porsche-red font-medium tracking-wider uppercase text-sm mb-2">
              {vehicle.model}
            </p>
            <h1 id="model-heading" className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-4">
              {vehicle.variant}
            </h1>
            <p className="text-xl text-white/80 mb-6">{vehicle.year} Model</p>
            <p className="text-3xl font-bold text-white">{formattedPrice}</p>
            {vehicle.availability === 'pre-order' && (
              <span className="inline-block mt-4 px-3 py-1 text-sm font-medium text-white bg-porsche-gt-silver/80 rounded-full">
                Available for Pre-order
              </span>
            )}
            {vehicle.availability === 'sold' && (
              <span className="inline-block mt-4 px-3 py-1 text-sm font-medium text-white bg-porsche-black/80 rounded-full">
                Sold
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Content Sections */}
      <main className="max-w-6xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Gallery & Features */}
          <div className="lg:col-span-2 space-y-12">
            <VehicleGallery images={vehicle.images} />
            <FeaturesList features={vehicle.features} />
          </div>

          {/* Right Column - Specs & Inquiry */}
          <div className="space-y-8">
            <SpecsTable specs={vehicle.specs} />
            <InquiryForm vehicleSlug={vehicle.slug} />
          </div>
        </div>
      </main>
    </div>
  )
}