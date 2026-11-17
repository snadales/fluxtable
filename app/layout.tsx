import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'FluxTable · Plataforma de Datos & BI | Sistema Yarken',
  description: 'Plataforma unificada de datos colaborativos, analytics y dashboards de alto rendimiento',
  icons: {
    icon: '/favicon.svg',
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
