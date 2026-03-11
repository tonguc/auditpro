import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'AuditPro — UX + SEO Intelligence',
  description: 'AI-powered UX and SEO audit tool for freelancers and agencies.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, padding: 0, background: '#0A0E1A' }}>
        {children}
      </body>
    </html>
  )
}
