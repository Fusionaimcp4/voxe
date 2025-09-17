import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import { Analytics } from '@vercel/analytics/next'
import './globals.css'
import { Toaster } from '@/components/ui/toaster'
import Script from 'next/script'

export const metadata: Metadata = {
  title: 'Voxe - Unlimited Agents, Self-Hosted AI Support',
  description:
    'Voxe replaces Intercom/Zendesk with a self-hosted AI-first support system. Unlimited agents, unlimited AI resolutions, one-time setup, you own your data.',
  icons: {
    icon: '/logos/boxlogo32x32.ico',
    shortcut: '/logos/boxlogo48x48.ico',
    apple: '/logos/boxlogo512x512.png',
  },
  openGraph: {
    title: 'Voxe - Unlimited Agents, Self-Hosted AI Support',
    description: 'Voxe replaces Intercom/Zendesk with a self-hosted AI-first support system. Unlimited agents, unlimited AI resolutions, one-time setup, you own your data.',
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
    <html lang="en">
      <head>
        <style>{`
html {
  font-family: ${GeistSans.style.fontFamily};
  --font-sans: ${GeistSans.variable};
  --font-mono: ${GeistMono.variable};
}
        `}</style>
      </head>
      <body>
        {children}
        <Toaster />
        <Analytics />
        <Script id="chatwoot-widget" strategy="lazyOnload">
          {`
            (function(d,t) {
              var BASE_URL="${process.env.CHATWOOT_BASE_URL || 'https://chatwoot.mcp4.ai'}";
              var g=d.createElement(t),s=d.getElementsByTagName(t)[0];
              g.src=BASE_URL+"/packs/js/sdk.js";
              g.async = true;
              s.parentNode.insertBefore(g,s);
              g.onload=function(){
                window.chatwootSDK.run({
                  websiteToken: 'NJzYTHcT7937oMjf8Kjng6UQ',
                  baseUrl: BASE_URL
                })
              }
            })(document,"script");
          `}
        </Script>
      </body>
    </html>
  )
}
