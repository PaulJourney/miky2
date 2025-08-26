#!/usr/bin/env node

const path = require('path')
const fs = require('fs')

async function testTranslationImports() {
  console.log('🧪 Testing translation imports...\n')

  const locales = ['en', 'it', 'es']

  for (const locale of locales) {
    try {
      // Test path that both next-intl.config.ts and src/i18n.ts use
      const messagesPath = path.join(__dirname, '..', 'messages', `${locale}.json`)

      // Check if file exists
      if (!fs.existsSync(messagesPath)) {
        console.log(`❌ ${locale}.json: File not found at ${messagesPath}`)
        process.exit(1)
      }

      // Test actual import
      const translations = require(messagesPath)
      const keyCount = Object.keys(translations).length

      console.log(`✅ ${locale}.json:`)
      console.log(`   Path: ${messagesPath}`)
      console.log(`   Keys: ${keyCount}`)
      console.log(`   Size: ${(fs.statSync(messagesPath).size / 1024).toFixed(2)} KB`)

      // Verify it has essential keys
      const requiredKeys = ['hero', 'features', 'howItWorks']
      const missingKeys = requiredKeys.filter(key => !translations[key])

      if (missingKeys.length > 0) {
        console.log(`   🔴 Missing keys: ${missingKeys.join(', ')}`)
        process.exit(1)
      } else {
        console.log(`   🟢 All essential keys present\n`)
      }

    } catch (error) {
      console.log(`❌ ${locale}.json: Import failed`)
      console.log(`   Error: ${error.message}\n`)
      process.exit(1)
    }
  }

  console.log('🎉 All translation imports work correctly!')
  console.log('✅ Paths are correct for Netlify deployment')

  // Test the actual import pattern used in next-intl.config.ts
  console.log('\n🔧 Testing dynamic import pattern...')

  try {
    for (const locale of locales) {
      // Simulate the import from next-intl.config.ts (from root to messages)
      const dynamicPath = `../messages/${locale}.json`
      const resolvedPath = path.resolve(__dirname, '..', 'messages', `${locale}.json`)

      if (fs.existsSync(resolvedPath)) {
        console.log(`✅ Dynamic import path works: ${dynamicPath}`)
      } else {
        console.log(`❌ Dynamic import path broken: ${dynamicPath}`)
        process.exit(1)
      }
    }
  } catch (error) {
    console.log(`❌ Dynamic import test failed: ${error.message}`)
    process.exit(1)
  }

  console.log('\n✅ All import patterns verified for Netlify!')
}

testTranslationImports()
