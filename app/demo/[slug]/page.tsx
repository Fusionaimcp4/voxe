import { notFound } from 'next/navigation';
import { promises as fs } from 'fs';
import path from 'path';

interface DemoPageProps {
  params: {
    slug: string;
  };
}

export default async function DemoPage({ params }: DemoPageProps) {
  const { slug } = await params;
  
  try {
    // Read the HTML file for this demo
    const demoPath = path.join(process.cwd(), 'public', 'demos', slug, 'index.html');
    const htmlContent = await fs.readFile(demoPath, 'utf8');
    
    // Return the HTML content directly
    return (
      <div 
        dangerouslySetInnerHTML={{ __html: htmlContent }} 
        style={{ margin: 0, padding: 0, height: '100vh' }}
      />
    );
  } catch (error) {
    console.error(`Demo not found for slug: ${slug}`, error);
    notFound();
  }
}

// Generate metadata for the demo page
export async function generateMetadata({ params }: DemoPageProps) {
  const { slug } = await params;
  
  try {
    const demoPath = path.join(process.cwd(), 'public', 'demos', slug, 'index.html');
    const htmlContent = await fs.readFile(demoPath, 'utf8');
    
    // Extract title from HTML
    const titleMatch = htmlContent.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : `${slug} Demo`;
    
    return {
      title,
      description: `AI Support Demo for ${slug}`,
    };
  } catch {
    return {
      title: `${slug} Demo`,
      description: `AI Support Demo for ${slug}`,
    };
  }
}
