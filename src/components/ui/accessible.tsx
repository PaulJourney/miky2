'use client'

import React from 'react'

// Screen reader only text
export const ScreenReaderOnly = ({ children }: { children: React.ReactNode }) => (
  <span className="sr-only">{children}</span>
)

// Skip to main content link
export const SkipToMain = () => (
  <a
    href="#main-content"
    className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4
               bg-blue-600 text-white px-4 py-2 rounded-md z-50
               focus:outline-none focus:ring-2 focus:ring-blue-500"
  >
    Skip to main content
  </a>
)

// Focus trap for modals
export const FocusTrap = ({
  children,
  isActive = true
}: {
  children: React.ReactNode
  isActive?: boolean
}) => {
  const firstFocusableElementRef = React.useRef<HTMLElement>(null)
  const lastFocusableElementRef = React.useRef<HTMLElement>(null)

  React.useEffect(() => {
    if (!isActive) return

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return

      if (e.shiftKey) {
        if (document.activeElement === firstFocusableElementRef.current) {
          lastFocusableElementRef.current?.focus()
          e.preventDefault()
        }
      } else {
        if (document.activeElement === lastFocusableElementRef.current) {
          firstFocusableElementRef.current?.focus()
          e.preventDefault()
        }
      }
    }

    document.addEventListener('keydown', handleTabKey)
    return () => document.removeEventListener('keydown', handleTabKey)
  }, [isActive])

  return (
    <>
      <button
        ref={firstFocusableElementRef as React.RefObject<HTMLButtonElement>}
        className="sr-only"
        tabIndex={isActive ? 0 : -1}
      />
      {children}
      <button
        ref={lastFocusableElementRef as React.RefObject<HTMLButtonElement>}
        className="sr-only"
        tabIndex={isActive ? 0 : -1}
      />
    </>
  )
}

// Accessible heading hierarchy helper
export const Heading = ({
  level,
  children,
  className = ''
}: {
  level: 1 | 2 | 3 | 4 | 5 | 6
  children: React.ReactNode
  className?: string
}) => {
  const Tag = `h${level}` as keyof JSX.IntrinsicElements

  const defaultClasses = {
    1: 'text-3xl font-bold',
    2: 'text-2xl font-bold',
    3: 'text-xl font-semibold',
    4: 'text-lg font-semibold',
    5: 'text-base font-medium',
    6: 'text-sm font-medium'
  }

  return (
    <Tag className={`${defaultClasses[level]} ${className}`}>
      {children}
    </Tag>
  )
}

// Accessible button with proper ARIA labels
export const AccessibleButton = ({
  children,
  onClick,
  disabled = false,
  ariaLabel,
  ariaDescribedBy,
  className = '',
  ...props
}: {
  children: React.ReactNode
  onClick?: () => void
  disabled?: boolean
  ariaLabel?: string
  ariaDescribedBy?: string
  className?: string
  [key: string]: any
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    aria-label={ariaLabel}
    aria-describedby={ariaDescribedBy}
    className={`focus:outline-none focus:ring-2 focus:ring-blue-500
                focus:ring-offset-2 focus:ring-offset-gray-900
                disabled:opacity-50 disabled:cursor-not-allowed
                ${className}`}
    {...props}
  >
    {children}
  </button>
)
