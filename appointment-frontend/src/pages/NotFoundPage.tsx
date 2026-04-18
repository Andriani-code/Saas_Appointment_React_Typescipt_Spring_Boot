import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/Button'
import { Home } from 'lucide-react'

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-6 max-w-md px-6">
        <p className="font-display text-8xl font-bold text-primary">404</p>
        <div>
          <h1 className="font-display text-2xl font-bold text-text">Page introuvable</h1>
          <p className="text-muted mt-2">La page que vous cherchez n'existe pas ou a été déplacée.</p>
        </div>
        <Link to="/dashboard">
          <Button icon={<Home size={16} />}>Retour à l'accueil</Button>
        </Link>
      </div>
    </div>
  )
}
