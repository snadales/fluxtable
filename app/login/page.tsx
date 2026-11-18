'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { ShieldCheck, ArrowRight, Lock, Mail, AlertCircle } from 'lucide-react';
import { BrandSymbol } from '@/components/brand/brand-logo';
import { getBrandConfig } from '@/lib/brand-config';

function LoginForm() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    const err = searchParams.get('error');
    if (err) {
      if (err === 'UNAUTHORIZED_EMAIL') {
        setErrorMessage('Tu correo no se encuentra en la lista de usuarios autorizados.');
      } else if (err === 'ACCOUNT_DISABLED') {
        setErrorMessage('Esta cuenta ha sido desactivada.');
      } else if (err === 'INVALID_STATE') {
        setErrorMessage('Sesión de autenticación expirada. Por favor, reintenta.');
      } else if (err === 'CONFIG_ERROR') {
        setErrorMessage('Google OAuth aún no está configurado en el servidor.');
      } else {
        setErrorMessage('Error al autenticar con Google: ' + decodeURIComponent(err));
      }
    }
  }, [searchParams]);

  const handleGoogleLogin = () => {
    // Redirección directa al endpoint de Google OAuth
    window.location.href = '/api/auth/google';
  };

  const handleLocalLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage('');

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMessage(data.message || 'Error al iniciar sesión');
        setIsLoading(false);
        return;
      }

      window.location.href = '/';
    } catch {
      setErrorMessage('Error de conexión con el servidor');
      setIsLoading(false);
    }
  };

  const brand = getBrandConfig();

  return (
    <div className="min-h-screen flex items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm space-y-6">
        {/* Logo y Encabezado Adaptable White-Label */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center">
            <BrandSymbol size={52} variant="tile" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-ink">
              {brand.appName}
            </h1>
            {brand.appOrg && (
              <p className="text-[11px] font-bold tracking-[0.08em] uppercase text-ink-3 mt-0.5">
                {brand.appOrg}
              </p>
            )}
          </div>
          <p className="text-xs text-ink-2 max-w-xs mx-auto">
            {brand.tagline}
          </p>
        </div>

        {/* Tarjeta de Inicio de Sesión */}
        <div className="bg-surface border border-line rounded-2xl p-6 shadow-sm space-y-4">
          {/* Botón de Google SSO */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl border border-line-control bg-surface hover:bg-surface-sunken text-ink text-xs font-semibold shadow-2xs transition-all focus:outline-none focus:ring-2 focus:ring-accent"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>Continuar con Google</span>
          </button>

          <div className="relative flex items-center justify-center py-1">
            <div className="border-t border-slate-200 dark:border-slate-800 w-full" />
            <span className="bg-white dark:bg-slate-900 px-2 text-[10px] text-slate-400 uppercase font-mono tracking-wider">
              o acceso con correo
            </span>
          </div>

          {/* Formulario Local */}
          <form onSubmit={handleLocalLogin} className="space-y-3 text-xs">
            {errorMessage && (
              <div className="p-2.5 rounded-xl bg-error-tint text-error border border-error/20 text-xs font-medium">
                {errorMessage}
              </div>
            )}
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Correo Electrónico
              </label>
              <div className="relative">
                <Mail className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="snadales@gmail.com"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium mb-1">
                Contraseña
              </label>
              <div className="relative">
                <Lock className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500 text-slate-800 dark:text-white"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm transition-all mt-1"
            >
              <span>{isLoading ? 'Verificando...' : 'Entrar a la Base'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        </div>

        {/* Footer de Seguridad */}
        <div className="flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
          <span>Zero Trust · Acceso Exclusivo Autorizado</span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-bg text-ink-3 text-xs font-mono">Cargando acceso seguro...</div>}>
      <LoginForm />
    </Suspense>
  );
}
