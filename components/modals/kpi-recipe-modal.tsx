'use client';

import React from 'react';
import { 
  X, CheckCircle2, AlertTriangle, ArrowUpRight, Database, 
  Table as TableIcon, BarChart2, ShieldCheck, Clock, Terminal, 
  TrendingUp, TrendingDown, Layers, Bot, User, RefreshCw
} from 'lucide-react';

export interface KpiRecipeData {
  code: string;
  name: string;
  subtitle?: string;
  displayValue: string;
  growth?: number;
  status?: 'optimal' | 'warning' | 'critical';
  statusLabel?: string;
  moduleName: string;
  dashboardCode: string;
  dashboardName: string;
  sourceTableCode: string;
  sourceTableName: string;
  sourceTableId: string;
  aggregationType: string;
  sqlFormula: string;
  timeWindow: string;
  refreshFrequency: string;
  thresholds: {
    optimal: string;
    warning: string;
    critical: string;
  };
  lineage: {
    generator: string;
    consumer: string;
    supervisor: string;
    lastUpdated?: string;
  };
}

// Catálogo maestro de recetas analíticas de KPIs
export const KPI_RECIPES_CATALOG: Record<string, KpiRecipeData> = {
  K001: {
    code: 'K001',
    name: 'Facturación del Mes',
    subtitle: 'Facturación Consolidada Neta del Mes en Curso',
    displayValue: '$ 14.850.000.-',
    growth: 18.4,
    status: 'optimal',
    statusLabel: 'Meta Superada (+18.4%)',
    moduleName: 'Navarino · Compras',
    dashboardCode: 'D001',
    dashboardName: 'D001 · Balance de Ventas y Finanzas',
    sourceTableCode: 'T865',
    sourceTableName: 'Lotes de Importación',
    sourceTableId: '865',
    aggregationType: 'SUM(costo_final_puesto)',
    sqlFormula: `SELECT SUM(costo_final_puesto) AS total_facturado\nFROM t865_lotes_importacion\nWHERE estado_embarque = 'Recibido en Bodega'\n  AND fecha_estimada_arribo >= DATE_TRUNC('month', CURRENT_DATE);`,
    timeWindow: 'Mes en Curso (Móvil)',
    refreshFrequency: 'Cada 15 minutos (Sync Odoo ERP)',
    thresholds: {
      optimal: '>= $ 12.000.000.- (Meta alcanzada)',
      warning: 'Entre $ 8.000.000 y $ 11.999.999.-',
      critical: '< $ 8.000.000.- (Bajo umbral mínimo)',
    },
    lineage: {
      generator: 'Odoo ERP (account.move)',
      consumer: 'Antigravity BI Analytics',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 4 minutos',
    },
  },
  K002: {
    code: 'K002',
    name: 'Margen Bruto Promedio',
    subtitle: 'Margen de Contribución Ponderado por Embarque',
    displayValue: '42.6%',
    growth: 2.1,
    status: 'optimal',
    statusLabel: 'Margen Sano (> 40%)',
    moduleName: 'Navarino · Compras',
    dashboardCode: 'D001',
    dashboardName: 'D001 · Balance de Ventas y Finanzas',
    sourceTableCode: 'T865',
    sourceTableName: 'Lotes de Importación',
    sourceTableId: '865',
    aggregationType: 'AVG((precio - costo) / precio)',
    sqlFormula: `SELECT AVG((precio_venta - costo_final_puesto) / NULLIF(precio_venta, 0)) * 100 AS margen_promedio\nFROM t865_lotes_importacion\nWHERE estado_embarque = 'Recibido en Bodega';`,
    timeWindow: 'Acumulado Anual 2026',
    refreshFrequency: 'Cada 1 hora',
    thresholds: {
      optimal: '>= 40.0% (Objetivo estratégico)',
      warning: 'Entre 30.0% y 39.9%',
      critical: '< 30.0% (Margen en riesgo)',
    },
    lineage: {
      generator: 'Módulo de Pricing Navarino',
      consumer: 'FluxTable BI Engine',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 12 minutos',
    },
  },
  K003: {
    code: 'K003',
    name: 'Cuentas por Cobrar Pendientes',
    subtitle: 'Cobranza Exigible a Clientes y Marketplaces',
    displayValue: '$ 3.200.000.-',
    growth: -5.4,
    status: 'optimal',
    statusLabel: 'Reducción de Deuda (-5.4%)',
    moduleName: 'Navarino · Compras',
    dashboardCode: 'D001',
    dashboardName: 'D001 · Balance de Ventas y Finanzas',
    sourceTableCode: 'T865',
    sourceTableName: 'Lotes de Importación',
    sourceTableId: '865',
    aggregationType: 'SUM(monto_pendiente)',
    sqlFormula: `SELECT SUM(monto_pendiente) AS total_pendiente\nFROM t865_cuentas_cobrar\nWHERE estado_pago = 'pendiente'\n  AND dias_vencimiento > 0;`,
    timeWindow: 'Cierre Diario',
    refreshFrequency: 'Cada 30 minutos',
    thresholds: {
      optimal: '<= $ 4.000.000.- (Cobranza al día)',
      warning: 'Entre $ 4.000.001 y $ 6.000.000.-',
      critical: '> $ 6.000.000.- (Sobregiro de cartera)',
    },
    lineage: {
      generator: 'Banco Estado / Santander Sync',
      consumer: 'FluxTable Finanzas',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 8 minutos',
    },
  },
  K004: {
    code: 'K004',
    name: 'Servicios Activos Homelab',
    subtitle: 'Disponibilidad de Contenedores Docker (ZBook & NUC)',
    displayValue: '28 / 28',
    growth: 0,
    status: 'optimal',
    statusLabel: '100% Operacional',
    moduleName: 'Seguridad · 1Password',
    dashboardCode: 'D002',
    dashboardName: 'D002 · Infraestructura Homelab & Monitoreo',
    sourceTableCode: 'T031',
    sourceTableName: 'Servicios Homelab',
    sourceTableId: '31',
    aggregationType: 'COUNT(*) FILTER (WHERE status = "healthy")',
    sqlFormula: `SELECT COUNT(*) || ' / ' || (SELECT COUNT(*) FROM t031_servicios_homelab) AS servicios_activos\nFROM t031_servicios_homelab\nWHERE health_status IN ('healthy', 'running');`,
    timeWindow: 'Tiempo Real (Sonda 60s)',
    refreshFrequency: 'Cada 60 segundos (Docker Watchdog)',
    thresholds: {
      optimal: '28 / 28 (100% de servicios arriba)',
      warning: '26-27 servicios (1 o 2 reiniciando)',
      critical: '< 26 servicios (Caída de stack crítico)',
    },
    lineage: {
      generator: 'Watchdog autoheal.sh en ZBook',
      consumer: 'Uptime Kuma / Netdata / FluxTable',
      supervisor: 'Antigravity SRE',
      lastUpdated: 'Hace 30 segundos',
    },
  },
  K005: {
    code: 'K005',
    name: 'Tokens en Bóveda IA',
    subtitle: 'Secretos y Credenciales Gestionadas vía Connect',
    displayValue: '282 items',
    growth: 4.2,
    status: 'optimal',
    statusLabel: 'Totalmente Auditado',
    moduleName: 'Seguridad · 1Password',
    dashboardCode: 'D002',
    dashboardName: 'D002 · Infraestructura Homelab & Monitoreo',
    sourceTableCode: 'T032',
    sourceTableName: 'Inventario Bóveda IA',
    sourceTableId: '32',
    aggregationType: 'COUNT(uuid)',
    sqlFormula: `SELECT COUNT(*) AS total_items\nFROM t032_boveda_ia\nWHERE vault_name = 'IA'\n  AND state = 'active';`,
    timeWindow: 'Inventario Permanente',
    refreshFrequency: 'Bajo Demanda (Sync 1Password Connect)',
    thresholds: {
      optimal: '>= 250 secretos con rotación activa',
      warning: 'Menos de 200 o credenciales sin rotar',
      critical: 'Secretos expuestos o Connect desincronizado',
    },
    lineage: {
      generator: '1Password Connect Server (Docker ZBook)',
      consumer: 'Antigravity / Claude Code',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 1 hora',
    },
  },
  K006: {
    code: 'K006',
    name: 'Disponibilidad Global SLA (30d)',
    subtitle: 'Tiempo de Actividad Ponderado de la Infraestructura',
    displayValue: '99.98%',
    growth: 0.05,
    status: 'optimal',
    statusLabel: 'Dentro de SLA (> 99.9%)',
    moduleName: 'Seguridad · 1Password',
    dashboardCode: 'D002',
    dashboardName: 'D002 · Infraestructura Homelab & Monitoreo',
    sourceTableCode: 'T031',
    sourceTableName: 'Servicios Homelab',
    sourceTableId: '31',
    aggregationType: 'AVG(uptime_percentage)',
    sqlFormula: `SELECT ROUND(AVG(uptime_30d)::numeric, 2) || '%' AS uptime_global\nFROM t031_servicios_homelab;`,
    timeWindow: 'Últimos 30 Días',
    refreshFrequency: 'Cada 6 horas',
    thresholds: {
      optimal: '>= 99.95% (SLA Excelente)',
      warning: 'Entre 99.50% y 99.94%',
      critical: '< 99.50% (SLA Incumplido)',
    },
    lineage: {
      generator: 'Uptime Kuma Telemetría',
      consumer: 'FluxTable BI',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 20 minutos',
    },
  },
  K007: {
    code: 'K007',
    name: 'Flujos n8n Ejecutados (24h)',
    subtitle: 'Workflows Despachados con Éxito en Bastión ZBook',
    displayValue: '1,420',
    growth: 12.5,
    status: 'optimal',
    statusLabel: 'Rendimiento Óptimo (+12.5%)',
    moduleName: 'Operaciones · Flujos n8n',
    dashboardCode: 'D003',
    dashboardName: 'D003 · Operaciones, Automatizaciones y Voz',
    sourceTableCode: 'T026',
    sourceTableName: 'Flujos n8n',
    sourceTableId: '26',
    aggregationType: 'COUNT(*) WHERE status = "success"',
    sqlFormula: `SELECT COUNT(*) AS ejecuciones_exitosas\nFROM t026_flujos_n8n\nWHERE status = 'success'\n  AND executed_at >= NOW() - INTERVAL '24 hours';`,
    timeWindow: 'Ventana Móvil 24 Horas',
    refreshFrequency: 'Cada 5 minutos (n8n Webhook Listener)',
    thresholds: {
      optimal: '>= 1.000 ejecuciones/día (Flujo saludable)',
      warning: 'Entre 500 y 999 ejecuciones/día',
      critical: '< 500 ejecuciones/día (Anomalía en n8n)',
    },
    lineage: {
      generator: 'n8n Workflow Engine (WF-008)',
      consumer: 'Antigravity BI Telemetry',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 2 minutos',
    },
  },
  K008: {
    code: 'K008',
    name: 'Mensajes Procesados por Voz',
    subtitle: 'Despachos Supervisados vía voz-service en ZBook',
    displayValue: '384',
    growth: 8.2,
    status: 'optimal',
    statusLabel: 'Actividad Fuerte (+8.2%)',
    moduleName: 'Operaciones · Flujos n8n',
    dashboardCode: 'D003',
    dashboardName: 'D003 · Operaciones, Automatizaciones y Voz',
    sourceTableCode: 'T027',
    sourceTableName: 'Logs de Ejecución',
    sourceTableId: '27',
    aggregationType: 'COUNT(*) WHERE service = "voz-service"',
    sqlFormula: `SELECT COUNT(*) AS total_mensajes_voz\nFROM t027_logs_ejecucion\nWHERE service = 'voz-service'\n  AND status = 'approved'\n  AND created_at >= DATE_TRUNC('day', CURRENT_DATE);`,
    timeWindow: 'Día Actual (00:00 a 23:59)',
    refreshFrequency: 'Tiempo Real vía WebSocket',
    thresholds: {
      optimal: '>= 200 mensajes procesados',
      warning: 'Entre 100 y 199 mensajes',
      critical: '< 100 mensajes',
    },
    lineage: {
      generator: 'voz-service (:8095) en ZBook',
      consumer: 'WhatsApp Gateway & Gmail Hub',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 1 minuto',
    },
  },
  K009: {
    code: 'K009',
    name: 'Tasa de Éxito Automatizaciones',
    subtitle: 'Porcentaje de Workflows Libres de Error',
    displayValue: '99.4%',
    growth: 0.3,
    status: 'optimal',
    statusLabel: 'Error Rate < 1% (99.4%)',
    moduleName: 'Operaciones · Flujos n8n',
    dashboardCode: 'D003',
    dashboardName: 'D003 · Operaciones, Automatizaciones y Voz',
    sourceTableCode: 'T026',
    sourceTableName: 'Flujos n8n',
    sourceTableId: '26',
    aggregationType: 'COUNT(success) / COUNT(*) * 100',
    sqlFormula: `SELECT ROUND((COUNT(*) FILTER (WHERE status = 'success') * 100.0 / NULLIF(COUNT(*), 0))::numeric, 2) || '%' AS tasa_exito\nFROM t026_flujos_n8n\nWHERE executed_at >= NOW() - INTERVAL '7 days';`,
    timeWindow: 'Últimos 7 Días',
    refreshFrequency: 'Cada 15 minutos',
    thresholds: {
      optimal: '>= 99.0% (Excelente fiabilidad)',
      warning: 'Entre 97.0% y 98.9%',
      critical: '< 97.0% (Revisión urgente de flujos)',
    },
    lineage: {
      generator: 'Watchdog n8n-autoheal',
      consumer: 'FluxTable BI',
      supervisor: 'Antigravity / SRE',
      lastUpdated: 'Hace 5 minutos',
    },
  },
  K010: {
    code: 'K010',
    name: 'Impresiones de Publicaciones',
    subtitle: 'Alcance Orgánico Acumulado en LinkedIn',
    displayValue: '24,800',
    growth: 22.4,
    status: 'optimal',
    statusLabel: 'Crecimiento Exponencial (+22.4%)',
    moduleName: 'LinkedIn · Contenido',
    dashboardCode: 'D004',
    dashboardName: 'D004 · Panel Ejecutivo LinkedIn & Redes',
    sourceTableCode: 'T041',
    sourceTableName: 'Publicaciones y Posts',
    sourceTableId: '41',
    aggregationType: 'SUM(impressions)',
    sqlFormula: `SELECT SUM(impressions) AS total_impresiones\nFROM t041_publicaciones\nWHERE published_at >= DATE_TRUNC('month', CURRENT_DATE);`,
    timeWindow: 'Mes en Curso',
    refreshFrequency: 'Cada 6 horas (Scraper LinkedIn)',
    thresholds: {
      optimal: '>= 20.000 impresiones',
      warning: 'Entre 10.000 y 19.999 impresiones',
      critical: '< 10.000 impresiones',
    },
    lineage: {
      generator: 'WF-073 LinkedIn Sync',
      consumer: 'FluxTable Analytics',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 3 horas',
    },
  },
  K011: {
    code: 'K011',
    name: 'Tasa de Interacción (Engagement)',
    subtitle: 'Engagement Rate Promedio por Post Compartido',
    displayValue: '4.8%',
    growth: 0.6,
    status: 'optimal',
    statusLabel: 'Por Encima del Benchmark (4.8%)',
    moduleName: 'LinkedIn · Contenido',
    dashboardCode: 'D004',
    dashboardName: 'D004 · Panel Ejecutivo LinkedIn & Redes',
    sourceTableCode: 'T042',
    sourceTableName: 'Métricas y Engagement',
    sourceTableId: '42',
    aggregationType: 'AVG(engagement_rate)',
    sqlFormula: `SELECT ROUND(AVG(engagement_rate)::numeric, 2) || '%' AS engagement_promedio\nFROM t042_metricas_engagement\nWHERE date >= NOW() - INTERVAL '30 days';`,
    timeWindow: 'Últimos 30 Días',
    refreshFrequency: 'Cada 12 horas',
    thresholds: {
      optimal: '>= 4.0% (Alto impacto)',
      warning: 'Entre 2.5% y 3.9%',
      critical: '< 2.5% (Baja tracción)',
    },
    lineage: {
      generator: 'LinkedIn Analytics API',
      consumer: 'FluxTable BI',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 3 horas',
    },
  },
  K012: {
    code: 'K012',
    name: 'Nuevas Conexiones Estratégicas',
    subtitle: 'Contactos Calificados Agregados a la Red',
    displayValue: '+ 156',
    growth: 14.0,
    status: 'optimal',
    statusLabel: 'Crecimiento Continuo (+14%)',
    moduleName: 'LinkedIn · Contenido',
    dashboardCode: 'D004',
    dashboardName: 'D004 · Panel Ejecutivo LinkedIn & Redes',
    sourceTableCode: 'T042',
    sourceTableName: 'Métricas y Engagement',
    sourceTableId: '42',
    aggregationType: 'COUNT(*) WHERE type = "new_connection"',
    sqlFormula: `SELECT COUNT(*) AS nuevas_conexiones\nFROM t042_metricas_engagement\nWHERE event_type = 'accepted_invitation'\n  AND date >= DATE_TRUNC('month', CURRENT_DATE);`,
    timeWindow: 'Mes en Curso',
    refreshFrequency: 'Diario',
    thresholds: {
      optimal: '>= 100 contactos/mes',
      warning: 'Entre 50 y 99 contactos/mes',
      critical: '< 50 contactos/mes',
    },
    lineage: {
      generator: 'WF-073 LinkedIn Sync',
      consumer: 'FluxTable Analytics',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Hace 3 horas',
    },
  },
};

interface KpiRecipeModalProps {
  isOpen: boolean;
  kpiCode: string | null;
  onClose: () => void;
  onOpenTable: (tableId: string) => void;
  onOpenDashboard: (dashboardId: string) => void;
}

export const KpiRecipeModal: React.FC<KpiRecipeModalProps> = ({
  isOpen,
  kpiCode,
  onClose,
  onOpenTable,
  onOpenDashboard,
}) => {
  if (!isOpen || !kpiCode) return null;

  const recipe = KPI_RECIPES_CATALOG[kpiCode] || {
    code: kpiCode,
    name: `Indicador ${kpiCode}`,
    subtitle: 'Ficha de Construcción Analítica',
    displayValue: '—',
    growth: 0,
    status: 'optimal',
    statusLabel: 'Activo',
    moduleName: 'Módulo de Negocio',
    dashboardCode: 'D001',
    dashboardName: 'Dashboard Principal',
    sourceTableCode: 'T865',
    sourceTableName: 'Tabla de Origen',
    sourceTableId: '865',
    aggregationType: 'COUNT(*)',
    sqlFormula: `SELECT COUNT(*) FROM table WHERE status = 'active';`,
    timeWindow: 'Mes en Curso',
    refreshFrequency: 'Cada 15 minutos',
    thresholds: {
      optimal: 'Operación normal',
      warning: 'Revisión preventiva',
      critical: 'Alerta requerida',
    },
    lineage: {
      generator: 'Pipeline de Datos',
      consumer: 'Antigravity BI',
      supervisor: 'Sebastián Nadales',
      lastUpdated: 'Reciente',
    },
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-150">
        
        {/* Cabecera del Inspector */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900">
          <div className="flex items-center gap-3">
            <span className="px-2 py-1 rounded-md bg-blue-100 dark:bg-blue-950/70 text-[#1D5BD8] dark:text-blue-400 font-mono font-bold text-xs border border-blue-200 dark:border-blue-800 shadow-xs">
              {recipe.code}
            </span>
            <div>
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>{recipe.name}</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 font-semibold">
                  {recipe.statusLabel || 'Óptimo'}
                </span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {recipe.subtitle}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Cuerpo del Inspector de Receta */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs">
          
          {/* Banner de Valor en Vivo */}
          <div className="p-4 rounded-xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-slate-800/60 dark:to-slate-800/30 border border-blue-100 dark:border-slate-700 flex items-center justify-between">
            <div>
              <div className="text-[10px] font-mono text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">
                Valor Actual en Vivo
              </div>
              <div className="font-mono text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                {recipe.displayValue}
              </div>
            </div>
            {recipe.growth !== undefined && (
              <div className="text-right">
                <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${
                  recipe.growth >= 0 
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800'
                    : 'bg-rose-100 dark:bg-rose-950/60 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800'
                }`}>
                  {recipe.growth >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                  <span>{recipe.growth >= 0 ? `+${recipe.growth}%` : `${recipe.growth}%`} MoM</span>
                </span>
                <div className="text-[10px] text-slate-400 mt-1">vs. mes anterior</div>
              </div>
            )}
          </div>

          {/* Contexto de Negocio y Mapeo */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Módulo / Carpeta de Negocio
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>{recipe.moduleName}</span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Dashboard Consolidador
              </span>
              <div className="font-semibold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate">
                  <BarChart2 className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                  <span className="truncate">{recipe.dashboardName}</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenDashboard(recipe.dashboardCode);
                  }}
                  className="text-[#1D5BD8] hover:underline font-bold text-[11px] shrink-0 flex items-center gap-0.5 ml-2"
                >
                  <span>Abrir</span>
                  <ArrowUpRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </div>

          {/* Receta de Construcción / Definición Técnica */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-slate-500" />
                <span>Receta Técnica de Construcción (SQL / Metabase)</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenTable(recipe.sourceTableId);
                }}
                className="flex items-center gap-1 px-2.5 py-1 bg-blue-50 hover:bg-blue-100 text-[#1D5BD8] rounded-md font-semibold text-[11px] border border-blue-200 transition-colors"
              >
                <TableIcon className="w-3 h-3" />
                <span>Ir a Tabla {recipe.sourceTableCode} ({recipe.sourceTableName}) ↗</span>
              </button>
            </div>

            <div className="p-3.5 bg-slate-950 text-slate-200 rounded-xl font-mono text-[11px] leading-relaxed border border-slate-800 overflow-x-auto shadow-inner">
              <pre className="text-emerald-400 whitespace-pre">{recipe.sqlFormula}</pre>
            </div>

            <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-1 pt-1">
              <span><strong>Ventana:</strong> {recipe.timeWindow}</span>
              <span><strong>Refresco:</strong> {recipe.refreshFrequency}</span>
            </div>
          </div>

          {/* Reglas de Umbral y Alertas */}
          <div className="space-y-2">
            <span className="text-[11px] font-bold text-slate-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-slate-500" />
              <span>Umbrales de Alerta & SLA</span>
            </span>
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-200/60 text-emerald-800 dark:text-emerald-300">
                <div className="font-bold flex items-center gap-1 mb-0.5">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  <span>🟢 Óptimo</span>
                </div>
                <div className="text-[10px] leading-tight">{recipe.thresholds.optimal}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-amber-50/60 dark:bg-amber-950/20 border border-amber-200/60 text-amber-800 dark:text-amber-300">
                <div className="font-bold flex items-center gap-1 mb-0.5">
                  <AlertTriangle className="w-3 h-3 text-amber-600" />
                  <span>🟡 Advertencia</span>
                </div>
                <div className="text-[10px] leading-tight">{recipe.thresholds.warning}</div>
              </div>
              <div className="p-2.5 rounded-lg bg-rose-50/60 dark:bg-rose-950/20 border border-rose-200/60 text-rose-800 dark:text-rose-300">
                <div className="font-bold flex items-center gap-1 mb-0.5">
                  <AlertTriangle className="w-3 h-3 text-rose-600" />
                  <span>🔴 Crítico</span>
                </div>
                <div className="text-[10px] leading-tight">{recipe.thresholds.critical}</div>
              </div>
            </div>
          </div>

          {/* Linaje de Datos y Auditoría */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-800 flex items-center justify-between text-[11px]">
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <Bot className="w-3.5 h-3.5 text-blue-600" />
              <span><strong>Generado por:</strong> {recipe.lineage.generator}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
              <User className="w-3.5 h-3.5 text-slate-600" />
              <span><strong>Supervisado por:</strong> {recipe.lineage.supervisor}</span>
            </div>
            <div className="flex items-center gap-1.5 text-slate-400">
              <Clock className="w-3 h-3" />
              <span>{recipe.lineage.lastUpdated || 'En vivo'}</span>
            </div>
          </div>

        </div>

        {/* Pie del Inspector con Acciones */}
        <div className="px-6 py-3.5 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenTable(recipe.sourceTableId);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold shadow-xs transition-colors"
            >
              <TableIcon className="w-3.5 h-3.5" />
              <span>Ver Tabla Fuente {recipe.sourceTableCode}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                onClose();
                onOpenDashboard(recipe.dashboardCode);
              }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg font-semibold border border-rose-200 transition-colors"
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Ver en Dashboard {recipe.dashboardCode}</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-400 font-semibold transition-colors"
          >
            Cerrar
          </button>
        </div>

      </div>
    </div>
  );
};
