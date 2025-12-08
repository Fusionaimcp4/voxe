// 1. Copy workflow object from Get Template Workflow
let wf = { ...$json };

// 2. Pull payload from Webhook Trigger
const payload = $node["Webhook Trigger"].json.body;

const businessName = payload.businessName;
const apiKey = payload.apiKey;
const systemMessage = payload.systemMessage;
const chatwootBaseUrl = payload.chatwootBaseUrl; // Optional - from user config or env
const teams = payload.teams; // Optional - array of all teams with their IDs

// 3. Update workflow name
wf.name = `${businessName} demo`;

// 4. Update Webhook1 path
for (const node of wf.nodes) {
  if (node.type === 'n8n-nodes-base.webhook' && node.name === 'Webhook1') {
    node.parameters.path = businessName;
  }
}

// 5. Replace all api_access_token values
for (const node of wf.nodes) {
  if (node.type === 'n8n-nodes-base.httpRequest') {
    if (node.parameters.headerParameters?.parameters) {
      for (const header of node.parameters.headerParameters.parameters) {
        if (header.name === 'api_access_token') {
          header.value = apiKey;
        }
      }
    }
  }
}

// 5.5. Replace Chatwoot base URL in HTTP request URLs (if chatwootBaseUrl provided)
console.log('chatwootBaseUrl from payload:', chatwootBaseUrl);

if (chatwootBaseUrl) {
  // Normalize the base URL (remove trailing slash)
  const normalizedBaseUrl = chatwootBaseUrl.replace(/\/+$/, '');
  console.log('Normalized base URL:', normalizedBaseUrl);
  
  // Common hardcoded Chatwoot base URLs to replace (with protocol)
  const hardcodedBaseUrls = [
    'https://chatvoxe.mcp4.ai',
    'http://chatvoxe.mcp4.ai',
    'https://chatwoot.mcp4.ai',
    'http://chatwoot.mcp4.ai',
    'https://chatwoot.mcp4.al', // Typo variant
    'https://app.chatwoot.com',
    'http://app.chatwoot.com',
    'http://localhost:3000',
    'https://localhost:3000'
  ];
  
  for (const node of wf.nodes) {
    if (node.type === 'n8n-nodes-base.httpRequest' && node.parameters.url) {
      let url = node.parameters.url;
      console.log(`Checking node "${node.name}" with URL: ${url}`);
      
      // Check if URL is an n8n expression (starts with =)
      const isExpression = url.startsWith('=');
      let urlWithoutExpression = isExpression ? url.substring(1) : url;
      let urlChanged = false;
      
      // Replace each hardcoded base URL with the dynamic one
      for (const hardcodedUrl of hardcodedBaseUrls) {
        // Check if the URL contains this hardcoded base URL (case-insensitive)
        const lowerUrl = urlWithoutExpression.toLowerCase();
        const lowerHardcoded = hardcodedUrl.toLowerCase();
        
        if (lowerUrl.includes(lowerHardcoded)) {
          console.log(`  Found match for hardcoded URL: ${hardcodedUrl}`);
          
          // Find the actual case in the URL and replace it
          // Use a regex to match case-insensitively and replace only the base URL part
          const escapedUrl = hardcodedUrl.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          const regex = new RegExp(escapedUrl, 'gi');
          const originalUrl = urlWithoutExpression;
          urlWithoutExpression = urlWithoutExpression.replace(regex, normalizedBaseUrl);
          
          // Debug: log the replacement
          console.log(`  Replacing URL in node "${node.name}":`);
          console.log(`    Original: ${originalUrl}`);
          console.log(`    Replaced: ${urlWithoutExpression}`);
          
          urlChanged = true;
          break; // Only replace once per node
        }
      }
      
      // Update the node's URL if it was changed
      if (urlChanged) {
        node.parameters.url = isExpression ? `=${urlWithoutExpression}` : urlWithoutExpression;
        console.log(`  ✅ Updated node "${node.name}" URL to: ${node.parameters.url}`);
      } else {
        console.log(`  ⚠️ No replacement made for node "${node.name}"`);
      }
    }
  }
} else {
  console.log('⚠️ chatwootBaseUrl not provided in payload, skipping URL replacement');
}

// 6. Replace AI Agent system message
for (const node of wf.nodes) {
  if (node.name === 'AI Agent') {
    if (!node.parameters.options) node.parameters.options = {};
    node.parameters.options.systemMessage = systemMessage;
  }
}

// 7. Replace Code1 code with dynamic team IDs (if teams provided)
if (teams && Array.isArray(teams) && teams.length > 0) {
  console.log(`Replacing Code1 code with ${teams.length} teams:`, teams.map(t => `${t.name} (ID: ${t.id})`).join(', '));
  
  // Find Code1 (could be named "Code1", "Code", or similar)
  for (const node of wf.nodes) {
    // Check for Code1 by name or by type (Code node)
    const isCode1 = (
      node.name === 'Code1' || 
      node.name === 'Code' || 
      (node.type === 'n8n-nodes-base.code' && node.name.toLowerCase().includes('code1'))
    );
    
    if (isCode1) {
      console.log(`Found Code1: "${node.name}" (${node.type})`);
      
      // Build teamMap dynamically from teams array
      // Match team names (case-insensitive) to their IDs
      const teamMapEntries = teams.map(team => {
        const teamNameLower = team.name.toLowerCase();
        return `  "${teamNameLower}": ${team.id}`;
      }).join(',\n');
      
      // New code with dynamic team IDs
      const newNode1Code = `// Access raw AI output
let raw = $json.output;

// Clean up accidental \`\`\`json wrappers
if (typeof raw === "string") {
  raw = raw.replace(/\`\`\`json/g, "")
           .replace(/\`\`\`/g, "")
           .trim();
}

let parsed;
try {
  parsed = JSON.parse(raw);  // Case 2: structured JSON
} catch (e) {
  parsed = { output: raw };  // Case 1: plain text
}

// Map team names → Chatwoot IDs (using dynamic teams from payload)
const teamMap = {
${teamMapEntries}
};

const accountId = $('Edit Fields').first().json.account_id || $json.account_id;
const conversationId = $('Edit Fields').first().json.conversation_id || $json.conversation_id;

// Escalation case
if (parsed.assign) {
  parsed.team_id = teamMap[parsed.assign.toLowerCase()] || null;
  parsed.account_id = accountId;
  parsed.conversation_id = conversationId;

  // Only include assignment if team_id is valid (not null)
  if (parsed.team_id !== null) {
    return [
      {
        json: {
          mode: "reply",
          output: parsed.output,
          account_id: accountId,
          conversation_id: conversationId,
          team_id: parsed.team_id
        }
      },
      {
        json: {
          mode: "assign",
          account_id: accountId,
          conversation_id: conversationId,
          team_id: parsed.team_id
        }
      }
    ];
  } else {
    // Team not found - just reply without assignment
    console.warn(\`Team "\${parsed.assign}" not found in team map. Available teams: \${Object.keys(teamMap).join(', ')}\`);
    return [
      {
        json: {
          mode: "reply",
          output: parsed.output,
          account_id: accountId,
          conversation_id: conversationId
        }
      }
    ];
  }
}

// Normal case
return [
  {
    json: {
      mode: "reply",
      output: parsed.output,   // 👈 use "content" for Chatwoot messages
      account_id: accountId,
      conversation_id: conversationId
    }
  }
];`;
      
      // Update Code1's code
      if (node.parameters) {
        node.parameters.jsCode = newNode1Code;
        console.log(`✅ Updated Code1 code with ${teams.length} teams`);
      } else {
        console.warn(`⚠️ Code1 found but no parameters object, skipping code update`);
      }
      
      break; // Only update first matching node
    }
  }
} else {
  console.log('⚠️ teams array not provided in payload, skipping Code1 code replacement');
}

// 8. Return as a proper n8n item
return [
  {
    json: wf
  }
];

