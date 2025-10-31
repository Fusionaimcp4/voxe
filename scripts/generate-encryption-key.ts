/**
 * Generate a secure encryption key for credential storage
 */

import { EncryptionService } from '../lib/encryption';

console.log('🔐 Generating secure encryption key...');
const key = EncryptionService.generateKey();
console.log(`\n✅ Generated encryption key:`);
console.log(key);
console.log(`\n📋 Add this to your .env file:`);
console.log(`ENCRYPTION_KEY=${key}`);
console.log(`\n⚠️  IMPORTANT: Keep this key secure and never commit it to version control!`);