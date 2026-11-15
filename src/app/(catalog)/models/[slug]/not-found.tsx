import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4">
      <div className="text-center max-w-md">
        <h1 className="text-6xl font-bold text-porsche-red mb-4">404</h1>
        <h2 className="text-2xl font-bold text-porsche-black mb-4">Model Not Found</h2>
        <p className="text-porsche-black/60 mb-8">
          The Porsche model you're looking for doesn't exist or has been removed.
        </p>
        <Link
          href="/models"
          className="inline-flex items-center justify-center px-6 py-3 bg-porsche-red text-white font-medium rounded-lg hover:bg-porsche-red/90 transition-colors"
        >
          Browse All Models
        </Link>
      </div>
    </div>
  )
}