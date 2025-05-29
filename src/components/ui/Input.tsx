import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { Eye, EyeOff, Search, X } from 'lucide-react'
import { cn } from '../../lib/utils'

const inputVariants = cva(
  'flex w-full rounded-xl border border-dark-light bg-dark-card px-3 py-2 text-sm text-light-text ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solana-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'border-dark-light hover:border-dark-light/80',
        error: 'border-red-500 focus-visible:ring-red-500',
        success: 'border-green-500 focus-visible:ring-green-500',
        warning: 'border-yellow-500 focus-visible:ring-yellow-500',
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        default: 'h-10 px-3',
        lg: 'h-11 px-4 text-base',
        xl: 'h-12 px-4 text-lg',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement>,
    VariantProps<typeof inputVariants> {
  label?: string
  description?: string
  error?: string
  success?: string
  warning?: string
  leftIcon?: React.ComponentType<{ size?: number; className?: string }>
  rightIcon?: React.ComponentType<{ size?: number; className?: string }>
  onRightIconClick?: () => void
  clearable?: boolean
  onClear?: () => void
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ 
    className, 
    variant, 
    size,
    type = 'text',
    label,
    description,
    error,
    success,
    warning,
    leftIcon: LeftIcon,
    rightIcon: RightIcon,
    onRightIconClick,
    clearable = false,
    onClear,
    value,
    ...props 
  }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false)
    const isPassword = type === 'password'
    const inputType = isPassword && showPassword ? 'text' : type
    
    // Determine variant based on validation state
    const currentVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant

    const hasValue = value !== undefined && value !== ''
    const showClearButton = clearable && hasValue && onClear

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-light-text">
            {label}
          </label>
        )}
        
        <div className="relative">
          {LeftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2">
              <LeftIcon size={16} className="text-muted-text" />
            </div>
          )}
          
          <input
            type={inputType}
            className={cn(
              inputVariants({ variant: currentVariant, size, className }),
              LeftIcon && 'pl-10',
              (RightIcon || isPassword || showClearButton) && 'pr-10'
            )}
            ref={ref}
            value={value}
            {...props}
          />
          
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            {showClearButton && (
              <button
                type="button"
                onClick={onClear}
                className="text-muted-text hover:text-light-text transition-colors"
              >
                <X size={16} />
              </button>
            )}
            
            {isPassword && (
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="text-muted-text hover:text-light-text transition-colors"
              >
                {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            )}
            
            {RightIcon && !isPassword && !showClearButton && (
              <button
                type="button"
                onClick={onRightIconClick}
                className="text-muted-text hover:text-light-text transition-colors"
                disabled={!onRightIconClick}
              >
                <RightIcon size={16} />
              </button>
            )}
          </div>
        </div>
        
        {description && !error && !success && !warning && (
          <p className="text-xs text-muted-text">{description}</p>
        )}
        
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        
        {success && (
          <p className="text-xs text-green-500">{success}</p>
        )}
        
        {warning && (
          <p className="text-xs text-yellow-500">{warning}</p>
        )}
      </div>
    )
  }
)
Input.displayName = 'Input'

// Search Input
interface SearchInputProps extends Omit<InputProps, 'leftIcon' | 'type'> {
  onSearch?: (value: string) => void
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ onSearch, onKeyDown, ...props }, ref) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && onSearch) {
        onSearch(e.currentTarget.value)
      }
      onKeyDown?.(e)
    }

    return (
      <Input
        ref={ref}
        type="search"
        leftIcon={Search}
        placeholder="Search..."
        clearable
        onKeyDown={handleKeyDown}
        {...props}
      />
    )
  }
)
SearchInput.displayName = 'SearchInput'

// Number Input with formatting
interface NumberInputProps extends Omit<InputProps, 'type'> {
  min?: number
  max?: number
  step?: number
  precision?: number
  prefix?: string
  suffix?: string
  thousandSeparator?: boolean
}

export const NumberInput = React.forwardRef<HTMLInputElement, NumberInputProps>(
  ({ 
    min, 
    max, 
    step = 1, 
    precision = 2,
    prefix,
    suffix,
    thousandSeparator = false,
    value,
    onChange,
    ...props 
  }, ref) => {
    const [displayValue, setDisplayValue] = React.useState('')

    React.useEffect(() => {
      if (value !== undefined) {
        let formatted = Number(value).toFixed(precision)
        if (thousandSeparator) {
          formatted = Number(formatted).toLocaleString()
        }
        setDisplayValue(`${prefix || ''}${formatted}${suffix || ''}`)
      }
    }, [value, precision, prefix, suffix, thousandSeparator])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const rawValue = e.target.value.replace(/[^0-9.-]/g, '')
      const numValue = parseFloat(rawValue)
      
      if (!isNaN(numValue)) {
        if (min !== undefined && numValue < min) return
        if (max !== undefined && numValue > max) return
        
        onChange?.({
          ...e,
          target: {
            ...e.target,
            value: numValue.toString(),
          },
        })
      }
    }

    return (
      <Input
        ref={ref}
        type="text"
        value={displayValue}
        onChange={handleChange}
        {...props}
      />
    )
  }
)
NumberInput.displayName = 'NumberInput'

// Textarea
interface TextareaProps
  extends React.TextareaHTMLAttributes<HTMLTextAreaElement>,
    VariantProps<typeof inputVariants> {
  label?: string
  description?: string
  error?: string
  success?: string
  warning?: string
  resize?: boolean
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ 
    className, 
    variant,
    label,
    description,
    error,
    success,
    warning,
    resize = true,
    ...props 
  }, ref) => {
    const currentVariant = error ? 'error' : success ? 'success' : warning ? 'warning' : variant

    return (
      <div className="space-y-2">
        {label && (
          <label className="text-sm font-medium text-light-text">
            {label}
          </label>
        )}
        
        <textarea
          className={cn(
            inputVariants({ variant: currentVariant }),
            'min-h-[80px]',
            !resize && 'resize-none',
            className
          )}
          ref={ref}
          {...props}
        />
        
        {description && !error && !success && !warning && (
          <p className="text-xs text-muted-text">{description}</p>
        )}
        
        {error && (
          <p className="text-xs text-red-500">{error}</p>
        )}
        
        {success && (
          <p className="text-xs text-green-500">{success}</p>
        )}
        
        {warning && (
          <p className="text-xs text-yellow-500">{warning}</p>
        )}
      </div>
    )
  }
)
Textarea.displayName = 'Textarea'

export { Input, inputVariants }
