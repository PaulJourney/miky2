'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/Logo'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { Header } from '@/components/Header'
import { AuthModals } from '@/components/AuthModals'
import { useRouter } from 'next/navigation'

export default function PrivacyPolicyPage() {
  const t = useTranslations('legal.privacy')
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
          <div className="space-y-8 text-sm leading-relaxed">
            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('introduction.title')}</h2>
              <p className="text-gray-300 mb-4">
                {t('introduction.content')}
              </p>
              <div className="bg-blue-900/20 border border-blue-600/30 rounded-lg p-4 mb-4">
                <h3 className="text-blue-400 font-semibold mb-2">{t('keyPrinciples.title')}</h3>
                <ul className="list-disc list-inside text-gray-300 space-y-1">
                  <li>{t('keyPrinciples.transparency')}</li>
                  <li>{t('keyPrinciples.minimal')}</li>
                  <li>{t('keyPrinciples.security')}</li>
                  <li>{t('keyPrinciples.control')}</li>
                  <li>{t('keyPrinciples.compliance')}</li>
                </ul>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('informationCollected.title')}</h2>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('informationCollected.personalInfo.title')}</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                <li>{t('informationCollected.personalInfo.account')}</li>
                <li>{t('informationCollected.personalInfo.payment')}</li>
                <li>{t('informationCollected.personalInfo.profile')}</li>
                <li>{t('informationCollected.personalInfo.contact')}</li>
                <li>{t('informationCollected.personalInfo.referral')}</li>
              </ul>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('informationCollected.aiInteraction.title')}</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                <li>{t('informationCollected.aiInteraction.inputs')}</li>
                <li>{t('informationCollected.aiInteraction.responses')}</li>
                <li>{t('informationCollected.aiInteraction.metadata')}</li>
                <li>{t('informationCollected.aiInteraction.patterns')}</li>
                <li>{t('informationCollected.aiInteraction.performance')}</li>
              </ul>
              <div className="bg-red-900/20 border border-red-600/30 rounded-lg p-4 mb-4">
                <p className="text-red-400">
                  {t('informationCollected.aiInteraction.warning')}
                </p>
              </div>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('informationCollected.automaticInfo.title')}</h3>
              <ul className="list-disc list-inside text-gray-300 mb-4 space-y-1">
                <li>{t('informationCollected.automaticInfo.device')}</li>
                <li>{t('informationCollected.automaticInfo.usage')}</li>
                <li>{t('informationCollected.automaticInfo.technical')}</li>
                <li>{t('informationCollected.automaticInfo.location')}</li>
              </ul>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('howWeUse.title')}</h2>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('howWeUse.primaryService.title')}</h3>
              <p className="text-gray-300 mb-4">{t('howWeUse.primaryService.content')}</p>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('howWeUse.aiImprovement.title')}</h3>
              <p className="text-gray-300 mb-4">{t('howWeUse.aiImprovement.content')}</p>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('howWeUse.networkMarketing.title')}</h3>
              <p className="text-gray-300 mb-4">{t('howWeUse.networkMarketing.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('informationSharing.title')}</h2>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('informationSharing.serviceProviders.title')}</h3>
              <p className="text-gray-300 mb-4">{t('informationSharing.serviceProviders.content')}</p>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('informationSharing.legalRequirements.title')}</h3>
              <p className="text-gray-300 mb-4">{t('informationSharing.legalRequirements.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('dataSecurity.title')}</h2>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('dataSecurity.technicalSafeguards.title')}</h3>
              <p className="text-gray-300 mb-4">{t('dataSecurity.technicalSafeguards.content')}</p>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('dataSecurity.organizationalMeasures.title')}</h3>
              <p className="text-gray-300 mb-4">{t('dataSecurity.organizationalMeasures.content')}</p>

              <div className="bg-orange-900/20 border border-orange-600/30 rounded-lg p-4 mb-4">
                <p className="text-orange-400">{t('dataSecurity.limitations')}</p>
              </div>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('privacyRights.title')}</h2>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('privacyRights.accountManagement.title')}</h3>
              <p className="text-gray-300 mb-4">{t('privacyRights.accountManagement.content')}</p>

              <h3 className="text-lg font-semibold mb-3 text-blue-400">{t('privacyRights.regionalRights.title')}</h3>
              <p className="text-gray-300 mb-4">{t('privacyRights.regionalRights.ccpa')}</p>
              <p className="text-gray-300 mb-4">{t('privacyRights.regionalRights.gdpr')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('dataRetention.title')}</h2>
              <p className="text-gray-300 mb-4">{t('dataRetention.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('internationalTransfers.title')}</h2>
              <p className="text-gray-300 mb-4">{t('internationalTransfers.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('childrenPrivacy.title')}</h2>
              <p className="text-gray-300 mb-4">{t('childrenPrivacy.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('policyUpdates.title')}</h2>
              <p className="text-gray-300 mb-4">{t('policyUpdates.content')}</p>
            </section>

            <section>
              <h2 className="text-xl font-semibold mb-4 text-white">{t('contact.title')}</h2>
              <p className="text-gray-300 mb-4">{t('contact.content')}</p>
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
