import type { Metadata } from 'next';
import './globals.css';

const appName = process.env.NEXT_PUBLIC_APP_NAME || 'FluxTable';
const appOrg = process.env.NEXT_PUBLIC_APP_ORG ? ` | ${process.env.NEXT_PUBLIC_APP_ORG}` : '';
const tagline = process.env.NEXT_PUBLIC_APP_TAGLINE || 'Plataforma de Datos & BI';

export const metadata: Metadata = {
  title: `${appName} · ${tagline}${appOrg}`,
  description: 'Plataforma unificada de datos colaborativos, analytics y dashboards de alto rendimiento',
  icons: {
    icon: process.env.NEXT_PUBLIC_APP_FAVICON_URL || '/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-bg text-ink antialiased">
        {children}
      </body>
    </html>
  );
}
