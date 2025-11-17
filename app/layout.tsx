import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import Script from 'next/script'
import AuthProvider from '@/components/auth-provider'
import DashboardLayout from '@/components/dashboard-layout'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  title: 'Voxe - All-in-One Conversations Platform | AI-First Customer Support',
  description:
    'Phone, SMS, WhatsApp, Email, Web Chat. AI answers 95% instantly. No per-seat or per-resolution fees. Self-hosted or managed. Your data, your control.',
  icons: {
    icon: '/logos/boxlogo32x32.ico',
    shortcut: '/logos/boxlogo48x48.ico',
    apple: '/logos/boxlogo512x512.png',
  },
  openGraph: {
    title: 'Voxe - All-in-One Conversations Platform | AI-First Customer Support',
    description: 'Phone, SMS, WhatsApp, Email, Web Chat. AI answers 95% instantly. No per-seat or per-resolution fees. Self-hosted or managed. Your data, your control.',
    images: ['/logos/boxlogo512x512.png'],
  },
  manifest: '/manifest.json',
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  // Get Chatwoot base URL with fallback
  const chatwootBaseUrl = (process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://chatvoxe.mcp4.ai').replace(/\/+$/, '');

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`} suppressHydrationWarning>
      <head />
      <body style={{ fontFamily: GeistSans.style.fontFamily }}>
        <AuthProvider>
          <DashboardLayout>
            {children}
          </DashboardLayout>
        </AuthProvider>
        <Toaster />
        <Analytics />
        {/* Chatwoot customer support widget */}
        <Script id="chatwoot-widget" strategy="lazyOnload">
          {`
            // Configure Chatwoot settings
            window.chatwootSettings = {
              position: "right",
              type: "expanded_bubble",
              launcherTitle: "Chat with us"
            };

            // Exclude Chatwoot widget from auth pages (login, signup, etc.)
            // Keep it on demo pages and other user-facing pages
            var pathname = window.location.pathname;
            var isAuthPage = pathname.startsWith('/auth/');
            
            if (!isAuthPage) {
              function initChatwoot() {
                var BASE_URL="${chatwootBaseUrl}";
                
                if (!BASE_URL) {
                  console.error('Chatwoot BASE_URL is not configured');
                  return;
                }
                
                var g=document.createElement('script'),s=document.getElementsByTagName('script')[0];
                g.src=BASE_URL+"/packs/js/sdk.js";
                g.async = true;
                g.crossOrigin = "anonymous";
                s.parentNode.insertBefore(g,s);
                g.onload=function(){
                  if (window.chatwootSDK) {
                    window.chatwootSDK.run({
                      websiteToken: 'BUnYjnSeotHWyqKYSWgzpFFq',
                      baseUrl: BASE_URL
                    });
                  }
                };
                g.onerror=function(error){
                  console.error('Failed to load Chatwoot SDK from', BASE_URL + "/packs/js/sdk.js", error);
                };
              }
              
              // Load when browser is idle or after 3 seconds
              if ('requestIdleCallback' in window) {
                requestIdleCallback(initChatwoot, { timeout: 3000 });
              } else {
                setTimeout(initChatwoot, 3000);
              }
            }
          `}
        </Script>
      </body>
    </html>
  )
}
