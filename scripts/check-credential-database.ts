/**
 * Check: Current credential ID in database
 */

import { config } from 'dotenv';
config();

import { prisma } from '../lib/prisma';
import { EncryptionService } from '../lib/encryption';

async function checkCredentialInDatabase() {
  try {
    console.log('🔍 Checking current credential ID in database...');
    
    const USER_ID = 'cmgv0uje00006ifbc7m8ke4hv'; // service@mcp4.ai
    
    // Get user's credential info
    const user = await prisma.user.findUnique({
      where: { id: USER_ID },
      select: { 
        email: true,
        fusionSubAccountId: true,
        fusionCredentialName: true,
        fusionCredentialId: true
      }
    });

    if (user) {
      console.log(`\n👤 User: ${user.email}`);
      console.log(`   fusionSubAccountId: ${user.fusionSubAccountId}`);
      console.log(`   fusionCredentialName: ${user.fusionCredentialName}`);
      
      if (user.fusionCredentialId) {
        console.log(`   fusionCredentialId (encrypted): ${user.fusionCredentialId.substring(0, 20)}...`);
        
        try {
          const decryptedCredentialId = EncryptionService.decrypt(user.fusionCredentialId);
          console.log(`   fusionCredentialId (decrypted): ${decryptedCredentialId}`);
          console.log(`\n✅ Database has credential ID: ${decryptedCredentialId}`);
        } catch (error) {
          console.log(`   ❌ Failed to decrypt: ${error}`);
        }
      } else {
        console.log(`   ❌ No credential ID in database`);
      }
    } else {
      console.log('❌ User not found');
    }
    
  } catch (error) {
    console.error('❌ Check failed:', error);
  }
}

checkCredentialInDatabase();
