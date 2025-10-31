#!/usr/bin/env tsx

/**
 * Script to start ngrok and get the public URL for n8n callbacks
 */

import { spawn } from 'child_process';

async function startNgrok() {
  console.log('🚀 Starting ngrok tunnel...');
  
  const ngrok = spawn('ngrok', ['http', '3000'], {
    stdio: ['pipe', 'pipe', 'pipe']
  });

  ngrok.stdout.on('data', (data) => {
    const output = data.toString();
    console.log('📡 Ngrok output:', output);
    
    // Look for the public URL
    const urlMatch = output.match(/https:\/\/[a-z0-9-]+\.ngrok-free\.app/);
    if (urlMatch) {
      const publicUrl = urlMatch[0];
      console.log('\n✅ Ngrok tunnel established!');
      console.log(`🌐 Public URL: ${publicUrl}`);
      console.log(`📋 API Endpoint: ${publicUrl}/api/workflow/update-id`);
      console.log('\n📝 Add this to your n8n workflow duplicator:');
      console.log(`URL: ${publicUrl}/api/workflow/update-id`);
      console.log('Method: POST');
      console.log('Headers: Content-Type: application/json');
      console.log('Body:');
      console.log(JSON.stringify({
        businessName: "{{ $json.businessName }}",
        workflowId: "{{ $json.workflowId }}",
        chatwootInboxId: "{{ $json.chatwootInboxId }}",
        chatwootWebsiteToken: "{{ $json.chatwootWebsiteToken }}"
      }, null, 2));
    }
  });

  ngrok.stderr.on('data', (data) => {
    console.error('❌ Ngrok error:', data.toString());
  });

  ngrok.on('close', (code) => {
    console.log(`🔄 Ngrok process exited with code ${code}`);
  });

  // Keep the process running
  process.on('SIGINT', () => {
    console.log('\n🛑 Stopping ngrok...');
    ngrok.kill();
    process.exit(0);
  });

  console.log('💡 Press Ctrl+C to stop ngrok');
}

startNgrok().catch(console.error);
