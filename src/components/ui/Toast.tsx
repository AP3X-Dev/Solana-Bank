import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, CheckCircle, AlertCircle, AlertTriangle, Info } from 'lucide-react'
import { cn } from '../../lib/utils'
import { useAppStore } from '../../store/useAppStore'

export interface Toast {
  id: string
  type: 'success' | 'error' | 'warning' | 'info'
  title: string
  message?: string
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastProps {
  toast: Toast
  onDismiss: (id: string) => void
}

const ToastComponent: React.FC<ToastProps> = ({ toast, onDismiss }) => {
  const [isVisible, setIsVisible] = React.useState(true)

  React.useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        setTimeout(() => onDismiss(toast.id), 300)
      }, toast.duration)

      return () => clearTimeout(timer)
    }
  }, [toast.duration, toast.id, onDismiss])

  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info,
  }

  const colors = {
    success: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/20',
      icon: 'text-green-500',
      text: 'text-green-100',
    },
    error: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/20',
      icon: 'text-red-500',
      text: 'text-red-100',
    },
    warning: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/20',
      icon: 'text-yellow-500',
      text: 'text-yellow-100',
    },
    info: {
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/20',
      icon: 'text-blue-500',
      text: 'text-blue-100',
    },
  }

  const Icon = icons[toast.type]
  const colorScheme = colors[toast.type]

  if (!isVisible) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.3 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.5 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        'relative flex w-full max-w-sm items-start space-x-3 rounded-xl border p-4 shadow-lg backdrop-blur-sm',
        colorScheme.bg,
        colorScheme.border,
        'bg-dark-card/90'
      )}
    >
      <div className={cn('flex-shrink-0 mt-0.5', colorScheme.icon)}>
        <Icon size={20} />
      </div>
      
      <div className="flex-1 space-y-1">
        <h4 className={cn('text-sm font-medium', colorScheme.text)}>
          {toast.title}
        </h4>
        {toast.message && (
          <p className="text-sm text-muted-text">
            {toast.message}
          </p>
        )}
        {toast.action && (
          <button
            onClick={toast.action.onClick}
            className={cn(
              'text-xs font-medium underline hover:no-underline',
              colorScheme.icon
            )}
          >
            {toast.action.label}
          </button>
        )}
      </div>
      
      <button
        onClick={() => onDismiss(toast.id)}
        className="flex-shrink-0 text-muted-text hover:text-light-text transition-colors"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}

// Toast Container
export const ToastContainer: React.FC = () => {
  const { notifications, removeNotification } = useAppStore()

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      <AnimatePresence mode="popLayout">
        {notifications.map((notification) => (
          <ToastComponent
            key={notification.id}
            toast={{
              id: notification.id,
              type: notification.type,
              title: notification.title,
              message: notification.message,
              duration: 5000, // 5 seconds default
            }}
            onDismiss={removeNotification}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}

// Toast Hook
export const useToast = () => {
  const { addNotification } = useAppStore()

  const toast = React.useCallback(
    (options: Omit<Toast, 'id'>) => {
      addNotification({
        type: options.type,
        title: options.title,
        message: options.message,
      })
    },
    [addNotification]
  )

  const success = React.useCallback(
    (title: string, message?: string) => {
      toast({ type: 'success', title, message })
    },
    [toast]
  )

  const error = React.useCallback(
    (title: string, message?: string) => {
      toast({ type: 'error', title, message })
    },
    [toast]
  )

  const warning = React.useCallback(
    (title: string, message?: string) => {
      toast({ type: 'warning', title, message })
    },
    [toast]
  )

  const info = React.useCallback(
    (title: string, message?: string) => {
      toast({ type: 'info', title, message })
    },
    [toast]
  )

  return {
    toast,
    success,
    error,
    warning,
    info,
  }
}

// Specialized toast functions
export const toastUtils = {
  success: (title: string, message?: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({ type: 'success', title, message })
  },
  
  error: (title: string, message?: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({ type: 'error', title, message })
  },
  
  warning: (title: string, message?: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({ type: 'warning', title, message })
  },
  
  info: (title: string, message?: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({ type: 'info', title, message })
  },
  
  // Transaction specific toasts
  transactionSent: (signature: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({
      type: 'success',
      title: 'Transaction Sent',
      message: `Transaction signature: ${signature.slice(0, 8)}...`,
    })
  },
  
  transactionConfirmed: (signature: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({
      type: 'success',
      title: 'Transaction Confirmed',
      message: `Transaction ${signature.slice(0, 8)}... has been confirmed`,
    })
  },
  
  transactionFailed: (error: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({
      type: 'error',
      title: 'Transaction Failed',
      message: error,
    })
  },
  
  walletConnected: (address: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({
      type: 'success',
      title: 'Wallet Connected',
      message: `Connected to ${address.slice(0, 4)}...${address.slice(-4)}`,
    })
  },
  
  walletDisconnected: () => {
    const { addNotification } = useAppStore.getState()
    addNotification({
      type: 'info',
      title: 'Wallet Disconnected',
      message: 'Your wallet has been disconnected',
    })
  },
  
  accountCreated: (accountName: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({
      type: 'success',
      title: 'Account Created',
      message: `${accountName} has been created successfully`,
    })
  },
  
  transferCompleted: (amount: number, recipient: string) => {
    const { addNotification } = useAppStore.getState()
    addNotification({
      type: 'success',
      title: 'Transfer Completed',
      message: `${amount} SOL sent to ${recipient.slice(0, 4)}...${recipient.slice(-4)}`,
    })
  },
}
