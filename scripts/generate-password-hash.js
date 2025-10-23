#!/usr/bin/env node

/**
 * Generate bcrypt password hashes for database updates
 * Usage: node generate-password-hash.js [password]
 * 
 * Example: node generate-password-hash.js mySecurePassword123
 */

const bcrypt = require('bcryptjs');

const password = process.argv[2] || 'password123';
const saltRounds = 10;

async function generateHash() {
  try {
    const hash = await bcrypt.hash(password, saltRounds);
    
    console.log('\n='.repeat(60));
    console.log('🔐 Password Hash Generated');
    console.log('='.repeat(60));
    console.log('\nOriginal Password:', password);
    console.log('\nBcrypt Hash:');
    console.log(hash);
    console.log('\n📋 SQL Update Example (Super Admin):');
    console.log(`UPDATE super_admins SET password = '${hash}', updated_at = NOW() WHERE email = 'your@email.com';`);
    console.log('\n📋 SQL Update Example (Tenant User):');
    console.log(`UPDATE users SET password = '${hash}', updated_at = NOW() WHERE email = 'user@email.com';`);
    console.log('\n' + '='.repeat(60) + '\n');
    
    // Test the hash
    const isValid = await bcrypt.compare(password, hash);
    console.log('✅ Hash verification:', isValid ? 'PASSED' : 'FAILED');
    console.log();
  } catch (error) {
    console.error('❌ Error generating hash:', error.message);
    process.exit(1);
  }
}

generateHash();

