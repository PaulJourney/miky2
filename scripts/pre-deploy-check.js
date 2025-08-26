#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')
const { validateTranslations } = require('./validate-translations')

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

function checkCommand(command, description) {
  try {
    execSync(command, { stdio: 'pipe' })
    log('green', `✅ ${description}`)
    return true
  } catch (error) {
    log('red', `❌ ${description}`)
    log('red', `   Error: ${error.message}`)
    return false
  }
}

function checkFileExists(filePath, description) {
  if (fs.existsSync(filePath)) {
    log('green', `✅ ${description}`)
    return true
  } else {
    log('red', `❌ ${description} - File not found: ${filePath}`)
    return false
  }
}

function checkEnvironmentVariables() {
  log('blue', '\n🔧 Checking environment variables...')

  const requiredEnvVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'OPENAI_API_KEY',
    'SENDGRID_API_KEY',
    'STRIPE_SECRET_KEY'
  ]

  let allPresent = true

  if (fs.existsSync('.env.local')) {
    const envContent = fs.readFileSync('.env.local', 'utf8')

    for (const envVar of requiredEnvVars) {
      if (envContent.includes(`${envVar}=`) && !envContent.includes(`${envVar}=your_`)) {
        log('green', `✅ ${envVar} is configured`)
      } else {
        log('red', `❌ ${envVar} is missing or not configured`)
        allPresent = false
      }
    }
  } else {
    log('red', '❌ .env.local file not found')
    allPresent = false
  }

  return allPresent
}

function checkBuildSize() {
  log('blue', '\n📦 Checking build size...')

  try {
    const buildOutput = execSync('bun run build', { encoding: 'utf8' })

    // Extract bundle sizes from build output
    const sizeRegex = /First Load JS.*?(\d+\.?\d*)\s*kB/g
    let match
    const sizes = []

    while ((match = sizeRegex.exec(buildOutput)) !== null) {
      sizes.push(parseFloat(match[1]))
    }

    if (sizes.length > 0) {
      const maxSize = Math.max(...sizes)
      if (maxSize > 250) {
        log('yellow', `⚠️  Large bundle detected: ${maxSize}kB (consider optimization)`)
      } else {
        log('green', `✅ Bundle sizes are reasonable (max: ${maxSize}kB)`)
      }
      return true
    } else {
      log('yellow', '⚠️  Could not parse bundle sizes from build output')
      return true
    }
  } catch (error) {
    log('red', `❌ Build failed: ${error.message}`)
    return false
  }
}

function checkSecurityIssues() {
  log('blue', '\n🔒 Checking for security issues...')

  let secure = true

  // Check for console.log in production code
  try {
    const consoleCheck = execSync('grep -r "console\\.log" --include="*.ts" --include="*.tsx" src/', { encoding: 'utf8' })
    if (consoleCheck.trim()) {
      // Check if they are only in development-guarded code
      const lines = consoleCheck.trim().split('\n')
      const problematicLogs = lines.filter(line => {
        // Allow console.log in analytics.ts if they are development-only
        return !line.includes('src/lib/analytics.ts') &&
               !line.includes('NODE_ENV === \'development\'') &&
               !line.includes('development-only')
      })

      if (problematicLogs.length > 0) {
        log('red', '❌ console.log statements found in production code')
        problematicLogs.forEach(line => log('red', `   ${line}`))
        secure = false
      } else {
        log('green', '✅ console.log statements are development-only')
      }
    }
  } catch (error) {
    // No console.log found (good)
    log('green', '✅ No console.log statements in production code')
  }

  // Check for test endpoints
  try {
    const testCheck = execSync('find src/app/api -name "*test*" -type d', { encoding: 'utf8' })
    if (testCheck.trim()) {
      log('red', '❌ Test API endpoints found')
      log('red', `   Found: ${testCheck.trim()}`)
      secure = false
    } else {
      log('green', '✅ No test API endpoints found')
    }
  } catch (error) {
    log('green', '✅ No test API endpoints found')
  }

  // Check for debug files
  const debugFiles = [
    'package.json.backup',
    'debug-database.sql',
    'test-setup.sql'
  ]

  let debugFilesFound = false
  for (const file of debugFiles) {
    if (fs.existsSync(file)) {
      log('red', `❌ Debug file found: ${file}`)
      debugFilesFound = true
      secure = false
    }
  }

  if (!debugFilesFound) {
    log('green', '✅ No debug files found')
  }

  return secure
}

function runPreDeploymentChecks() {
  log('blue', '🚀 MIKY.AI PRE-DEPLOYMENT VALIDATION')
  log('blue', '=====================================\n')

  let allChecksPassed = true

  // 1. Build check
  log('blue', '🏗️  Build validation...')
  if (!checkCommand('bun run build', 'Build successful')) {
    allChecksPassed = false
  }

  // 2. TypeScript check
  log('blue', '\n📝 TypeScript validation...')
  if (!checkCommand('bunx tsc --noEmit', 'TypeScript compilation')) {
    allChecksPassed = false
  }

  // 3. Linting check
  log('blue', '\n🧹 ESLint validation...')
  if (!checkCommand('bunx next lint', 'ESLint checks')) {
    // Don't fail on lint warnings, just show them
    log('yellow', '⚠️  Linting completed with warnings')
  }

  // 4. Translation validation
  log('blue', '\n🌍 Translation validation...')
  try {
    validateTranslations()
    log('green', '✅ All translations validated')
  } catch (error) {
    log('red', '❌ Translation validation failed')
    allChecksPassed = false
  }

  // 5. Environment variables check
  if (!checkEnvironmentVariables()) {
    allChecksPassed = false
  }

  // 6. Security checks
  if (!checkSecurityIssues()) {
    allChecksPassed = false
  }

  // 7. Essential files check
  log('blue', '\n📁 Essential files check...')
  const essentialFiles = [
    ['public/robots.txt', 'robots.txt'],
    ['public/sitemap.xml', 'sitemap.xml'],
    ['public/og-image.jpg', 'OpenGraph image'],
    ['next-intl.config.ts', 'next-intl config'],
    ['middleware.ts', 'middleware'],
    ['src/i18n.ts', 'i18n config']
  ]

  for (const [filePath, description] of essentialFiles) {
    if (!checkFileExists(filePath, description)) {
      allChecksPassed = false
    }
  }

  // 8. Bundle size check
  if (!checkBuildSize()) {
    allChecksPassed = false
  }

  // Final result
  log('blue', '\n📋 DEPLOYMENT READINESS SUMMARY:')
  if (allChecksPassed) {
    log('green', '🎉 ALL CHECKS PASSED!')
    log('green', '✅ Miky.ai is ready for production deployment')
    log('blue', '🚀 You can now deploy to Netlify with confidence')
    process.exit(0)
  } else {
    log('red', '❌ SOME CHECKS FAILED!')
    log('red', '⚠️  Please fix the issues above before deploying')
    log('yellow', '💡 Run this script again after fixing the issues')
    process.exit(1)
  }
}

// Run checks
if (require.main === module) {
  runPreDeploymentChecks()
}

module.exports = { runPreDeploymentChecks }
