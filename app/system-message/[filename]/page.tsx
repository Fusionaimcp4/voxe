import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';

interface SystemMessagePageProps {
  params: {
    filename: string;
  };
}

export default async function SystemMessagePage({ params }: SystemMessagePageProps) {
  const { filename } = await params;
  
  try {
    // Read the markdown file
    const filePath = path.join(process.cwd(), 'public', 'system_messages', `${filename}.md`);
    const content = await fs.readFile(filePath, 'utf8');
    
    return (
      <div style={{ minHeight: '100vh', backgroundColor: '#f9fafb', padding: '2rem 0' }}>
        <div style={{ maxWidth: '64rem', margin: '0 auto', padding: '0 1rem' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)', padding: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem' }}>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#111827', margin: 0 }}>System Message</h1>
              <div style={{ fontSize: '0.875rem', color: '#6b7280' }}>
                {filename}.md
              </div>
            </div>
            
            <div style={{ marginBottom: '1.5rem' }}>
              <pre style={{ 
                whiteSpace: 'pre-wrap', 
                backgroundColor: '#1f2937', 
                color: '#f9fafb',
                padding: '1rem', 
                borderRadius: '0.5rem', 
                fontSize: '0.875rem', 
                fontFamily: 'monospace', 
                overflowX: 'auto',
                border: '1px solid #374151',
                margin: 0,
                lineHeight: '1.5'
              }}>
                {content}
              </pre>
            </div>
            
            <div style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#eff6ff', borderRadius: '0.5rem', border: '1px solid #dbeafe' }}>
              <h3 style={{ fontSize: '0.875rem', fontWeight: '600', color: '#1e40af', marginBottom: '0.5rem', margin: '0 0 0.5rem 0' }}>System Message Usage:</h3>
              <ol style={{ fontSize: '0.875rem', color: '#1e40af', paddingLeft: '1.25rem', margin: 0 }}>
                <li style={{ marginBottom: '0.25rem' }}>It is collected from publicly available information about your business</li>
                <li style={{ marginBottom: '0.25rem' }}>For your real business application</li>
                <li style={{ marginBottom: '0.25rem' }}>We optimize the knowledge base to fit your specific needs.</li>
                <li style={{ marginBottom: '0.25rem' }}>The AI assistant is fine-tuned to be familiar with your platform, products, and customer journey.</li>
                <li style={{ marginBottom: '0.25rem' }}>The system is fully customizable to match your brand and workflows.</li>
                <li style={{ marginBottom: '0.25rem' }}>This demo shows you how an AI assistant could sound and look when integrated into your customer experience.</li>
              </ol>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error(`System message not found: ${filename}`, error);
    notFound();
  }
}

export async function generateMetadata({ params }: SystemMessagePageProps) {
  const { filename } = await params;
  
  return {
    title: `System Message - ${filename}`,
    description: `n8n system message for ${filename}`,
  };
}
