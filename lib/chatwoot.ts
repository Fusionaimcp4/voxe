export interface ChatwootInboxResponse {
  inbox_id: number;
  website_token: string;
}

export async function createWebsiteInbox(name: string, demoUrl: string): Promise<ChatwootInboxResponse> {
  const base = process.env.CHATWOOT_BASE_URL;
  const accountId = process.env.CHATWOOT_ACCOUNT_ID;
  const token = process.env.CHATWOOT_API_KEY;

  if (!base || !accountId || !token) {
    throw new Error('Missing Chatwoot environment variables: CHATWOOT_BASE_URL, CHATWOOT_ACCOUNT_ID, CHATWOOT_API_KEY');
  }

  const url = `${base}/api/v1/accounts/${accountId}/inboxes`;
  const payload = {
    name: `${name} Demo`,
    channel: {
      type: 'web_widget',
      website_url: demoUrl
    }
  };

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'api_access_token': token,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Chatwoot inbox create failed: ${res.status} ${res.statusText} - ${errorText}`);
    }

    const data = await res.json();
    
    return {
      inbox_id: data.id,
      website_token: data.website_token
    };
  } catch (error) {
    console.error('Chatwoot API error:', error);
    throw new Error(`Chatwoot inbox create failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}
