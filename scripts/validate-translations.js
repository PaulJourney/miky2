#!/usr/bin/env node

const fs = require('fs')
const path = require('path')

// Colors for console output
const colors = {
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  reset: '\x1b[0m'
}

function log(color, message) {
  console.log(`${colors[color]}${message}${colors.reset}`)
}

function loadTranslations(locale) {
  try {
    const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`)
    return JSON.parse(fs.readFileSync(filePath, 'utf8'))
  } catch (error) {
    log('red', `❌ Error loading ${locale}.json: ${error.message}`)
    return null
  }
}

function flattenObject(obj, prefix = '') {
  const flattened = {}

  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const newKey = prefix ? `${prefix}.${key}` : key

      if (typeof obj[key] === 'object' && obj[key] !== null) {
        Object.assign(flattened, flattenObject(obj[key], newKey))
      } else {
        flattened[newKey] = obj[key]
      }
    }
  }

  return flattened
}

function validateTranslations() {
  log('blue', '🔍 Starting translation validation...\n')

  const locales = ['en', 'it', 'es']
  const translations = {}

  // Load all translation files
  for (const locale of locales) {
    const data = loadTranslations(locale)
    if (!data) {
      log('red', `❌ Failed to load translations for ${locale}`)
      process.exit(1)
    }
    translations[locale] = flattenObject(data)
  }

  const baseLocale = 'en'
  const baseKeys = Object.keys(translations[baseLocale])

  log('green', `✅ Loaded translations for ${locales.join(', ')}`)
  log('blue', `📊 Base locale (${baseLocale}) has ${baseKeys.length} keys\n`)

  let hasErrors = false
  let totalMissing = 0

  // Check each locale against base
  for (const locale of locales) {
    if (locale === baseLocale) continue

    log('yellow', `🔍 Validating ${locale}...`)

    const currentKeys = Object.keys(translations[locale])
    const missingKeys = baseKeys.filter(key => !currentKeys.includes(key))
    const extraKeys = currentKeys.filter(key => !baseKeys.includes(key))

    if (missingKeys.length > 0) {
      hasErrors = true
      totalMissing += missingKeys.length
      log('red', `  ❌ Missing ${missingKeys.length} keys:`)
      missingKeys.slice(0, 10).forEach(key => {
        log('red', `    - ${key}`)
      })
      if (missingKeys.length > 10) {
        log('red', `    ... and ${missingKeys.length - 10} more`)
      }
    }

    if (extraKeys.length > 0) {
      log('yellow', `  ⚠️  Extra ${extraKeys.length} keys (not in base):`)
      extraKeys.slice(0, 5).forEach(key => {
        log('yellow', `    + ${key}`)
      })
      if (extraKeys.length > 5) {
        log('yellow', `    ... and ${extraKeys.length - 5} more`)
      }
    }

    if (missingKeys.length === 0 && extraKeys.length === 0) {
      log('green', `  ✅ Perfect match with base locale`)
    }

    // Check for empty values
    const emptyValues = currentKeys.filter(key =>
      !translations[locale][key] ||
      translations[locale][key].trim() === ''
    )

    if (emptyValues.length > 0) {
      hasErrors = true
      log('red', `  ❌ Empty values (${emptyValues.length}):`)
      emptyValues.slice(0, 5).forEach(key => {
        log('red', `    - ${key}`)
      })
    }

    log('blue', `  📊 Total keys: ${currentKeys.length}`)
    console.log()
  }

  // Summary
  log('blue', '📋 VALIDATION SUMMARY:')
  if (hasErrors) {
    log('red', `❌ Validation failed with ${totalMissing} missing translations`)
    log('yellow', '⚠️  Please fix translation issues before deployment')
    process.exit(1)
  } else {
    log('green', '✅ All translations are complete and valid!')
    log('green', '🚀 Ready for deployment')
  }

  // File size check
  log('blue', '\n📁 File sizes:')
  for (const locale of locales) {
    const filePath = path.join(__dirname, '..', 'messages', `${locale}.json`)
    const stats = fs.statSync(filePath)
    const sizeKB = (stats.size / 1024).toFixed(2)
    log('blue', `  ${locale}.json: ${sizeKB} KB`)
  }
}

// Run validation
if (require.main === module) {
  validateTranslations()
}

module.exports = { validateTranslations }
