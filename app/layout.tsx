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
  title: 'LocalBoxs - All-in-One Conversations Platform | AI-First Customer Support',
  description:
    'Phone, SMS, WhatsApp, Email, Web Chat. AI answers 95% instantly. No per-seat or per-resolution fees. Self-hosted or managed. Your data, your control.',
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
    userScalable: false,
  },
  icons: {
    icon: '/logos/boxlogo32x32.ico',
    shortcut: '/logos/boxlogo48x48.ico',
    apple: '/logos/boxlogo512x512.png',
  },
  openGraph: {
    title: 'LocalBoxs - All-in-One Conversations Platform | AI-First Customer Support',
    description: 'Phone, SMS, WhatsApp, Email, Web Chat. AI answers 95% instantly. No per-seat or per-resolution fees. Self-hosted or managed. Your data, your control.',
    images: ['/logos/boxlogo512x512.png'],
  },
  manifest: '/manifest.json',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
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
        {/* Chatwoot widget - deferred loading for better performance */}
        {/* Only load on non-demo pages to avoid conflicts */}
        <Script id="chatwoot-widget" strategy="lazyOnload">
          {`
            // Only load Chatwoot on non-demo pages
            if (!window.location.pathname.startsWith('/demo/')) {
              // Defer Chatwoot loading until browser is idle
              function initChatwoot() {
                var BASE_URL="${process.env.CHATWOOT_BASE_URL || 'https://chatwoot.mcp4.ai'}";
                var g=document.createElement('script'),s=document.getElementsByTagName('script')[0];
                g.src=BASE_URL+"/packs/js/sdk.js";
                g.async = true;
                s.parentNode.insertBefore(g,s);
                g.onload=function(){
                  if (window.chatwootSDK) {
                    window.chatwootSDK.run({
                      websiteToken: 'NJzYTHcT7937oMjf8Kjng6UQ',
                      baseUrl: BASE_URL
                    });
                  }
                }
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
