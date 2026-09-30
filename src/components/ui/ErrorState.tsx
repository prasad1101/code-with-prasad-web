import { FiAlertTriangle } from 'react-icons/fi'
import { Button } from './Button'

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div
      role="alert"
      className="card mx-auto flex max-w-lg flex-col items-center gap-4 p-8 text-center"
    >
      <FiAlertTriangle className="text-accent size-8" aria-hidden="true" />
      <p className="font-display text-lg font-semibold">Something didn&apos;t load</p>
      <p className="text-muted text-sm">
        {message ?? 'Please check your connection and try again.'}
      </p>
      {onRetry && (
        <Button variant="secondary" onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}
