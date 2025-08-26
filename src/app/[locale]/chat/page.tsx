'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Header } from '@/components/Header'
import { Footer } from '@/components/Footer'
import { LoginRequiredLocalized } from '@/components/LoginRequiredLocalized'
import { AuthModals } from '@/components/AuthModals'
import { AnimatedBackground } from '@/components/AnimatedBackground'
import { useAuth } from '@/hooks/useAuth'
import { useState } from 'react'

export default function ChatPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const t = useTranslations('common')
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  // Redirect to dashboard if user is logged in
  useEffect(() => {
    if (user && !loading) {
      router.push('/dashboard')
    }
  }, [user, loading, router])

  // Show loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 text-white relative overflow-hidden">
        <AnimatedBackground />
        <Header transparent={true} currentPage="chat" />
        <div className="min-h-[80vh] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-400">{t('loading')}</p>
          </div>
        </div>
      </div>
    )
  }

  // Show login required if not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-950 text-white">
        {/* Full width AnimatedBackground */}
        <div className="fixed inset-0 overflow-hidden pointer-events-none">
          <AnimatedBackground />
        </div>

        <div className="relative z-10 flex flex-col min-h-screen">
          <Header
            currentPage="chat"
            onSignInClick={() => setShowSignInModal(true)}
            onSignUpClick={() => setShowSignUpModal(true)}
          />

          <div className="flex-1 max-w-7xl mx-auto px-6 py-8 w-full">
            <div className="min-h-[80vh] flex items-center justify-center">
              <LoginRequiredLocalized
                page="chat"
                onSignIn={() => setShowSignInModal(true)}
                onSignUp={() => setShowSignUpModal(true)}
              />
            </div>
          </div>

          <Footer />
        </div>

        <AuthModals
          showSignInModal={showSignInModal}
          showSignUpModal={showSignUpModal}
          onClose={() => {
            setShowSignInModal(false)
            setShowSignUpModal(false)
          }}
          onSignInSuccess={() => router.push('/dashboard')}
          onSignUpSuccess={() => router.push('/dashboard')}
          onSwitchToSignUp={() => {
            setShowSignInModal(false)
            setShowSignUpModal(true)
          }}
          onSwitchToSignIn={() => {
            setShowSignUpModal(false)
            setShowSignInModal(true)
          }}
        />
      </div>
    )
  }

  // This shouldn't be reached due to redirect above, but just in case
  return null
}
