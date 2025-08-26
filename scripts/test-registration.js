#!/usr/bin/env node

/**
 * Test script for Miky.ai Registration System
 * Run with: node scripts/test-registration.js
 */

const https = require('https');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Configuration
const BASE_URL = process.env.APP_BASE_URL || 'http://localhost:3000';
const API_ENDPOINTS = {
  systemCheck: '/api/auth/system-check',
  signup: '/api/auth/signup',
  sendVerification: '/api/auth/send-verification',
  notifyAdmin: '/api/auth/notify-admin'
};

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function checkEndpoint(endpoint, method = 'GET', body = null) {
  return new Promise((resolve) => {
    const url = new URL(BASE_URL + endpoint);
    const options = {
      method,
      headers: {
        'Content-Type': 'application/json',
      }
    };

    if (process.env.NODE_ENV === 'development') {
      options.headers['X-Admin-Check'] = process.env.ADMIN_CHECK_SECRET || 'dev-check';
    }

    const req = (url.protocol === 'https:' ? https : require('http')).request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data);
          resolve({ status: res.statusCode, data: json });
        } catch (e) {
          resolve({ status: res.statusCode, data: data });
        }
      });
    });

    req.on('error', (e) => {
      resolve({ status: 0, error: e.message });
    });

    if (body) {
      req.write(JSON.stringify(body));
    }

    req.end();
  });
}

async function runTests() {
  log('\n🔍 MIKY.AI REGISTRATION SYSTEM TEST\n', 'cyan');
  log('=' .repeat(50));

  // Test 1: System Check
  log('\n📊 Test 1: System Health Check', 'blue');
  const systemCheck = await checkEndpoint(API_ENDPOINTS.systemCheck);

  if (systemCheck.status === 200) {
    log('✅ System check endpoint is accessible', 'green');

    const { status, health, checks, recommendations } = systemCheck.data;

    log(`\nOverall Status: ${status}`, status.includes('operational') ? 'green' : 'yellow');

    log('\n🗄️  Database:', 'cyan');
    log(`  - Connection: ${checks.supabase.connection ? '✅' : '❌'}`);
    log(`  - Profiles Table: ${checks.supabase.profiles_table ? '✅' : '❌'}`);
    log(`  - RLS Policies: ${checks.supabase.rls_policies ? '✅' : '❌'}`);
    log(`  - Trigger: ${checks.supabase.trigger_exists ? '✅' : '❌'}`);

    log('\n📧 Email System:', 'cyan');
    log(`  - SendGrid Configured: ${checks.email.sendgrid_configured ? '✅' : '❌'}`);
    log(`  - From Email: ${checks.email.from_email}`);

    if (recommendations.length > 0) {
      log('\n⚠️  Recommendations:', 'yellow');
      recommendations.forEach(rec => log(`  - ${rec}`));
    }
  } else if (systemCheck.status === 401) {
    log('⚠️  System check requires authentication (this is normal in production)', 'yellow');
  } else {
    log('❌ System check failed', 'red');
    console.log(systemCheck);
  }

  // Test 2: API Endpoints
  log('\n\n📡 Test 2: API Endpoints', 'blue');

  const endpoints = [
    { name: 'Send Verification', url: API_ENDPOINTS.sendVerification, method: 'POST' },
    { name: 'Notify Admin', url: API_ENDPOINTS.notifyAdmin, method: 'POST' }
  ];

  for (const endpoint of endpoints) {
    const result = await checkEndpoint(endpoint.url, endpoint.method);
    if (result.status === 400) {
      log(`✅ ${endpoint.name}: Endpoint exists (returns 400 for missing data)`, 'green');
    } else if (result.status === 200) {
      log(`✅ ${endpoint.name}: Endpoint is functional`, 'green');
    } else {
      log(`❌ ${endpoint.name}: Unexpected status ${result.status}`, 'red');
    }
  }

  // Test 3: Registration Flow Simulation
  log('\n\n🧪 Test 3: Registration Flow Simulation', 'blue');

  rl.question('Do you want to test actual registration? (y/n): ', async (answer) => {
    if (answer.toLowerCase() === 'y') {
      rl.question('Enter test email: ', async (email) => {
        rl.question('Enter test password (min 6 chars): ', async (password) => {

          log('\n📝 Attempting registration...', 'cyan');

          // This would need to go through the actual frontend
          // as the signup flow uses Supabase client
          log('Note: Full registration test requires frontend interaction', 'yellow');
          log('Please test manually through the UI with these credentials:', 'yellow');
          log(`  Email: ${email}`);
          log(`  Password: ${'*'.repeat(password.length)}`);

          // Test email endpoints with mock data
          const mockUserId = 'test-' + Date.now();

          log('\n📧 Testing email endpoints with mock data...', 'cyan');

          // Test verification email
          const verifyResult = await checkEndpoint(
            API_ENDPOINTS.sendVerification,
            'POST',
            {
              email: email,
              fullName: 'Test User',
              userId: mockUserId
            }
          );

          if (verifyResult.status === 200) {
            log('✅ Verification email endpoint responded successfully', 'green');
          } else {
            log(`⚠️  Verification email endpoint returned ${verifyResult.status}`, 'yellow');
          }

          // Test admin notification
          const adminResult = await checkEndpoint(
            API_ENDPOINTS.notifyAdmin,
            'POST',
            {
              email: email,
              fullName: 'Test User',
              userId: mockUserId,
              referralCode: 'TEST123'
            }
          );

          if (adminResult.status === 200) {
            log('✅ Admin notification endpoint responded successfully', 'green');
          } else {
            log(`⚠️  Admin notification endpoint returned ${adminResult.status}`, 'yellow');
          }

          rl.close();
          printSummary();
        });
      });
    } else {
      rl.close();
      printSummary();
    }
  });
}

function printSummary() {
  log('\n' + '=' .repeat(50));
  log('\n📋 TEST SUMMARY\n', 'cyan');

  log('Next Steps:', 'yellow');
  log('1. If any ❌ items above, run the SQL migration script');
  log('2. Configure SendGrid API key in .env.local');
  log('3. Test actual registration through the UI');
  log('4. Check email delivery (user confirmation + admin notification)');
  log('5. Verify profile creation in Supabase dashboard');

  log('\n✨ Test complete!', 'green');
  process.exit(0);
}

// Run tests
runTests().catch(error => {
  log(`\n❌ Test failed with error: ${error.message}`, 'red');
  process.exit(1);
});
