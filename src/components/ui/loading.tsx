'use client'

import { Loader2 } from 'lucide-react'
import { motion } from 'framer-motion'

// Standard loading spinner
export const LoadingSpinner = ({
  size = 'default',
  className = '',
  text = ''
}: {
  size?: 'sm' | 'default' | 'lg'
  className?: string
  text?: string
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    default: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <Loader2 className={`animate-spin text-gray-400 ${sizeClasses[size]}`} />
      {text && <span className="ml-2 text-gray-400 text-sm">{text}</span>}
    </div>
  )
}

// Page loading component
export const PageLoading = ({ text = 'Loading...' }: { text?: string }) => (
  <div className="min-h-screen bg-gray-950 flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="lg" />
      <p className="mt-4 text-gray-400">{text}</p>
    </div>
  </div>
)

// Button loading state
export const ButtonLoading = ({
  text = 'Loading...',
  variant = 'default'
}: {
  text?: string
  variant?: 'default' | 'small'
}) => (
  <div className="flex items-center">
    <LoadingSpinner size={variant === 'small' ? 'sm' : 'default'} />
    <span className="ml-2">{text}</span>
  </div>
)

// Card loading skeleton
export const CardLoading = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-gray-800/50 rounded-lg ${className}`}>
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-700 rounded w-3/4"></div>
      <div className="h-4 bg-gray-700 rounded w-1/2"></div>
      <div className="h-4 bg-gray-700 rounded w-2/3"></div>
    </div>
  </div>
)

// Chat message loading animation
export const ChatLoading = () => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex items-center space-x-2 p-4"
  >
    <div className="flex space-x-1">
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
      />
      <motion.div
        className="w-2 h-2 bg-gray-400 rounded-full"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
      />
    </div>
    <span className="text-gray-400 text-sm">AI is thinking...</span>
  </motion.div>
)
