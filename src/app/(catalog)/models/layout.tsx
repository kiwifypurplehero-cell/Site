import { ReactNode } from 'react'

export default function ModelsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="container-porsche py-8 lg:py-16">
      <div className="flex flex-col lg:flex-row gap-8">
        {children}
      </div>
    </div>
  )
}