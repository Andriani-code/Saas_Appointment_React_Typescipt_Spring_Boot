import { InputHTMLAttributes, forwardRef, ReactNode, useState } from 'react'
import { cn } from '@/utils'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?:   string
  error?:   string
  hint?:    string
  icon?:    ReactNode
  iconRight?: ReactNode
}

export const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  hint,
  icon,
  iconRight,
  className,
  id,
  required,
  onBlur,
  ...props
}, ref) => {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  const [touched, setTouched] = useState(false)
  const [internalError, setInternalError] = useState('')

  function handleBlur(e: React.FocusEvent<HTMLInputElement>) {
    setTouched(true)
    if (required && !e.target.value.trim()) {
      setInternalError('Ce champ est requis')
    } else {
      setInternalError('')
    }
    onBlur?.(e)
  }

  const displayError = error || (touched ? internalError : '')

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={inputId} className="text-sm font-medium text-text">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'input-base',
            icon      && 'pl-10',
            iconRight && 'pr-10',
            displayError && 'border-danger/60 focus:border-danger focus:ring-danger/15',
            className,
          )}
          onBlur={handleBlur}
          {...props}
        />
        {iconRight && (
          <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted">
            {iconRight}
          </span>
        )}
      </div>
      {displayError && <p className="text-xs text-danger font-medium">{displayError}</p>}
      {hint && !displayError && <p className="text-xs text-muted">{hint}</p>}
    </div>
  )
})

Input.displayName = 'Input'
