interface FeaturesListProps {
  features: string[]
}

export function FeaturesList({ features }: FeaturesListProps) {
  return (
    <section aria-labelledby="features-heading" className="py-8">
      <h2 id="features-heading" className="text-2xl font-bold text-porsche-black mb-6">
        Key Features
      </h2>
      <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" role="list">
        {features.map((feature, index) => (
          <li key={index} className="flex items-start gap-4 p-6 bg-white rounded-xl border border-porsche-chalk">
            <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-porsche-red/10 flex items-center justify-center">
              <svg className="h-6 w-6 text-porsche-red" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <span className="text-porsche-black font-medium">{feature}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}