import { cn } from '../../lib/utils'

const variantStyles = {
  primary: 'bg-primary text-primary-foreground hover:bg-primary/90',
  outline: 'border border-border bg-background text-foreground hover:bg-muted',
  destructive: 'bg-destructive text-white hover:bg-destructive/90',
  ghost: 'text-foreground hover:bg-muted',
} as const

type ButtonVariant = keyof typeof variantStyles

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

export function Button({
  className,
  variant = 'primary',
  style,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center px-4 py-2 text-sm font-medium transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:pointer-events-none disabled:opacity-50',
        variantStyles[variant],
        className,
      )}
      style={{ borderRadius: 'var(--genre-radius)', ...style }}
      {...props}
    />
  )
}
