'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/Header'
import { AuthModals } from '@/components/AuthModals'
import { useRouter } from 'next/navigation'

export default function TermsOfServicePage() {
  const t = useTranslations('legal.terms')
  const router = useRouter()
  const [showSignInModal, setShowSignInModal] = useState(false)
  const [showSignUpModal, setShowSignUpModal] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <Header
        onSignInClick={() => setShowSignInModal(true)}
        onSignUpClick={() => setShowSignUpModal(true)}
      />

      <main className="max-w-4xl mx-auto p-6">
        <div className="prose prose-invert max-w-none">
          <h1 className="text-3xl font-bold mb-8 text-white">{t('title')}</h1>
          <p className="text-xs text-gray-400 mb-8">{t('lastUpdated')}</p>

          <div className="space-y-8 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('acceptanceOfTerms.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('acceptanceOfTerms.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('platformDescription.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('platformDescription.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('aiDisclaimer.title')}</h2>
              <p className="text-red-400 font-semibold mb-4">
                {t('aiDisclaimer.criticalDisclaimer')}
              </p>
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-4">
                <p className="text-gray-300">
                  {t('aiDisclaimer.content')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('referralProgram.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('referralProgram.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('oceanCleanup.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('oceanCleanup.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('paymentTerms.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('paymentTerms.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('userResponsibilities.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('userResponsibilities.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('intellectualProperty.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('intellectualProperty.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('limitationOfLiability.title')}</h2>
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-4">
                <p className="text-gray-300">
                  {t('limitationOfLiability.content')}
                </p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('indemnification.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('indemnification.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('termination.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('termination.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('governingLaw.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('governingLaw.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('modifications.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('modifications.content')}
              </p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('contact.title')}</h2>
              <p className="text-gray-300">
                {t('contact.content')}
              </p>
            </section>
          </div>
        </div>
      </main>

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
