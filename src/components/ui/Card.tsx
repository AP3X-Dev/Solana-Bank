import React from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { motion } from 'framer-motion'
import { cn } from '../../lib/utils'

const cardVariants = cva(
  'rounded-2xl border border-dark-light bg-dark-card text-light-text transition-all duration-200',
  {
    variants: {
      variant: {
        default: 'shadow-card',
        elevated: 'shadow-card-hover',
        outline: 'border-2 border-dark-light bg-transparent',
        ghost: 'border-transparent bg-transparent',
        gradient: 'bg-gradient-to-br from-dark-card to-dark-light border-dark-light/50',
      },
      size: {
        sm: 'p-4',
        default: 'p-6',
        lg: 'p-8',
        xl: 'p-10',
      },
      hoverable: {
        true: 'cursor-pointer hover:shadow-card-hover hover:scale-[1.02] hover:border-solana-teal/20',
        false: '',
      },
      interactive: {
        true: 'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-solana-teal focus-visible:ring-offset-2 focus-visible:ring-offset-dark',
        false: '',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      hoverable: false,
      interactive: false,
    },
  }
)

export interface CardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof cardVariants> {
  asChild?: boolean
  animated?: boolean
  children?: React.ReactNode
}

const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ 
    className, 
    variant, 
    size, 
    hoverable, 
    interactive,
    asChild = false,
    animated = false,
    children,
    ...props 
  }, ref) => {
    const Component = animated ? motion.div : 'div'
    
    const animationProps = animated ? {
      initial: { opacity: 0, y: 20 },
      animate: { opacity: 1, y: 0 },
      transition: { duration: 0.3 },
      whileHover: hoverable ? { scale: 1.02 } : undefined,
      whileTap: interactive ? { scale: 0.98 } : undefined,
    } : {}

    return (
      <Component
        className={cn(cardVariants({ variant, size, hoverable, interactive, className }))}
        ref={ref}
        {...animationProps}
        {...props}
      >
        {children}
      </Component>
    )
  }
)
Card.displayName = 'Card'

// Card Header
const CardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex flex-col space-y-1.5 pb-4', className)}
    {...props}
  />
))
CardHeader.displayName = 'CardHeader'

// Card Title
const CardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, children, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn('text-lg font-semibold leading-none tracking-tight text-light-text', className)}
    {...props}
  >
    {children}
  </h3>
))
CardTitle.displayName = 'CardTitle'

// Card Description
const CardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn('text-sm text-muted-text', className)}
    {...props}
  />
))
CardDescription.displayName = 'CardDescription'

// Card Content
const CardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn('', className)} {...props} />
))
CardContent.displayName = 'CardContent'

// Card Footer
const CardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn('flex items-center pt-4 border-t border-dark-light', className)}
    {...props}
  />
))
CardFooter.displayName = 'CardFooter'

// Specialized Card Components

// Stats Card
interface StatsCardProps extends CardProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
  }
  icon?: React.ComponentType<{ size?: number; className?: string }>
  trend?: 'up' | 'down' | 'neutral'
}

export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  value,
  change,
  icon: Icon,
  trend = 'neutral',
  className,
  ...props
}) => {
  const trendColors = {
    up: 'text-green-500',
    down: 'text-red-500',
    neutral: 'text-muted-text',
  }

  return (
    <Card className={cn('relative overflow-hidden', className)} {...props}>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <p className="text-sm text-muted-text">{title}</p>
            <p className="text-2xl font-bold text-light-text">{value}</p>
            {change && (
              <p className={cn('text-xs', trendColors[trend])}>
                {change.value > 0 ? '+' : ''}{change.value}% {change.period}
              </p>
            )}
          </div>
          {Icon && (
            <div className="p-3 bg-solana-gradient/10 rounded-xl">
              <Icon size={24} className="text-solana-teal" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

// Feature Card
interface FeatureCardProps extends CardProps {
  title: string
  description: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
  action?: React.ReactNode
}

export const FeatureCard: React.FC<FeatureCardProps> = ({
  title,
  description,
  icon: Icon,
  action,
  className,
  ...props
}) => {
  return (
    <Card 
      className={cn('h-full', className)} 
      hoverable={!!props.onClick}
      {...props}
    >
      <CardHeader>
        {Icon && (
          <div className="p-3 bg-solana-gradient/10 rounded-xl w-fit mb-4">
            <Icon size={24} className="text-solana-teal" />
          </div>
        )}
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      {action && (
        <CardFooter>
          {action}
        </CardFooter>
      )}
    </Card>
  )
}

// Account Card
interface AccountCardProps extends CardProps {
  accountName: string
  accountType: string
  balance: number
  accountNumber: string
  icon?: React.ComponentType<{ size?: number; className?: string }>
}

export const AccountCard: React.FC<AccountCardProps> = ({
  accountName,
  accountType,
  balance,
  accountNumber,
  icon: Icon,
  className,
  ...props
}) => {
  return (
    <Card 
      className={cn('relative overflow-hidden', className)}
      hoverable={!!props.onClick}
      {...props}
    >
      <CardContent>
        <div className="flex items-start justify-between mb-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-light-text">{accountName}</h3>
            <p className="text-sm text-muted-text capitalize">{accountType}</p>
          </div>
          {Icon && (
            <div className="p-2 bg-solana-gradient/10 rounded-lg">
              <Icon size={20} className="text-solana-teal" />
            </div>
          )}
        </div>
        
        <div className="space-y-3">
          <div className="text-2xl font-bold bg-solana-gradient bg-clip-text text-transparent">
            {balance.toFixed(4)} SOL
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-text">
            <span className="font-mono">
              {accountNumber.slice(0, 4)}...{accountNumber.slice(-4)}
            </span>
            <span className="px-2 py-1 bg-dark-light rounded-full">
              {accountType}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Card Grid
interface CardGridProps {
  children: React.ReactNode
  columns?: 1 | 2 | 3 | 4 | 5 | 6
  gap?: 'sm' | 'default' | 'lg'
  className?: string
}

export const CardGrid: React.FC<CardGridProps> = ({
  children,
  columns = 3,
  gap = 'default',
  className,
}) => {
  const gridCols = {
    1: 'grid-cols-1',
    2: 'grid-cols-1 md:grid-cols-2',
    3: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-4',
    5: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5',
    6: 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6',
  }

  const gapClasses = {
    sm: 'gap-3',
    default: 'gap-6',
    lg: 'gap-8',
  }

  return (
    <div className={cn('grid', gridCols[columns], gapClasses[gap], className)}>
      {children}
    </div>
  )
}

export { Card, CardHeader, CardFooter, CardTitle, CardDescription, CardContent }
