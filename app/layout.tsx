import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'BaserowLite · Base de datos no-code personal',
  description: 'Motor de base de datos relacional ligero, rápido y local con vistas Grid, Kanban y Formulario',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased">
        {children}
      </body>
    </html>
  );
}
