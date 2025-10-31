/**
 * Update: Replace encrypted credential ID in database
 */

import { config } from 'dotenv';
config();

import { prisma } from '../lib/prisma';
import { EncryptionService } from '../lib/encryption';

async function updateCredentialInDatabase() {
  try {
    console.log('🔄 Updating encrypted credential ID in database...');
    
    const USER_ID = 'cmgv0uje00006ifbc7m8ke4hv'; // service@mcp4.ai
    const OLD_CREDENTIAL_ID = 'meqbpogysziCbldi'; // The duplicate we created
    const CORRECT_CREDENTIAL_ID = 'd3v3QmPX9UruvStN'; // The original credential
    
    console.log(`👤 User: ${USER_ID}`);
    console.log(`❌ Old credential ID: ${OLD_CREDENTIAL_ID}`);
    console.log(`✅ Correct credential ID: ${CORRECT_CREDENTIAL_ID}`);
    
    // Get current user data
    const user = await prisma.user.findUnique({
      where: { id: USER_ID },
      select: { 
        fusionCredentialId: true,
        fusionCredentialName: true 
      }
    });
    
    if (user?.fusionCredentialId) {
      // Decrypt current credential to verify
      const currentDecrypted = EncryptionService.decrypt(user.fusionCredentialId);
      console.log(`\n🔍 Current encrypted credential decrypts to: ${currentDecrypted}`);
      
      if (currentDecrypted === OLD_CREDENTIAL_ID) {
        console.log(`✅ Confirmed: Database has the duplicate credential ID`);
        
        // Update with correct credential ID
        const newEncryptedCredentialId = EncryptionService.encrypt(CORRECT_CREDENTIAL_ID);
        
        await prisma.user.update({
          where: { id: USER_ID },
          data: { 
            fusionCredentialId: newEncryptedCredentialId
          }
        });
        
        console.log(`✅ Updated database with correct credential ID`);
        console.log(`   New encrypted ID: ${newEncryptedCredentialId.substring(0, 20)}...`);
        
        // Verify the update
        const updatedUser = await prisma.user.findUnique({
          where: { id: USER_ID },
          select: { fusionCredentialId: true }
        });
        
        if (updatedUser?.fusionCredentialId) {
          const verifyDecrypted = EncryptionService.decrypt(updatedUser.fusionCredentialId);
          console.log(`✅ Verification: New encrypted credential decrypts to: ${verifyDecrypted}`);
        }
        
      } else {
        console.log(`❌ Database already has different credential: ${currentDecrypted}`);
      }
    } else {
      console.log(`❌ User does not have credential ID in database`);
    }
    
  } catch (error) {
    console.error('❌ Update failed:', error);
  }
}

updateCredentialInDatabase();
