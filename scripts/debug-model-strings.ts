import dotenv from 'dotenv';
import { getFusionModels, convertToN8nModelFormat } from '../lib/fusion-api';

// Load environment variables
dotenv.config();

async function debugModelStrings() {
  console.log('🔍 Debugging model string formats...\n');

  try {
    const models = await getFusionModels();
    
    // Find GPT-5 model
    const gpt5Model = models.find(m => m.name.includes('GPT-5'));
    
    if (!gpt5Model) {
      console.log('❌ GPT-5 model not found in active models');
      return;
    }

    console.log('📋 GPT-5 Model Details:');
    console.log(`   ID String: "${gpt5Model.id_string}"`);
    console.log(`   Name: "${gpt5Model.name}"`);
    console.log(`   Provider: "${gpt5Model.provider}"`);
    
    // Convert to n8n format
    const n8nFormat = await convertToN8nModelFormat(gpt5Model.id_string);
    console.log(`   n8n Format: "${n8nFormat}"`);
    
    // Show character-by-character analysis
    console.log('\n🔬 Character Analysis:');
    console.log(`   Length: ${n8nFormat.length}`);
    console.log(`   Characters: ${JSON.stringify(n8nFormat.split(''))}`);
    
    // Check for invisible characters
    const hasInvisibleChars = /[\u200B-\u200D\uFEFF]/.test(n8nFormat);
    console.log(`   Has invisible chars: ${hasInvisibleChars}`);
    
    // Compare with expected format
    const expectedFormat = 'OpenAI: OpenAI: GPT-5';
    console.log(`\n🎯 Comparison with expected: "${expectedFormat}"`);
    console.log(`   Exact match: ${n8nFormat === expectedFormat}`);
    console.log(`   Trimmed match: ${n8nFormat.trim() === expectedFormat.trim()}`);
    
    // Show all active models for comparison
    console.log('\n📋 All Active Models:');
    models.forEach((model, index) => {
      const converted = convertToN8nModelFormat(model.id_string);
      console.log(`   ${index + 1}. "${converted}"`);
    });

  } catch (error) {
    console.error('❌ Debug failed:', error);
  }
}

debugModelStrings();
