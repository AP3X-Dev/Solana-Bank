import React from 'react'
import { motion } from 'framer-motion'
import { Loader2, Wallet, TrendingUp, DollarSign } from 'lucide-react'
import { cn } from '../../lib/utils'

interface LoadingProps {
  size?: 'sm' | 'default' | 'lg' | 'xl'
  variant?: 'spinner' | 'dots' | 'pulse' | 'skeleton' | 'solana'
  text?: string
  className?: string
}

// Spinner Loading
const SpinnerLoading: React.FC<LoadingProps> = ({ size = 'default', text, className }) => {
  const sizes = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-2', className)}>
      <Loader2 className={cn('animate-spin text-solana-teal', sizes[size])} />
      {text && <p className="text-sm text-muted-text">{text}</p>}
    </div>
  )
}

// Dots Loading
const DotsLoading: React.FC<LoadingProps> = ({ size = 'default', text, className }) => {
  const dotSizes = {
    sm: 'h-1 w-1',
    default: 'h-2 w-2',
    lg: 'h-3 w-3',
    xl: 'h-4 w-4',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <div className="flex space-x-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className={cn('bg-solana-teal rounded-full', dotSizes[size])}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.7, 1, 0.7],
            }}
            transition={{
              duration: 0.8,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </div>
      {text && <p className="text-sm text-muted-text">{text}</p>}
    </div>
  )
}

// Pulse Loading
const PulseLoading: React.FC<LoadingProps> = ({ size = 'default', text, className }) => {
  const sizes = {
    sm: 'h-8 w-8',
    default: 'h-12 w-12',
    lg: 'h-16 w-16',
    xl: 'h-24 w-24',
  }

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <motion.div
        className={cn('bg-solana-gradient rounded-full', sizes[size])}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
        }}
      />
      {text && <p className="text-sm text-muted-text">{text}</p>}
    </div>
  )
}

// Solana-themed Loading
const SolanaLoading: React.FC<LoadingProps> = ({ size = 'default', text, className }) => {
  const iconSizes = {
    sm: 16,
    default: 24,
    lg: 32,
    xl: 48,
  }

  const icons = [Wallet, TrendingUp, DollarSign]

  return (
    <div className={cn('flex flex-col items-center justify-center space-y-4', className)}>
      <div className="relative">
        {icons.map((Icon, i) => (
          <motion.div
            key={i}
            className="absolute inset-0 flex items-center justify-center"
            animate={{
              rotate: 360,
              scale: [1, 1.2, 1],
            }}
            transition={{
              rotate: {
                duration: 2,
                repeat: Infinity,
                ease: 'linear',
              },
              scale: {
                duration: 1,
                repeat: Infinity,
                delay: i * 0.3,
              },
            }}
          >
            <Icon 
              size={iconSizes[size]} 
              className={cn(
                'text-solana-teal',
                i === 1 && 'text-solana-blue',
                i === 2 && 'text-solana-purple'
              )} 
            />
          </motion.div>
        ))}
      </div>
      {text && <p className="text-sm text-muted-text mt-8">{text}</p>}
    </div>
  )
}

// Skeleton Loading
interface SkeletonProps {
  className?: string
  lines?: number
  avatar?: boolean
}

export const Skeleton: React.FC<SkeletonProps> = ({ 
  className, 
  lines = 1, 
  avatar = false 
}) => {
  return (
    <div className={cn('animate-pulse', className)}>
      {avatar && (
        <div className="h-12 w-12 bg-dark-light rounded-full mb-4" />
      )}
      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <div
            key={i}
            className={cn(
              'h-4 bg-dark-light rounded',
              i === lines - 1 && lines > 1 && 'w-3/4'
            )}
          />
        ))}
      </div>
    </div>
  )
}

// Card Skeleton
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-6 bg-dark-card rounded-2xl border border-dark-light', className)}>
      <Skeleton lines={3} />
    </div>
  )
}

// Account Card Skeleton
export const AccountCardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn('p-6 bg-dark-card rounded-2xl border border-dark-light', className)}>
      <div className="animate-pulse">
        <div className="flex items-center justify-between mb-4">
          <div className="space-y-2">
            <div className="h-4 bg-dark-light rounded w-24" />
            <div className="h-3 bg-dark-light rounded w-16" />
          </div>
          <div className="h-8 w-8 bg-dark-light rounded-lg" />
        </div>
        <div className="space-y-3">
          <div className="h-6 bg-dark-light rounded w-32" />
          <div className="flex justify-between">
            <div className="h-3 bg-dark-light rounded w-20" />
            <div className="h-3 bg-dark-light rounded w-12" />
          </div>
        </div>
      </div>
    </div>
  )
}

// Transaction List Skeleton
export const TransactionListSkeleton: React.FC<{ count?: number }> = ({ count = 5 }) => {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-3 p-3 bg-dark-card rounded-xl border border-dark-light">
          <div className="animate-pulse flex items-center space-x-3 w-full">
            <div className="h-10 w-10 bg-dark-light rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-dark-light rounded w-3/4" />
              <div className="h-3 bg-dark-light rounded w-1/2" />
            </div>
            <div className="h-4 bg-dark-light rounded w-16" />
          </div>
        </div>
      ))}
    </div>
  )
}

// Main Loading Component
export const Loading: React.FC<LoadingProps> = ({ 
  variant = 'spinner', 
  ...props 
}) => {
  switch (variant) {
    case 'dots':
      return <DotsLoading {...props} />
    case 'pulse':
      return <PulseLoading {...props} />
    case 'solana':
      return <SolanaLoading {...props} />
    case 'skeleton':
      return <Skeleton {...props} />
    default:
      return <SpinnerLoading {...props} />
  }
}

// Full Page Loading
interface FullPageLoadingProps {
  text?: string
  variant?: LoadingProps['variant']
}

export const FullPageLoading: React.FC<FullPageLoadingProps> = ({ 
  text = 'Loading...', 
  variant = 'solana' 
}) => {
  return (
    <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-dark-card p-8 rounded-2xl border border-dark-light shadow-card">
        <Loading variant={variant} size="lg" text={text} />
      </div>
    </div>
  )
}

// Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean
  text?: string
  variant?: LoadingProps['variant']
  children: React.ReactNode
}

export const LoadingOverlay: React.FC<LoadingOverlayProps> = ({
  isLoading,
  text,
  variant = 'spinner',
  children,
}) => {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-dark-card/80 backdrop-blur-sm flex items-center justify-center rounded-2xl">
          <Loading variant={variant} text={text} />
        </div>
      )}
    </div>
  )
}

export default Loading
