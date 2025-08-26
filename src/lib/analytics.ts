'use client'

// Analytics interface for production monitoring
interface AnalyticsEvent {
  name: string
  properties?: Record<string, any>
  timestamp?: Date
  userId?: string
}

interface PerformanceMetric {
  name: string
  value: number
  unit: 'ms' | 'bytes' | 'count'
  timestamp?: Date
}

class Analytics {
  private isProduction = process.env.NODE_ENV === 'production'
  private queue: AnalyticsEvent[] = []
  private performanceQueue: PerformanceMetric[] = []

  // Track user events
  track(event: AnalyticsEvent) {
    if (!this.isProduction) {
      // Development-only logging
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 Analytics (dev):', event)
      }
      return
    }

    // Add timestamp
    const eventWithTimestamp = {
      ...event,
      timestamp: new Date()
    }

    this.queue.push(eventWithTimestamp)
    this.flush()
  }

  // Track performance metrics
  trackPerformance(metric: PerformanceMetric) {
    if (!this.isProduction) {
      // Development-only logging
      if (process.env.NODE_ENV === 'development') {
        console.log('⚡ Performance (dev):', metric)
      }
      return
    }

    const metricWithTimestamp = {
      ...metric,
      timestamp: new Date()
    }

    this.performanceQueue.push(metricWithTimestamp)
    this.flushPerformance()
  }

  // Track page views
  trackPageView(path: string, locale?: string) {
    this.track({
      name: 'page_view',
      properties: {
        path,
        locale,
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString()
      }
    })
  }

  // Track errors
  trackError(error: Error, context?: Record<string, any>) {
    this.track({
      name: 'error',
      properties: {
        message: error.message,
        stack: error.stack,
        context,
        url: window.location.href,
        userAgent: navigator.userAgent
      }
    })
  }

  // Track user interactions
  trackInteraction(action: string, element: string, properties?: Record<string, any>) {
    this.track({
      name: 'user_interaction',
      properties: {
        action,
        element,
        ...properties,
        url: window.location.href
      }
    })
  }

  // Track API calls
  trackApiCall(endpoint: string, method: string, duration: number, status: number) {
    this.trackPerformance({
      name: 'api_call_duration',
      value: duration,
      unit: 'ms'
    })

    this.track({
      name: 'api_call',
      properties: {
        endpoint,
        method,
        duration,
        status,
        success: status >= 200 && status < 400
      }
    })
  }

  // Flush events to external service (placeholder)
  private flush() {
    if (this.queue.length === 0) return

    // In production, send to analytics service
    // Example: Google Analytics, PostHog, Mixpanel, etc.

    if (this.isProduction) {
      // Placeholder for actual analytics service integration
      // fetch('/api/analytics', {
      //   method: 'POST',
      //   body: JSON.stringify(this.queue)
      // })
    }

    this.queue = []
  }

  // Flush performance metrics
  private flushPerformance() {
    if (this.performanceQueue.length === 0) return

    if (this.isProduction) {
      // Send performance metrics to monitoring service
      // Example: New Relic, DataDog, etc.
    }

    this.performanceQueue = []
  }

  // Track Core Web Vitals
  trackWebVitals() {
    if (typeof window === 'undefined') return

    // Largest Contentful Paint
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.trackPerformance({
          name: 'largest_contentful_paint',
          value: entry.startTime,
          unit: 'ms'
        })
      }
    }).observe({ entryTypes: ['largest-contentful-paint'] })

    // First Input Delay
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        this.trackPerformance({
          name: 'first_input_delay',
          value: (entry as any).processingStart - entry.startTime,
          unit: 'ms'
        })
      }
    }).observe({ entryTypes: ['first-input'] })

    // Cumulative Layout Shift
    let cumulativeLayoutShift = 0
    new PerformanceObserver((entryList) => {
      for (const entry of entryList.getEntries()) {
        if (!(entry as any).hadRecentInput) {
          cumulativeLayoutShift += (entry as any).value
        }
      }
      this.trackPerformance({
        name: 'cumulative_layout_shift',
        value: cumulativeLayoutShift,
        unit: 'count'
      })
    }).observe({ entryTypes: ['layout-shift'] })
  }
}

// Singleton instance
export const analytics = new Analytics()

// Hook for React components
export const useAnalytics = () => {
  const trackEvent = (name: string, properties?: Record<string, any>) => {
    analytics.track({ name, properties })
  }

  const trackClick = (element: string, properties?: Record<string, any>) => {
    analytics.trackInteraction('click', element, properties)
  }

  const trackFormSubmit = (formName: string, properties?: Record<string, any>) => {
    analytics.trackInteraction('form_submit', formName, properties)
  }

  return {
    trackEvent,
    trackClick,
    trackFormSubmit,
    trackPageView: analytics.trackPageView.bind(analytics),
    trackError: analytics.trackError.bind(analytics)
  }
}

// Error boundary integration
export const trackErrorBoundary = (error: Error, errorInfo: any) => {
  analytics.trackError(error, {
    errorBoundary: true,
    componentStack: errorInfo.componentStack
  })
}
