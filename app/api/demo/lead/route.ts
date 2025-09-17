import { NextRequest, NextResponse } from 'next/server';

// Types
interface LeadData {
  name: string;
  email: string;
  company: string;
  phone?: string;
  consent?: boolean;
}

interface DemoData {
  slug: string;
  business_url: string;
  demo_url?: string;
  system_message_file?: string;
  inbox_id?: number;
}

interface LeadRequest {
  lead: LeadData;
  demo: DemoData;
}

interface ChatwootContact {
  id: number;
  name: string;
  email: string;
  phone_number?: string;
  identifier?: string;
  custom_attributes?: Record<string, any>;
}

// Chatwoot API configuration
const CW_BASE = process.env.CHATWOOT_BASE_URL;
const CW_ACCOUNT_ID = process.env.CHATWOOT_ACCOUNT_ID;
const CW_API_TOKEN = process.env.CHATWOOT_API_KEY;

// Check if Chatwoot is configured
const isChatwootConfigured = !!(CW_BASE && CW_ACCOUNT_ID && CW_API_TOKEN);

if (!isChatwootConfigured) {
  console.warn('Chatwoot environment variables not configured. Running in mock mode.');
}

// Helper function to make Chatwoot API calls
async function chatwootRequest(method: string, path: string, body?: any) {
  const url = `${CW_BASE}${path}`;
  const headers: Record<string, string> = {
    'api_access_token': CW_API_TOKEN!,
    'Content-Type': 'application/json',
  };

  const options: RequestInit = {
    method,
    headers,
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  const response = await fetch(url, options);
  
  if (!response.ok) {
    const errorText = await response.text().catch(() => '');
    throw new Error(`Chatwoot API error: ${response.status} ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

// Search for existing contact by email
async function searchContactByEmail(email: string): Promise<ChatwootContact | null> {
  try {
    // Use the contacts list endpoint since search endpoint returns 404
    const response = await chatwootRequest('GET', `/api/v1/accounts/${CW_ACCOUNT_ID}/contacts`);
    
    // Handle different response structures
    const contacts = response.payload || response || [];
    
    if (Array.isArray(contacts) && contacts.length > 0) {
      // Filter by exact email match
      const exactMatch = contacts.find((contact: any) => 
        contact.email && contact.email.toLowerCase() === email.toLowerCase()
      );
      return exactMatch || null;
    }
    
    return null;
  } catch (error) {
    console.warn('Contact search failed, will create new contact:', error);
    return null;
  }
}

// Create new contact
async function createContact(lead: LeadData, demo: DemoData): Promise<ChatwootContact> {
  const timestamp = new Date().toISOString();
  const identifier = `demo_${demo.slug}_${Date.now()}`;
  
  // Validate and format phone number for E.164
  let phoneNumber = undefined;
  if (lead.phone && lead.phone.trim()) {
    // Basic E.164 validation - must start with + and have 10-15 digits
    const phone = lead.phone.trim();
    if (/^\+[1-9]\d{9,14}$/.test(phone)) {
      phoneNumber = phone;
    } else {
      console.warn(`Invalid phone number format: ${phone}. Skipping phone number.`);
    }
  }
  
  const contactData = {
    name: lead.name,
    email: lead.email,
    phone_number: phoneNumber,
    identifier,
    additional_attributes: {
      type: "company",
      name: lead.company, // Use company name from form input
    },
    custom_attributes: {
      source: 'demo_page',
      consent: lead.consent || false,
      demo_slug: demo.slug,
      business_url: demo.business_url,
      demo_url: demo.demo_url || '',
      system_message_file: demo.system_message_file || '',
      created_at: timestamp,
    }
  };

  const response = await chatwootRequest('POST', `/api/v1/accounts/${CW_ACCOUNT_ID}/contacts`, contactData);
  // Chatwoot returns contact data nested under payload.contact
  return response.payload?.contact || response;
}

// Update existing contact
async function updateContact(contactId: number, lead: LeadData, demo: DemoData): Promise<ChatwootContact> {
  const timestamp = new Date().toISOString();
  
  // Validate and format phone number for E.164
  let phoneNumber = undefined;
  if (lead.phone && lead.phone.trim()) {
    const phone = lead.phone.trim();
    if (/^\+[1-9]\d{9,14}$/.test(phone)) {
      phoneNumber = phone;
    } else {
      console.warn(`Invalid phone number format: ${phone}. Skipping phone number.`);
    }
  }
  
  const updateData = {
    name: lead.name,
    phone_number: phoneNumber,
    additional_attributes: {
      type: "company",
      name: lead.company, // Use company name from form input
    },
    custom_attributes: {
      demo_slug: demo.slug,
      business_url: demo.business_url,
      demo_url: demo.demo_url || '',
      system_message_file: demo.system_message_file || '',
      last_demo_created_at: timestamp,
    }
  };

  const response = await chatwootRequest('PUT', `/api/v1/accounts/${CW_ACCOUNT_ID}/contacts/${contactId}`, updateData);
  // Chatwoot returns contact data nested under payload.contact
  return response.payload?.contact || response;
}

// Associate contact with inbox
async function associateContactWithInbox(contactId: number, inboxId: number, demo: DemoData): Promise<void> {
  try {
    const sourceId = `demo_${demo.slug}_${Date.now()}`;
    
    await chatwootRequest('POST', `/api/v1/accounts/${CW_ACCOUNT_ID}/contacts/${contactId}/contact_inboxes`, {
      inbox_id: inboxId,
      source_id: sourceId
    });
  } catch (error) {
    // If association already exists (422/409), treat as success
    if (error instanceof Error && (error.message.includes('422') || error.message.includes('409'))) {
      console.log('Contact already associated with inbox, treating as success');
      return;
    }
    throw error;
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: LeadRequest = await request.json();
    const { lead, demo } = body;

    // Validate required fields
    if (!lead.email || !lead.name || !lead.company) {
      return NextResponse.json(
        { error: 'Email, name, and company are required' },
        { status: 400 }
      );
    }

    if (!demo.slug || !demo.business_url) {
      return NextResponse.json(
        { error: 'Demo slug and business URL are required' },
        { status: 400 }
      );
    }

    // If Chatwoot is not configured, return mock response
    if (!isChatwootConfigured) {
      console.log('Mock mode: Contact would be created/updated for:', lead.email);
      return NextResponse.json({
        status: 'ok',
        contact_id: Math.floor(Math.random() * 10000) + 1,
        associated_inbox_id: demo.inbox_id || null,
        is_new_contact: true,
        mock_mode: true
      });
    }

    // Search for existing contact
    let contact = await searchContactByEmail(lead.email);
    let isNewContact = false;

    if (contact) {
      // Update existing contact
      contact = await updateContact(contact.id, lead, demo);
    } else {
      // Create new contact
      contact = await createContact(lead, demo);
      isNewContact = true;
    }

    // Associate with inbox if inbox_id is provided
    if (demo.inbox_id) {
      await associateContactWithInbox(contact.id, demo.inbox_id, demo);
    }

    // Return success response (no sensitive data)
    return NextResponse.json({
      status: 'ok',
      contact_id: contact.id,
      associated_inbox_id: demo.inbox_id || null,
      is_new_contact: isNewContact
    });

  } catch (error) {
    console.error('Lead creation error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to create contact',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
