'use client'

import { useRouter, usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { Logo } from '@/components/Logo'

export function Footer() {
  const router = useRouter()
  const pathname = usePathname()
  const t = useTranslations('footer')

  // Detect current locale from pathname
  const currentLocale = pathname.split('/')[1]
  const isLocalized = ['en', 'it', 'es'].includes(currentLocale)
  const localePrefix = isLocalized ? `/${currentLocale}` : '/en'





  return (
    <footer className="relative z-20 border-t border-gray-800 px-6 py-12 bg-black">
      <div className="max-w-7xl mx-auto">
        <div className="grid md:grid-cols-5 gap-6 mb-8">
          <div className="md:col-span-2">
            <Logo size="sm" className="mb-4" />
            <p className="text-gray-400 text-sm">
              {t('tagline')}
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('usefulLinks')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="mailto:support@miky.ai" className="hover:text-white transition-colors">{t('contact')}</a></li>
              <li><button onClick={() => router.push(`${localePrefix}/pricing`)} className="hover:text-white transition-colors">{t('pricing')}</button></li>
              <li><button onClick={() => router.push('/admin')} className="hover:text-white transition-colors">{t('admin')}</button></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('social')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><a href="https://instagram.com/miky.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('instagram')}</a></li>
              <li><a href="https://twitter.com/mikyai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('twitter')}</a></li>
              <li><a href="https://tiktok.com/@miky.ai" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{t('tiktok')}</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-white mb-4">{t('legal')}</h4>
            <ul className="space-y-2 text-sm text-gray-400">
              <li><button onClick={() => router.push(`${localePrefix}/legal/terms`)} className="hover:text-white transition-colors">{t('termsOfService')}</button></li>
              <li><button onClick={() => router.push(`${localePrefix}/legal/privacy`)} className="hover:text-white transition-colors">{t('privacyPolicy')}</button></li>
              <li><button onClick={() => router.push(`${localePrefix}/legal/cookie`)} className="hover:text-white transition-colors">{t('cookiePolicy')}</button></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-gray-500 text-sm">
            {t('copyright')}
          </p>
          <p className="text-gray-500 text-sm">
            {t('poweredBy')} OpenAI
          </p>
        </div>
      </div>
    </footer>
  )
}
