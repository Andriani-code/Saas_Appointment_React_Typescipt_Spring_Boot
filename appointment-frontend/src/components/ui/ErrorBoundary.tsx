import { Component, type ReactNode } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

/**
 * Catches render/import failures so a broken lazy chunk shows a recoverable
 * screen instead of an infinite spinner or a blank page.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  handleRetry = () => {
    // React.lazy() caches the rejected import promise, so simply resetting the
    // state re-throws the same error. A full reload is the reliable recovery.
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center text-primary text-3xl">
            ⚠️
          </div>
          <p className="font-semibold text-text">Une erreur est survenue</p>
          <p className="text-sm text-muted max-w-sm">
            Le chargement de cette page a échoué. Vous pouvez réessayer ou
            revenir plus tard.
          </p>
          <button
            onClick={this.handleRetry}
            className="mt-2 px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-semibold hover:bg-primary/90 transition-colors"
          >
            Réessayer
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
