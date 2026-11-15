import { HeroSection } from '@/components/catalog/HeroSection'
import { FeaturedModels } from '@/components/catalog/FeaturedModels'
import { BrandStory } from '@/components/catalog/BrandStory'
import { CTASection } from '@/components/catalog/CTASection'

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturedModels />
      <BrandStory />
      <CTASection />
    </>
  )
}