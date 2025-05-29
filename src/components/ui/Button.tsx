import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Loader2 } from 'lucide-react'
import { cn } from '../../lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-button hover:shadow-button-hover',
        destructive: 'bg-red-500 text-white hover:bg-red-600 shadow-button hover:shadow-button-hover',
        outline: 'border border-dark-light bg-transparent hover:bg-dark-light text-light-text',
        secondary: 'bg-dark-light text-light-text hover:bg-dark-light/80',
        ghost: 'hover:bg-dark-light text-light-text',
        link: 'text-primary underline-offset-4 hover:underline',
        gradient: 'bg-solana-gradient text-white hover:opacity-90 shadow-button hover:shadow-button-hover',
        success: 'bg-green-500 text-white hover:bg-green-600 shadow-button hover:shadow-button-hover',
        warning: 'bg-yellow-500 text-white hover:bg-yellow-600 shadow-button hover:shadow-button-hover',
        info: 'bg-blue-500 text-white hover:bg-blue-600 shadow-button hover:shadow-button-hover',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-lg px-3',
        lg: 'h-11 rounded-xl px-8',
        xl: 'h-12 rounded-xl px-10 text-base',
        icon: 'h-10 w-10',
        'icon-sm': 'h-8 w-8',
        'icon-lg': 'h-12 w-12',
      },
      fullWidth: {
        true: 'w-full',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      fullWidth: false,
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
  loading?: boolean
  icon?: React.ComponentType<{ size?: number; className?: string }>
  iconPosition?: 'left' | 'right'
  children?: React.ReactNode
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ 
    className, 
    variant, 
    size, 
    fullWidth,
    asChild = false, 
    loading = false,
    icon: Icon,
    iconPosition = 'left',
    children,
    disabled,
    ...props 
  }, ref) => {
    const isDisabled = disabled || loading

    const content = (
      <>
        {loading && (
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
        )}
        {Icon && !loading && iconPosition === 'left' && (
          <Icon size={16} className={cn('mr-2', children ? '' : 'mr-0')} />
        )}
        {children}
        {Icon && !loading && iconPosition === 'right' && (
          <Icon size={16} className={cn('ml-2', children ? '' : 'ml-0')} />
        )}
      </>
    )

    if (asChild) {
      // This would typically use Slot from @radix-ui/react-slot
      // For now, we'll just render the button
      return (
        <button
          className={cn(buttonVariants({ variant, size, fullWidth, className }))}
          ref={ref}
          disabled={isDisabled}
          {...props}
        >
          {content}
        </button>
      )
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, fullWidth, className }))}
        ref={ref}
        disabled={isDisabled}
        {...props}
      >
        {content}
      </button>
    )
  }
)
Button.displayName = 'Button'

// Specialized button components
export const GradientButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (props, ref) => <Button ref={ref} variant="gradient" {...props} />
)
GradientButton.displayName = 'GradientButton'

export const IconButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ size = 'icon', ...props }, ref) => (
    <Button ref={ref} size={size} {...props} />
  )
)
IconButton.displayName = 'IconButton'

export const LoadingButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ loading, children, ...props }, ref) => (
    <Button ref={ref} loading={loading} {...props}>
      {loading ? 'Loading...' : children}
    </Button>
  )
)
LoadingButton.displayName = 'LoadingButton'

// Button group component
interface ButtonGroupProps {
  children: React.ReactNode
  className?: string
  orientation?: 'horizontal' | 'vertical'
  size?: 'sm' | 'default' | 'lg'
}

export const ButtonGroup: React.FC<ButtonGroupProps> = ({
  children,
  className,
  orientation = 'horizontal',
  size = 'default',
}) => {
  return (
    <div
      className={cn(
        'inline-flex',
        orientation === 'horizontal' ? 'flex-row' : 'flex-col',
        '[&>button]:rounded-none',
        '[&>button:first-child]:rounded-l-xl',
        '[&>button:last-child]:rounded-r-xl',
        orientation === 'vertical' && [
          '[&>button:first-child]:rounded-t-xl [&>button:first-child]:rounded-b-none',
          '[&>button:last-child]:rounded-b-xl [&>button:last-child]:rounded-t-none',
        ],
        '[&>button:not(:first-child)]:border-l-0',
        orientation === 'vertical' && '[&>button:not(:first-child)]:border-t-0',
        className
      )}
    >
      {children}
    </div>
  )
}

// Floating Action Button
interface FABProps extends ButtonProps {
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
}

export const FloatingActionButton: React.FC<FABProps> = ({
  position = 'bottom-right',
  className,
  size = 'icon-lg',
  variant = 'gradient',
  ...props
}) => {
  const positionClasses = {
    'bottom-right': 'fixed bottom-6 right-6',
    'bottom-left': 'fixed bottom-6 left-6',
    'top-right': 'fixed top-6 right-6',
    'top-left': 'fixed top-6 left-6',
  }

  return (
    <Button
      className={cn(
        positionClasses[position],
        'rounded-full shadow-lg hover:shadow-xl z-50',
        className
      )}
      size={size}
      variant={variant}
      {...props}
    />
  )
}

export { Button, buttonVariants }
