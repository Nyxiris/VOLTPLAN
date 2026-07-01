/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { EquipmentType } from '../types';

export const SVG_ICONS: Record<EquipmentType | string, string> = {
  CCTV: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path d="M20 26h18a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H20a2 2 0 0 1-2-2V28a2 2 0 0 1 2-2z" stroke="#3b82f6" stroke-width="3" />
    <path d="M40 30l10-5v18l-10-5v-8z" fill="#3b82f6" stroke="#3b82f6" stroke-width="3" stroke-linejoin="round" />
    <circle cx="26" cy="33" r="3" fill="#60a5fa" />
    <circle cx="34" cy="33" r="2" fill="#3b82f6" />
    <circle cx="32" cy="14" r="2" fill="#ef4444" />
  </svg>`,

  WIFI: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path d="M24 29c4.42-4.42 11.58-4.42 16 0" stroke="#10b981" stroke-width="3" stroke-linecap="round" />
    <path d="M19 24c7.18-7.18 18.82-7.18 26 0" stroke="#34d399" stroke-width="3" stroke-linecap="round" />
    <path d="M14 19c9.94-9.94 26.06-9.94 36 0" stroke="#10b981" stroke-width="3" stroke-linecap="round" opacity="0.6" />
    <circle cx="32" cy="36" r="4" fill="#10b981" />
  </svg>`,

  FIRE: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path d="M32 20v24M20 32h24" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
    <circle cx="32" cy="32" r="7" fill="#ef4444" />
    <path d="M26 26l12 12M38 26l-12 12" stroke="#ef4444" stroke-width="2" opacity="0.5" />
  </svg>`,

  NETWORK: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="4" y="16" width="56" height="32" rx="4" stroke="#f59e0b" stroke-width="3" />
    <rect x="10" y="28" width="8" height="8" rx="1" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
    <rect x="22" y="28" width="8" height="8" rx="1" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
    <rect x="34" y="28" width="8" height="8" rx="1" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
    <rect x="46" y="28" width="8" height="8" rx="1" fill="#1e293b" stroke="#f59e0b" stroke-width="2" />
    <circle cx="14" cy="22" r="2" fill="#10b981" />
    <circle cx="26" cy="22" r="2" fill="#10b981" />
    <circle cx="38" cy="22" r="2" fill="#f59e0b" />
    <circle cx="50" cy="22" r="2" fill="#10b981" />
  </svg>`,

  SECURITY: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path d="M32 20l10 4v10c0 6.2-4.2 12-10 14-5.8-2-10-7.8-10-14V24l10-4z" fill="#a855f7" fill-opacity="0.2" />
    <path d="M32 20l10 4v10c0 6.2-4.2 12-10 14-5.8-2-10-7.8-10-14V24l10-4z" stroke="#a855f7" stroke-width="2" stroke-linejoin="round" />
    <path d="M27 32l3.5 3.5 6.5-6.5" stroke="#ffffff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" />
  </svg>`,

  CCTV_DOME: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path d="M16 22h32v4H16v-4z" fill="#94a3b8" />
    <path d="M18 26c0 7.73 6.27 14 14 14s14-6.27 14-14H18z" fill="#0f172a" stroke="#3b82f6" stroke-width="2" />
    <circle cx="32" cy="26" r="6" fill="#1e293b" stroke="#60a5fa" stroke-width="2" />
    <circle cx="32" cy="26" r="3" fill="#3b82f6" />
    <circle cx="26" cy="22" r="1.5" fill="#ef4444" />
    <circle cx="38" cy="22" r="1.5" fill="#ef4444" />
  </svg>`,

  CCTV_BULLET: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path d="M18 22h22l6 7v6l-6 7H18V22z" fill="#38bdf8" stroke="#ffffff" stroke-width="2" stroke-linejoin="round" />
    <ellipse cx="46" cy="32" rx="2" ry="7" fill="#1e293b" stroke="#ffffff" stroke-width="1.5" />
    <path d="M24 42l-6 6h-4v-6l4-4" stroke="#ffffff" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" />
    <path d="M16 20h26l4 4" stroke="#3b82f6" stroke-width="2.5" stroke-linecap="round" />
    <circle cx="32" cy="32" r="2.5" fill="#ef4444" />
  </svg>`,

  WIFI_ROUTER: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="18" y="38" width="28" height="10" rx="2" fill="#ffffff" />
    <circle cx="24" cy="43" r="1.5" fill="#22c55e" />
    <circle cx="29" cy="43" r="1.5" fill="#22c55e" />
    <circle cx="34" cy="43" r="1.5" fill="#22c55e" />
    <line x1="22" y1="38" x2="22" y2="28" stroke="#cbd5e1" stroke-width="2.5" stroke-linecap="round" />
    <path d="M26 26c3.31-3.31 8.69-3.31 12 0" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" />
    <path d="M22 22c5.52-5.52 14.48-5.52 20 0" stroke="#f59e0b" stroke-width="3" stroke-linecap="round" />
    <path d="M18 18c7.73-7.73 20.27-7.73 28 0" stroke="#fbbf24" stroke-width="3" stroke-linecap="round" opacity="0.65" />
  </svg>`,

  FIRE_DETECTOR: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="16" y="16" width="32" height="4" rx="1" fill="#ef4444" />
    <path d="M18 20h28l-3 10H21l-3-10z" fill="#ef4444" />
    <rect x="22" y="23" width="3" height="4" rx="0.5" fill="#ffffff" />
    <rect x="28" y="23" width="3" height="4" rx="0.5" fill="#ffffff" />
    <rect x="34" y="23" width="3" height="4" rx="0.5" fill="#ffffff" />
    <rect x="40" y="23" width="3" height="4" rx="0.5" fill="#ffffff" />
    <rect x="24" y="30" width="16" height="3" rx="0.5" fill="#b91c1c" />
    <path d="M32 37c-2.5 0-4.5 1.5-4.5 4s2 4 4.5 4 4.5-1.5 4.5-4-2-4-4.5-4z" fill="#ef4444" />
    <path d="M32 35l1.5 2.5h-3l1.5-2.5z" fill="#ef4444" />
  </svg>`,

  SWITCH_RACK: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="10" y="18" width="44" height="28" rx="3" fill="#1e293b" stroke="#475569" stroke-width="2" />
    <rect x="14" y="24" width="6" height="6" rx="1" fill="#0f172a" stroke="#64748b" stroke-width="1" />
    <rect x="22" y="24" width="6" height="6" rx="1" fill="#0f172a" stroke="#64748b" stroke-width="1" />
    <rect x="30" y="24" width="6" height="6" rx="1" fill="#0f172a" stroke="#64748b" stroke-width="1" />
    <rect x="14" y="34" width="6" height="6" rx="1" fill="#0f172a" stroke="#64748b" stroke-width="1" />
    <rect x="22" y="34" width="6" height="6" rx="1" fill="#0f172a" stroke="#64748b" stroke-width="1" />
    <rect x="30" y="34" width="6" height="6" rx="1" fill="#0f172a" stroke="#64748b" stroke-width="1" />
    <circle cx="40" cy="24" r="1" fill="#64748b" />
    <circle cx="43" cy="24" r="1" fill="#64748b" />
    <circle cx="46" cy="24" r="1" fill="#64748b" />
    <circle cx="40" cy="29" r="1" fill="#64748b" />
    <circle cx="43" cy="29" r="1" fill="#64748b" />
    <circle cx="46" cy="29" r="1" fill="#64748b" />
    <circle cx="40" cy="34" r="1" fill="#64748b" />
    <circle cx="43" cy="34" r="1" fill="#64748b" />
    <circle cx="46" cy="34" r="1" fill="#64748b" />
    <circle cx="50" cy="32" r="3.5" fill="#22c55e" stroke="#15803d" stroke-width="1" />
    <circle cx="50" cy="32" r="1.5" fill="#86efac" />
  </svg>`,

  SERVER_RACK: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <path d="M18 16h28l4 7H14l4-7z" fill="#1e3a8a" />
    <rect x="14" y="24" width="36" height="7" rx="1.5" fill="#2563eb" stroke="#1d4ed8" stroke-width="1" />
    <rect x="14" y="33" width="36" height="7" rx="1.5" fill="#2563eb" stroke="#1d4ed8" stroke-width="1" />
    <rect x="14" y="42" width="36" height="7" rx="1.5" fill="#2563eb" stroke="#1d4ed8" stroke-width="1" />
    <line x1="18" y1="27.5" x2="26" y2="27.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    <line x1="30" y1="27.5" x2="36" y2="27.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    <line x1="18" y1="36.5" x2="26" y2="36.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    <line x1="30" y1="36.5" x2="36" y2="36.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    <line x1="18" y1="45.5" x2="26" y2="45.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    <line x1="30" y1="45.5" x2="36" y2="45.5" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" />
    <circle cx="43" cy="27.5" r="2" fill="#1d4ed8" stroke="#ffffff" stroke-width="1" />
    <circle cx="43" cy="36.5" r="2" fill="#1d4ed8" stroke="#ffffff" stroke-width="1" />
    <circle cx="43" cy="45.5" r="2" fill="#1d4ed8" stroke="#ffffff" stroke-width="1" />
  </svg>`,

  ALARM_SIREN: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="18" y="44" width="28" height="8" fill="#cbd5e1" />
    <rect x="32" y="44" width="14" height="8" fill="#94a3b8" />
    <path d="M22 22h10v22H22z" fill="#f87171" />
    <path d="M32 22h10v22H32z" fill="#ef4444" />
    <path d="M22 24c0-3 3-5 10-5s10 2 10 5H22z" fill="#ef4444" />
    <path d="M22 24c0-3 3-5 10-5v5H22z" fill="#f87171" />
    <line x1="32" y1="10" x2="32" y2="13" stroke="#f97316" stroke-width="3" stroke-linecap="round" />
    <line x1="41" y1="13" x2="38" y2="16" stroke="#dc2626" stroke-width="3" stroke-linecap="round" />
    <line x1="23" y1="13" x2="26" y2="16" stroke="#f97316" stroke-width="3" stroke-linecap="round" />
    <line x1="48" y1="22" x2="43" y2="24" stroke="#dc2626" stroke-width="3" stroke-linecap="round" />
    <line x1="16" y1="22" x2="21" y2="24" stroke="#f97316" stroke-width="3" stroke-linecap="round" />
    <line x1="12" y1="32" x2="17" y2="32" stroke="#f97316" stroke-width="3" stroke-linecap="round" />
    <line x1="52" y1="32" x2="47" y2="32" stroke="#dc2626" stroke-width="3" stroke-linecap="round" />
  </svg>`,

  CONTROL_PANEL: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="14" y="16" width="36" height="30" rx="3" fill="#334155" stroke="#1e293b" stroke-width="1.5" />
    <rect x="17" y="19" width="30" height="20" fill="#64748b" />
    <circle cx="36" cy="28" r="4.5" stroke="#e2e8f0" stroke-width="1.5" fill="#ffffff" fill-opacity="0.15" />
    <path d="M38 28l3 8c0.4 1.2-0.4 2.4-1.6 2.4h-4.8c-1.2 0-2-1.2-1.6-2.4l1.6-4-2.4-2.4 1.2-1.2 3.6 3.6V28h1z" fill="#ffedd5" stroke="#1e293b" stroke-width="1" />
    <circle cx="32" cy="42" r="2" fill="#94a3b8" />
  </svg>`,

  ACCESS_CONTROL: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="18" y="14" width="28" height="36" rx="4" fill="#1e1b4b" stroke="#a855f7" stroke-width="2.5" />
    <circle cx="32" cy="24" r="5" fill="#a855f7" />
    <path d="M26 38h12M28 42h8" stroke="#38bdf8" stroke-width="2" stroke-linecap="round" />
    <rect x="29" y="45" width="6" height="1" fill="#22c55e" />
  </svg>`,

  INTERCOM: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="20" y="12" width="24" height="40" rx="3" fill="#334155" stroke="#94a3b8" stroke-width="2" />
    <circle cx="32" cy="22" r="4" fill="#0284c7" stroke="#38bdf8" stroke-width="1.5" />
    <line x1="26" y1="32" x2="38" y2="32" stroke="#cbd5e1" stroke-width="2" />
    <line x1="26" y1="36" x2="38" y2="36" stroke="#cbd5e1" stroke-width="2" />
    <circle cx="32" cy="44" r="3.5" fill="#ef4444" stroke="#ffffff" stroke-width="1" />
  </svg>`,

  UPS_BATTERY: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="12" y="16" width="40" height="32" rx="3" fill="#18181b" stroke="#f59e0b" stroke-width="2" />
    <rect x="20" y="12" width="8" height="4" fill="#f59e0b" />
    <rect x="36" y="12" width="8" height="4" fill="#cbd5e1" />
    <path d="M20 28h8v12h-8z" fill="#22c55e" />
    <path d="M36 28h8v12h-8z" fill="#3b82f6" />
    <circle cx="24" cy="22" r="1.5" fill="#22c55e" />
    <circle cx="40" cy="22" r="1.5" fill="#3b82f6" />
  </svg>`,

  TV: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="8" y="12" width="48" height="32" rx="4" fill="#1e293b" stroke="#ef4444" stroke-width="3" />
    <path d="M24 44h16M32 44v8" stroke="#ef4444" stroke-width="3" stroke-linecap="round" />
    <rect x="12" y="16" width="40" height="24" rx="1" fill="#0f172a" />
    <!-- Antennas or screen indicator -->
    <path d="M24 12l-6-6M40 12l6-6" stroke="#94a3b8" stroke-width="2.5" stroke-linecap="round" />
    <polygon points="28,22 38,28 28,34" fill="#ef4444" />
  </svg>`,

  MONITOR: `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 64 64" fill="none">
    <rect x="6" y="14" width="52" height="30" rx="3" fill="#1e293b" stroke="#3b82f6" stroke-width="3" />
    <path d="M20 44h24M32 44v8" stroke="#3b82f6" stroke-width="3" stroke-linecap="round" />
    <rect x="10" y="18" width="44" height="22" rx="1" fill="#0f172a" />
    <rect x="14" y="22" width="36" height="4" rx="1" fill="#1d4ed8" />
    <circle cx="18" cy="34" r="2" fill="#3b82f6" />
    <circle cx="24" cy="34" r="2" fill="#3b82f6" />
  </svg>`,
};

export const getIconDataUrl = (type: EquipmentType | string, customColor?: string): string => {
  let svg = SVG_ICONS[type] || SVG_ICONS['CCTV'];
  
  if (customColor) {
    // Dynamically replace the primary and accent colors inside the SVGs
    svg = svg.replace(/#3b82f6/g, customColor)
             .replace(/#10b981/g, customColor)
             .replace(/#ef4444/g, customColor)
             .replace(/#f59e0b/g, customColor)
             .replace(/#a855f7/g, customColor)
             .replace(/#38bdf8/g, customColor)
             .replace(/#f43f5e/g, customColor);
             
    // Lighter highlights replacement
    svg = svg.replace(/#60a5fa/g, customColor)
             .replace(/#34d399/g, customColor)
             .replace(/#f87171/g, customColor)
             .replace(/#fbbf24/g, customColor)
             .replace(/#c084fc/g, customColor);
             
    // Darker details/strokes replacement
    svg = svg.replace(/#1d4ed8/g, customColor)
             .replace(/#059669/g, customColor)
             .replace(/#b91c1c/g, customColor)
             .replace(/#d97706/g, customColor)
             .replace(/#7e22ce/g, customColor);
  }

  // btoa works with standard Latin1 characters, escape with encodeURIComponent ensures compatibility with extended characters
  const base64 = btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${base64}`;
};

const imageCache: Record<string, HTMLImageElement> = {};

export const getIconImageElement = (type: EquipmentType | string, customColor?: string): HTMLImageElement => {
  const key = customColor ? `${type}_${customColor}` : String(type);
  if (imageCache[key]) {
    return imageCache[key];
  }
  const img = new Image();
  img.src = getIconDataUrl(type, customColor);
  imageCache[key] = img;
  return img;
};
