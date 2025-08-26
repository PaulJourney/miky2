'use client'

import { lazy, Suspense } from 'react'
import { Loader2 } from 'lucide-react'

// Lazy load heavy components
export const LazyReactMarkdown = lazy(() => import('react-markdown'))
export const LazyAnimatedBackground = lazy(() => import('@/components/AnimatedBackground').then(module => ({ default: module.AnimatedBackground })))
export const LazyAnimatedCounters = lazy(() => import('@/components/dashboard/AnimatedCounters'))

// Loading fallback component
export const ComponentLoader = ({ className = "" }: { className?: string }) => (
  <div className={`flex items-center justify-center p-8 ${className}`}>
    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
  </div>
)

// Wrapper for lazy components with loading fallback
export const LazyWrapper = ({
  children,
  fallback = <ComponentLoader />,
  className = ""
}: {
  children: React.ReactNode
  fallback?: React.ReactNode
  className?: string
}) => (
  <Suspense fallback={fallback}>
    <div className={className}>
      {children}
    </div>
  </Suspense>
)
