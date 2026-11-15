import { Header } from './Header'
import { Footer } from './Footer'

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main id="main-content" className="flex-1 pt-16">
        {children}
      </main>
      <Footer />
    </div>
  )
}