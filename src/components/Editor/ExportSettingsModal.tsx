/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Download, Check, AlertTriangle, FileText, Image as ImageIcon, 
  Layers, Printer, Loader2, Sliders, Info, Archive, FileSpreadsheet,
  Grid, Award, ShieldAlert, Monitor, User, Settings2,
  Building2, BadgeCheck, Trash2, Feather, UploadCloud
} from 'lucide-react';
import { PlanSheet, Equipment, Layer } from '../../types';
import { getIconImageElement } from '../../lib/icon-registry';

// Helper function to convert HEX color to RGBA with dynamic alpha
function hexToRgba(hex: string | undefined, alpha: number, defaultColor: string): string {
  if (!hex) return defaultColor;
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) {
    return hex;
  }
  let cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    cleanHex = cleanHex.split('').map(char => char + char).join('');
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return defaultColor;
}

interface ExportSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheets: PlanSheet[];
  currentSheetId: string | null;
  iconScale?: number;
  initialTarget?: 'current' | 'all';
  initialFormat?: 'png' | 'pdf';
  layers?: Layer[];
}

export default function ExportSettingsModal({
  isOpen,
  onClose,
  sheets,
  currentSheetId,
  iconScale = 1,
  initialTarget,
  initialFormat,
  layers
}: ExportSettingsModalProps) {
  const currentSheet = useMemo(() => sheets.find(s => s.id === currentSheetId), [sheets, currentSheetId]);

  // Export Settings State
  const [exportTarget, setExportTarget] = useState<'current' | 'all' | 'selected'>('current');
  const [exportFormat, setExportFormat] = useState<'png' | 'pdf'>('png');
  const [selectedSheetIds, setSelectedSheetIds] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen && currentSheetId) {
      setSelectedSheetIds([currentSheetId]);
    }
  }, [isOpen, currentSheetId]);

  useEffect(() => {
    if (isOpen) {
      if (initialTarget) setExportTarget(initialTarget);
      if (initialFormat) setExportFormat(initialFormat);
    }
  }, [isOpen, initialTarget, initialFormat]);
  const [dpiPreset, setDpiPreset] = useState<number>(300);
  const [sizePreset, setSizePreset] = useState<string>('4k');
  const [customWidth, setCustomWidth] = useState<number>(3840);
  const [includeTitleBlock, setIncludeTitleBlock] = useState<boolean>(true);
  const [includeBorder, setIncludeBorder] = useState<boolean>(true);
  const [includeGrid, setIncludeGrid] = useState<boolean>(false);
  const [includeLegend, setIncludeLegend] = useState<boolean>(false);
  const [legendStyle, setLegendStyle] = useState<'dark' | 'light' | 'blueprint'>('blueprint');
  const [legendCustomTitle, setLegendCustomTitle] = useState<string>('LÉGENDE DES ÉQUIPEMENTS');
  const [legendCustomLabels, setLegendCustomLabels] = useState<Record<string, string>>({});
  const [authorName, setAuthorName] = useState<string>(() => localStorage.getItem('export-author-name') || 'Expert Security Integrator');

  // Customizable company & plan details
  const [companyName, setCompanyName] = useState<string>(() => localStorage.getItem('export-company-name') || 'VOLTPLAN INDUSTRIES');
  const [companyAddress, setCompanyAddress] = useState<string>(() => localStorage.getItem('export-company-address') || '15 Rue de la Technologie, 75008 Paris');
  const [companyContact, setCompanyContact] = useState<string>(() => localStorage.getItem('export-company-contact') || 'Tél: +33 1 89 20 40 50 | contact@voltplan.tech');
  const [companySiret, setCompanySiret] = useState<string>(() => localStorage.getItem('export-company-siret') || 'SIRET: 987 654 321 00012 | TVA: FR12987654321');
  const [securityText, setSecurityText] = useState<string>(() => localStorage.getItem('export-company-security-text') || 'CONTRÔLE DE SÉCURITÉ & CONFORMITÉ ÉLECTRIQUE : NFC 15-100 VALIDE');
  const [planReference, setPlanReference] = useState<string>(() => localStorage.getItem('export-plan-reference') || 'REF-2026-001');
  const [customPlanTitle, setCustomPlanTitle] = useState<string>(() => localStorage.getItem('export-custom-plan-title') || '');
  const [planCustomDate, setPlanCustomDate] = useState<string>(() => {
    return localStorage.getItem('export-plan-custom-date') || new Date().toLocaleDateString('fr-FR');
  });

  // Custom imported assets for the Title Block (Cartouche)
  const [customLogo, setCustomLogo] = useState<string>(() => localStorage.getItem('export-custom-logo') || '');
  const [customStamp, setCustomStamp] = useState<string>(() => localStorage.getItem('export-custom-stamp') || '');
  const [customSignature, setCustomSignature] = useState<string>(() => localStorage.getItem('export-custom-signature') || '');

  useEffect(() => {
    localStorage.setItem('export-author-name', authorName);
  }, [authorName]);

  useEffect(() => {
    localStorage.setItem('export-company-name', companyName);
  }, [companyName]);

  useEffect(() => {
    localStorage.setItem('export-company-address', companyAddress);
  }, [companyAddress]);

  useEffect(() => {
    localStorage.setItem('export-company-contact', companyContact);
  }, [companyContact]);

  useEffect(() => {
    localStorage.setItem('export-company-siret', companySiret);
  }, [companySiret]);

  useEffect(() => {
    localStorage.setItem('export-company-security-text', securityText);
  }, [securityText]);

  useEffect(() => {
    localStorage.setItem('export-plan-reference', planReference);
  }, [planReference]);

  useEffect(() => {
    localStorage.setItem('export-custom-plan-title', customPlanTitle);
  }, [customPlanTitle]);

  useEffect(() => {
    localStorage.setItem('export-plan-custom-date', planCustomDate);
  }, [planCustomDate]);

  useEffect(() => {
    localStorage.setItem('export-custom-logo', customLogo);
  }, [customLogo]);

  useEffect(() => {
    localStorage.setItem('export-custom-stamp', customStamp);
  }, [customStamp]);

  useEffect(() => {
    localStorage.setItem('export-custom-signature', customSignature);
  }, [customSignature]);

  // Generation status state
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0);
  const [progressMessage, setProgressMessage] = useState<string>('');

  // Auto-fill defaults
  useEffect(() => {
    if (currentSheet) {
      // Use standard default based on plan format if available
    }
  }, [currentSheet]);

  const sheetsToExportNow = useMemo(() => {
    return exportTarget === 'current' 
      ? (currentSheet ? [currentSheet] : [])
      : exportTarget === 'selected'
        ? sheets.filter(s => selectedSheetIds.includes(s.id))
        : sheets;
  }, [exportTarget, currentSheet, sheets, selectedSheetIds]);

  const allUniqueEquipmentTypes = useMemo(() => {
    const types = new Set<string>();
    sheetsToExportNow.forEach(s => {
      s.equipment.forEach(eq => types.add(eq.type));
    });
    return Array.from(types);
  }, [sheetsToExportNow]);

  // Calculations for current/selected sheet dimensions
  const dimensionsInfo = useMemo(() => {
    if (!currentSheet) return { width: 0, height: 0, scaleFactor: 1, printW: 0, printH: 0, megapixel: 0, estSize: '0 KB', isCapped: false };

    // Find bounding dimensions of sheet background or use defaults
    const naturalW = currentSheet.dimensions.width || 2000;
    const naturalH = currentSheet.dimensions.height || 1500;
    const aspect = naturalW / naturalH;

    let w = naturalW;
    let h = naturalH;

    if (sizePreset === 'original') {
      w = naturalW;
      h = naturalH;
    } else if (sizePreset === '1080p') {
      if (aspect >= 1) {
        w = 1920;
        h = Math.round(1920 / aspect);
      } else {
        h = 1920;
        w = Math.round(1920 * aspect);
      }
    } else if (sizePreset === '4k') {
      if (aspect >= 1) {
        w = 3840;
        h = Math.round(3840 / aspect);
      } else {
        h = 3840;
        w = Math.round(3840 * aspect);
      }
    } else if (sizePreset === '8k') {
      if (aspect >= 1) {
        w = 7680;
        h = Math.round(7680 / aspect);
      } else {
        h = 7680;
        w = Math.round(7680 * aspect);
      }
    } else if (sizePreset === 'custom') {
      w = customWidth;
      h = Math.round(customWidth / aspect);
    } else if (sizePreset === 'a4') {
      w = Math.round(11.69 * dpiPreset);
      h = Math.round(8.27 * dpiPreset);
    } else if (sizePreset === 'a3') {
      w = Math.round(16.54 * dpiPreset);
      h = Math.round(11.69 * dpiPreset);
    } else if (sizePreset === 'letter') {
      w = Math.round(11.0 * dpiPreset);
      h = Math.round(8.5 * dpiPreset);
    }

    // Limit maximum dimensions to 8K to prevent browser crashes
    const MAX_LIMIT = 7680;
    let isCapped = false;
    if (w > MAX_LIMIT || h > MAX_LIMIT) {
      const scaleFactor = Math.min(MAX_LIMIT / w, MAX_LIMIT / h);
      w = Math.round(w * scaleFactor);
      h = Math.round(h * scaleFactor);
      isCapped = true;
    }

    const scaleFactor = w / currentSheet.dimensions.width;
    const printW = w / dpiPreset;
    const printH = h / dpiPreset;
    const megapixel = (w * h) / 1000000;
    
    // Simple heuristic for estimated PNG file size
    const estSizeMB = megapixel * 0.22; 
    const estSize = estSizeMB < 1 
      ? `${Math.round(estSizeMB * 1024)} KB` 
      : `${estSizeMB.toFixed(1)} MB`;

    return {
      width: w,
      height: h,
      scaleFactor,
      printW,
      printH,
      megapixel,
      estSize,
      isCapped
    };
  }, [currentSheet, sizePreset, dpiPreset, customWidth]);

  if (!currentSheet) return null;

  // Helper to load uploaded base64 images asynchronously for Canvas rendering
  const loadImageAsync = (src: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = (e) => reject(e);
      img.src = src;
    });
  };

  // Reusable core canvas drawer for High-Res plans
  const renderPlanToCanvas = async (sheet: PlanSheet): Promise<HTMLCanvasElement> => {
    // 1. Load Background plan image
    const img = new Image();
    img.src = sheet.canvasBg;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = reject;
    });

    const naturalW = img.naturalWidth || sheet.dimensions.width || 2000;
    const naturalH = img.naturalHeight || sheet.dimensions.height || 1500;
    const aspect = naturalW / naturalH;

    // Calculate dimensions based on parameters
    let targetW = naturalW;
    let targetH = naturalH;

    if (sizePreset === 'original') {
      targetW = naturalW;
      targetH = naturalH;
    } else if (sizePreset === '1080p') {
      if (aspect >= 1) {
        targetW = 1920;
        targetH = Math.round(1920 / aspect);
      } else {
        targetH = 1920;
        targetW = Math.round(1920 * aspect);
      }
    } else if (sizePreset === '4k') {
      if (aspect >= 1) {
        targetW = 3840;
        targetH = Math.round(3840 / aspect);
      } else {
        targetH = 3840;
        targetW = Math.round(3840 * aspect);
      }
    } else if (sizePreset === '8k') {
      if (aspect >= 1) {
        targetW = 7680;
        targetH = Math.round(7680 / aspect);
      } else {
        targetH = 7680;
        targetW = Math.round(7680 * aspect);
      }
    } else if (sizePreset === 'custom') {
      targetW = customWidth;
      targetH = Math.round(customWidth / aspect);
    } else if (sizePreset === 'a4') {
      targetW = Math.round(11.69 * dpiPreset);
      targetH = Math.round(8.27 * dpiPreset);
    } else if (sizePreset === 'a3') {
      targetW = Math.round(16.54 * dpiPreset);
      targetH = Math.round(11.69 * dpiPreset);
    } else if (sizePreset === 'letter') {
      targetW = Math.round(11.0 * dpiPreset);
      targetH = Math.round(8.5 * dpiPreset);
    }

    // Limit maximum dimensions to 8K
    const MAX_LIMIT = 7680;
    if (targetW > MAX_LIMIT || targetH > MAX_LIMIT) {
      const downScale = Math.min(MAX_LIMIT / targetW, MAX_LIMIT / targetH);
      targetW = Math.round(targetW * downScale);
      targetH = Math.round(targetH * downScale);
    }

    // Create background canvas
    const sheetCanvas = document.createElement('canvas');
    sheetCanvas.width = targetW;
    sheetCanvas.height = targetH;
    const sheetCtx = sheetCanvas.getContext('2d');
    if (!sheetCtx) throw new Error("Could not acquire 2D canvas context");

    sheetCtx.imageSmoothingEnabled = true;
    sheetCtx.imageSmoothingQuality = 'high';

    // Draw background sheet plan image
    const planLayer = layers?.find(l => l.id === 'PLAN');
    const planVisible = planLayer ? planLayer.visible : true;
    const planOpacity = planLayer ? planLayer.opacity : 1;

    if (planVisible) {
      sheetCtx.save();
      sheetCtx.globalAlpha = planOpacity;
      sheetCtx.drawImage(img, 0, 0, targetW, targetH);
      sheetCtx.restore();
    }

    // Optional thin grid lines for architectural reference
    if (includeGrid) {
      sheetCtx.save();
      sheetCtx.strokeStyle = 'rgba(0, 122, 204, 0.06)';
      sheetCtx.lineWidth = Math.max(0.5, 0.5 * (targetW / 2000));
      const gSize = 40 * (targetW / 2000);
      sheetCtx.beginPath();
      for (let x = 0; x < targetW; x += gSize) {
        sheetCtx.moveTo(x, 0);
        sheetCtx.lineTo(x, targetH);
      }
      for (let y = 0; y < targetH; y += gSize) {
        sheetCtx.moveTo(0, y);
        sheetCtx.lineTo(targetW, y);
      }
      sheetCtx.stroke();
      sheetCtx.restore();
    }

    // Scale ratio from layout to output canvas
    const scaleFactor = targetW / sheet.dimensions.width;
    const exportScale = targetW / 1200; // Reference width of 1200px for ideal, legible element sizing

    // Helper function to draw Cardinal Spline (matching Konva's curved line rendering)
    const drawSpline = (ctx: CanvasRenderingContext2D, pts: number[], tension: number = 0.4, numOfSegments: number = 16) => {
      if (pts.length < 4) {
        if (pts.length >= 2) {
          ctx.lineTo(pts[0], pts[1]);
        }
        return;
      }

      const size = pts.length;
      const _pts: number[] = [];

      // Add dummy start point extrapolated from the first segment
      _pts.push(pts[0] - (pts[2] - pts[0]));
      _pts.push(pts[1] - (pts[3] - pts[1]));

      for (let i = 0; i < size; i++) {
        _pts.push(pts[i]);
      }

      // Add dummy end point extrapolated from the last segment
      _pts.push(pts[size - 2] + (pts[size - 2] - pts[size - 4]));
      _pts.push(pts[size - 1] + (pts[size - 1] - pts[size - 3]));

      for (let i = 2; i < _pts.length - 4; i += 2) {
        const x0 = _pts[i - 2];
        const y0 = _pts[i - 1];
        const x1 = _pts[i];
        const y1 = _pts[i + 1];
        const x2 = _pts[i + 2];
        const y2 = _pts[i + 3];
        const x3 = _pts[i + 4];
        const y3 = _pts[i + 5];

        for (let t = 0; t <= numOfSegments; t++) {
          const st = t / numOfSegments;

          const c1 = -tension * st * st * st + 2 * tension * st * st - tension * st;
          const c2 = (2 - tension) * st * st * st + (tension - 3) * st * st + 1;
          const c3 = (tension - 2) * st * st * st + (3 - 2 * tension) * st * st + tension * st;
          const c4 = tension * st * st * st - tension * st * st;

          const x = x0 * c1 + x1 * c2 + x2 * c3 + x3 * c4;
          const y = y0 * c1 + y1 * c2 + y2 * c3 + y3 * c4;

          if (t === 0 && i === 2) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }
      }
    };

    // 2. Draw cables
    if (sheet.cables) {
      sheet.cables.forEach(cable => {
        const layer = layers?.find(l => l.id === cable.layerId);
        if (layer && !layer.visible) return;
        const opacity = layer ? layer.opacity : 1;

        sheetCtx.save();
        sheetCtx.globalAlpha = opacity;
        sheetCtx.beginPath();
        const scaledPoints = cable.points.map(val => val * scaleFactor);

        if (cable.type === 'curved') {
          drawSpline(sheetCtx, scaledPoints, cable.tension ?? 0.4);
        } else {
          if (scaledPoints.length >= 4) {
            sheetCtx.moveTo(scaledPoints[0], scaledPoints[1]);
            for (let j = 2; j < scaledPoints.length; j += 2) {
              sheetCtx.lineTo(scaledPoints[j], scaledPoints[j+1]);
            }
          }
        }

        sheetCtx.strokeStyle = cable.color;
        // Keep cable widths perfectly legible on high-resolution exports
        const baseWidth = cable.strokeWidth ?? 2.5;
        sheetCtx.lineWidth = Math.max(1.5, baseWidth * exportScale);
        sheetCtx.lineCap = 'round';
        sheetCtx.lineJoin = 'round';

        if (cable.dash && cable.dash.length > 0) {
          sheetCtx.setLineDash(cable.dash.map(d => d * exportScale));
        } else {
          sheetCtx.setLineDash([]);
        }

        sheetCtx.stroke();
        sheetCtx.restore();
        sheetCtx.setLineDash([]);
      });
    }

    // 3. Draw equipment devices & ranges
    sheet.equipment.forEach(item => {
      const layer = layers?.find(l => l.id === item.layerId);
      if (layer && !layer.visible) return;
      const opacity = layer ? layer.opacity : 1;

      const ix = item.x * scaleFactor;
      const iy = item.y * scaleFactor;
      const rot = (item.rotation * Math.PI) / 180;

      sheetCtx.save();
      sheetCtx.globalAlpha = opacity;
      sheetCtx.translate(ix, iy);
      sheetCtx.rotate(rot);

      // Cones / ranges overlays - using spatial scale for radius but keeping lines legible
      if (item.type === 'CCTV' || item.type === 'CCTV_DOME' || item.type === 'CCTV_BULLET') {
        const focalLength = item.properties?.focalLength || 2.8;
        let fov = item.properties?.fovAngle !== undefined ? item.properties.fovAngle : 100;
        let reach = item.properties?.reach !== undefined ? item.properties.reach : 110;
        if (item.properties?.fovAngle === undefined && item.properties?.reach === undefined) {
          if (focalLength === 4) { fov = 80; reach = 140; }
          else if (focalLength === 6) { fov = 60; reach = 180; }
          else if (focalLength === 8) { fov = 45; reach = 220; }
          else if (focalLength === 12) { fov = 25; reach = 280; }
        }

        const reachScaled = reach * scaleFactor;
        const startRad = (-90 - fov / 2) * Math.PI / 180;
        const endRad = (-90 + fov / 2) * Math.PI / 180;

        const customColor = item.properties?.coverageColor || "#3b82f6";
        const customOpacity = item.properties?.coverageOpacity !== undefined ? item.properties.coverageOpacity : 0.14;

        sheetCtx.beginPath();
        sheetCtx.moveTo(0, 0);
        sheetCtx.arc(0, 0, reachScaled, startRad, endRad);
        sheetCtx.closePath();
        sheetCtx.fillStyle = hexToRgba(customColor, customOpacity, 'rgba(59, 130, 246, 0.14)');
        sheetCtx.fill();
        sheetCtx.lineWidth = Math.max(1, 1 * exportScale);
        sheetCtx.strokeStyle = hexToRgba(customColor, 0.4, 'rgba(59, 130, 246, 0.4)');
        sheetCtx.setLineDash([4 * exportScale, 4 * exportScale]);
        sheetCtx.stroke();
        sheetCtx.setLineDash([]);
      } else if (item.type === 'WIFI' || item.type === 'WIFI_ROUTER') {
        const coverage = (item.properties?.coverageRange || 80) * scaleFactor;
        const customColor = item.properties?.coverageColor || "#22c55e";
        const customOpacity = item.properties?.coverageOpacity !== undefined ? item.properties.coverageOpacity : 0.08;

        sheetCtx.beginPath();
        sheetCtx.arc(0, 0, coverage, 0, 2 * Math.PI);
        sheetCtx.fillStyle = hexToRgba(customColor, customOpacity, 'rgba(34, 197, 94, 0.08)');
        sheetCtx.fill();

        sheetCtx.beginPath();
        sheetCtx.arc(0, 0, 20 * scaleFactor, 0, 2 * Math.PI);
        sheetCtx.lineWidth = Math.max(0.75, 0.75 * exportScale);
        sheetCtx.strokeStyle = hexToRgba(customColor, 0.4, 'rgba(34, 197, 94, 0.4)');
        sheetCtx.setLineDash([3 * exportScale, 3 * exportScale]);
        sheetCtx.stroke();
        sheetCtx.setLineDash([]);
      } else if (item.type === 'FIRE' || item.type === 'FIRE_DETECTOR') {
        const coverage = (item.properties?.coverageRange || 50) * scaleFactor;
        const customColor = item.properties?.coverageColor || "#ef4444";
        const customOpacity = item.properties?.coverageOpacity !== undefined ? item.properties.coverageOpacity : 0.08;

        sheetCtx.beginPath();
        sheetCtx.arc(0, 0, coverage, 0, 2 * Math.PI);
        sheetCtx.fillStyle = hexToRgba(customColor, customOpacity, 'rgba(239, 68, 68, 0.08)');
        sheetCtx.fill();

        sheetCtx.lineWidth = Math.max(1, 1 * exportScale);
        sheetCtx.strokeStyle = hexToRgba(customColor, 0.2, 'rgba(239, 68, 68, 0.2)');
        sheetCtx.setLineDash([4 * exportScale, 4 * exportScale]);
        sheetCtx.stroke();
        sheetCtx.setLineDash([]);
      } else if (item.type === 'ALARM_SIREN') {
        const coverage = (item.properties?.coverageRange || 60) * scaleFactor;
        const customColor = item.properties?.coverageColor || "#f43f5e";
        const customOpacity = item.properties?.coverageOpacity !== undefined ? item.properties.coverageOpacity : 0.08;

        sheetCtx.beginPath();
        sheetCtx.arc(0, 0, coverage, 0, 2 * Math.PI);
        sheetCtx.fillStyle = hexToRgba(customColor, customOpacity, 'rgba(244, 63, 94, 0.08)');
        sheetCtx.fill();

        sheetCtx.lineWidth = Math.max(1, 1 * exportScale);
        sheetCtx.strokeStyle = hexToRgba(customColor, 0.25, 'rgba(244, 63, 94, 0.25)');
        sheetCtx.setLineDash([2 * exportScale, 4 * exportScale]);
        sheetCtx.stroke();
        sheetCtx.setLineDash([]);
      }

      // Icon Render (applying custom color dynamic rendering)
      const iconImg = getIconImageElement(item.type, item.properties?.coverageColor);
      if (iconImg) {
        // Keep icons perfectly sized and readable on high-resolution exports
        const iconSize = 44 * exportScale * iconScale;
        sheetCtx.drawImage(iconImg, -iconSize / 2, -iconSize / 2, iconSize, iconSize);
      }

      sheetCtx.restore();

      // Device Text Label
      sheetCtx.save();
      sheetCtx.translate(ix, iy);
      sheetCtx.fillStyle = '#000000';
      sheetCtx.font = `bold ${Math.max(8, Math.round(8.5 * exportScale))}px Montserrat, sans-serif`;
      sheetCtx.textAlign = 'center';
      sheetCtx.textBaseline = 'top';
      sheetCtx.shadowColor = '#ffffff';
      sheetCtx.shadowBlur = 4;
      sheetCtx.fillText(item.subType || item.type, 0, (22 * iconScale + 6) * exportScale);
      sheetCtx.restore();
    });

    // 4. Draw outer border layout & Titleblock (Cartouche) if enabled
    if (includeBorder) {
      const borderOffset = Math.round(targetW * 0.02);
      const footerH = includeTitleBlock ? Math.round(targetH * 0.14) : 0;
      const gap = includeTitleBlock ? Math.round(targetH * 0.025) : 0;

      const finalCanvas = document.createElement('canvas');
      finalCanvas.width = targetW + 2 * borderOffset;
      finalCanvas.height = targetH + 2 * borderOffset + footerH + gap;
      const finalCtx = finalCanvas.getContext('2d');
      if (!finalCtx) return sheetCanvas;

      finalCtx.imageSmoothingEnabled = true;
      finalCtx.imageSmoothingQuality = 'high';

      // Determine colors based on style
      const isDark = legendStyle === 'dark';
      const isBlueprint = legendStyle === 'blueprint';

      const frameBgColor = isDark ? '#0f0f11' : isBlueprint ? '#f8fafc' : '#ffffff';
      const frameBorderColor = isDark ? '#44444c' : isBlueprint ? '#cbd5e1' : '#cbd5e1';

      // Background solid fill
      finalCtx.fillStyle = frameBgColor;
      finalCtx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

      // Inner blueprint drawing coordinates - absolutely no overlap!
      const startX = borderOffset;
      const startY = borderOffset;

      // Draw plan sheet onto center
      finalCtx.drawImage(sheetCanvas, startX, startY);

      // Outer border frame (can match theme)
      finalCtx.strokeStyle = frameBorderColor;
      finalCtx.lineWidth = Math.max(1.5, targetW * 0.001);
      finalCtx.strokeRect(
        borderOffset, 
        borderOffset, 
        finalCanvas.width - 2 * borderOffset, 
        finalCanvas.height - 2 * borderOffset
      );

      // Pre-load custom uploaded images (Logo, Stamp, Signature)
      let logoImg: HTMLImageElement | null = null;
      let stampImg: HTMLImageElement | null = null;
      let sigImg: HTMLImageElement | null = null;

      if (customLogo) {
        try {
          logoImg = await loadImageAsync(customLogo);
        } catch (e) {
          console.error("Error loading custom logo", e);
        }
      }
      if (customStamp) {
        try {
          stampImg = await loadImageAsync(customStamp);
        } catch (e) {
          console.error("Error loading custom stamp", e);
        }
      }
      if (customSignature) {
        try {
          sigImg = await loadImageAsync(customSignature);
        } catch (e) {
          console.error("Error loading custom signature", e);
        }
      }

      // Draw Title Block (Cartouche) as a full-width Footer (Pied de Page)
      if (includeTitleBlock) {
        const titleW = finalCanvas.width - 2 * borderOffset;
        const titleH = footerH;
        const tx = borderOffset;
        const ty = finalCanvas.height - borderOffset - titleH;

        finalCtx.save();

        const cartBgColor = isDark ? 'rgba(10, 10, 12, 0.98)' : isBlueprint ? 'rgba(255, 255, 255, 0.98)' : 'rgba(255, 255, 255, 0.98)';
        const cartBorderColor = isDark ? 'rgba(255, 255, 255, 0.12)' : isBlueprint ? 'rgba(37, 99, 235, 0.25)' : 'rgba(0, 0, 0, 0.12)';
        const cartDividerColor = isDark ? 'rgba(255, 255, 255, 0.08)' : isBlueprint ? 'rgba(37, 99, 235, 0.15)' : 'rgba(0, 0, 0, 0.06)';

        const brandColor = isDark ? '#60a5fa' : isBlueprint ? '#2563eb' : '#2563eb';
        const brandSubColor = isDark ? 'rgba(255, 255, 255, 0.45)' : isBlueprint ? 'rgba(30, 58, 138, 0.7)' : 'rgba(71, 85, 105, 0.7)';
        const labelHeaderColor = isDark ? 'rgba(255, 255, 255, 0.5)' : isBlueprint ? 'rgba(30, 58, 138, 0.5)' : 'rgba(100, 116, 139, 0.6)';
        const labelValueColor = isDark ? '#f4f4f5' : isBlueprint ? '#1e3a8a' : '#1e293b';
        const designerColor = isDark ? '#e4e4e7' : isBlueprint ? '#1e40af' : '#334155';

        // 1. Footer Background fill and border
        finalCtx.fillStyle = cartBgColor;
        finalCtx.strokeStyle = cartBorderColor;
        finalCtx.lineWidth = Math.max(1, targetW * 0.0008);
        finalCtx.fillRect(tx, ty, titleW, titleH);
        finalCtx.strokeRect(tx, ty, titleW, titleH);

        const txtScale = targetW / 2000;

        // 2. Partition footer in two if legend is included and has equipments
        const hasLegend = includeLegend && sheet.equipment.length > 0;
        const cartW = hasLegend ? Math.round(titleW * 0.66) : titleW;

        // Draw vertical partition divider if legend is shown
        if (hasLegend) {
          finalCtx.strokeStyle = cartDividerColor;
          finalCtx.lineWidth = Math.max(1, targetW * 0.0006);
          finalCtx.beginPath();
          finalCtx.moveTo(tx + cartW, ty);
          finalCtx.lineTo(tx + cartW, ty + titleH);
          finalCtx.stroke();
        }

        // 3. Define Responsive Columns inside standard Cartouche (left-hand partition)
        // If legend is included, Cartouche has 3 columns. Otherwise, it has 4 columns.
        let col1W, col2W, col3W, col4W;
        if (hasLegend) {
          col1W = cartW * 0.52; // Company & Logo (expanded for grand logo & safety text)
          col2W = cartW * 0.23; // Plan Details
          col3W = cartW * 0.25; // Signature, Visa & Cachet
          col4W = 0;
        } else {
          col1W = cartW * 0.48; // Company & Logo (expanded for grand logo & safety text)
          col2W = cartW * 0.16; // Plan Details
          col3W = cartW * 0.14; // Scale & Resolution
          col4W = cartW * 0.22; // Signature, Visa & Cachet
        }

        const div1X = tx + col1W;
        const div2X = tx + col1W + col2W;
        const div3X = tx + col1W + col2W + col3W;

        // Draw internal dividers
        finalCtx.strokeStyle = cartDividerColor;
        finalCtx.lineWidth = Math.max(0.5, targetW * 0.0004);
        finalCtx.beginPath();
        finalCtx.moveTo(div1X, ty);
        finalCtx.lineTo(div1X, ty + titleH);
        finalCtx.moveTo(div2X, ty);
        finalCtx.lineTo(div2X, ty + titleH);
        if (!hasLegend) {
          finalCtx.moveTo(div3X, ty);
          finalCtx.lineTo(div3X, ty + titleH);
        }
        finalCtx.stroke();

        // ----------------------------------------------------
        // COLUMN 1: ENTERPRISE LOGO & BRANDING (Very Grand Logo - 1/6 of Cartouche Standard)
        // ----------------------------------------------------
        const logoW = cartW * (1 / 6); // Exactly 1/6 (16.67%) of the Cartouche Standard
        const logoH = Math.min(logoW, titleH * 0.85); // Constrain within vertical limit
        const logoX = tx + 14 * txtScale;
        const logoY = ty + (titleH - logoH) / 2;

        if (logoImg) {
          // Draw user uploaded custom logo (highly visible and very large)
          finalCtx.drawImage(logoImg, logoX, logoY, logoW, logoH);
        } else {
          // Draw standard elegant corporate logo emblem (highly visible & scaled to 1/6th)
          const badgeR = logoH / 2;
          const badgeX = logoX + badgeR;
          const badgeY = ty + titleH / 2;

          finalCtx.strokeStyle = brandColor;
          finalCtx.lineWidth = Math.max(1.2, 2.2 * txtScale);
          finalCtx.beginPath();
          finalCtx.arc(badgeX, badgeY, badgeR, 0, 2 * Math.PI);
          finalCtx.stroke();

          finalCtx.beginPath();
          finalCtx.arc(badgeX, badgeY, badgeR - 5 * txtScale, 0, 2 * Math.PI);
          finalCtx.stroke();

          // Stylized bolt
          finalCtx.fillStyle = brandColor;
          finalCtx.beginPath();
          const boltScale = badgeR / 34;
          finalCtx.moveTo(badgeX + 4 * boltScale, badgeY - 18 * boltScale);
          finalCtx.lineTo(badgeX - 11 * boltScale, badgeY + 1 * boltScale);
          finalCtx.lineTo(badgeX + 1 * boltScale, badgeY + 1 * boltScale);
          finalCtx.lineTo(badgeX - 4 * boltScale, badgeY + 18 * boltScale);
          finalCtx.lineTo(badgeX + 11 * boltScale, badgeY - 1 * boltScale);
          finalCtx.lineTo(badgeX - 1 * boltScale, badgeY - 1 * boltScale);
          finalCtx.closePath();
          finalCtx.fill();
        }

        // Enterprise Text & details next to the logo
        const brandTextX = logoX + logoW + 16 * txtScale;
        const textBlockH = 82 * txtScale;
        const textStartY = ty + (titleH - textBlockH) / 2 + 10 * txtScale;

        // Corporate name / Title (Enlarged, Montserrat)
        finalCtx.fillStyle = brandColor;
        finalCtx.font = `bold ${Math.max(15, Math.round(16.5 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText(companyName.toUpperCase(), brandTextX, textStartY);

        // Address (Enlarged, Montserrat)
        finalCtx.fillStyle = labelValueColor;
        finalCtx.font = `500 ${Math.max(10, Math.round(11 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText(companyAddress, brandTextX, textStartY + 18 * txtScale);

        // Contact Info (Enlarged, Montserrat)
        finalCtx.fillStyle = brandSubColor;
        finalCtx.font = `500 ${Math.max(10, Math.round(11 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText(companyContact, brandTextX, textStartY + 33 * txtScale);

        // Official registration (SIRET & TVA) (Enlarged, Montserrat)
        finalCtx.fillStyle = labelHeaderColor;
        finalCtx.font = `500 ${Math.max(9.5, Math.round(10 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText(companySiret, brandTextX, textStartY + 48 * txtScale);

        // Security control text (Montserrat)
        finalCtx.fillStyle = isDark ? '#f87171' : '#dc2626'; // Security red / Warning color
        finalCtx.font = `bold ${Math.max(8.5, Math.round(9.5 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText(securityText.toUpperCase(), brandTextX, textStartY + 64 * txtScale);

        // ----------------------------------------------------
        // COLUMN 2: SHEET DETAILS (Divided into two sub-rows)
        // ----------------------------------------------------
        finalCtx.beginPath();
        finalCtx.moveTo(div1X, ty + titleH / 2);
        finalCtx.lineTo(div2X, ty + titleH / 2);
        finalCtx.stroke();

        const col2Padding = 12 * txtScale;
        
        // Top Left: Sheet Name / Plan Title (Customizable)
        finalCtx.fillStyle = labelHeaderColor;
        finalCtx.font = `600 ${Math.max(8.5, Math.round(9 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText('PLAN / COMPOSANT', div1X + col2Padding, ty + 16 * txtScale);

        finalCtx.fillStyle = labelValueColor;
        finalCtx.font = `bold ${Math.max(11, Math.round(12.5 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText((customPlanTitle || sheet.name).toUpperCase().slice(0, 24), div1X + col2Padding, ty + 32 * txtScale);

        // Top Right: Date (Customizable)
        const col2MidX = div1X + col2W * 0.60;
        finalCtx.fillStyle = labelHeaderColor;
        finalCtx.font = `600 ${Math.max(8.5, Math.round(9 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText('DATE', col2MidX, ty + 16 * txtScale);

        finalCtx.fillStyle = labelValueColor;
        finalCtx.font = `bold ${Math.max(11, Math.round(12.5 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText(planCustomDate, col2MidX, ty + 32 * txtScale);

        // Bottom Left: Designer/Author (Customizable)
        finalCtx.fillStyle = labelHeaderColor;
        finalCtx.font = `600 ${Math.max(8.5, Math.round(9 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText('DESIGNER / AUTEUR', div1X + col2Padding, ty + titleH / 2 + 16 * txtScale);

        finalCtx.fillStyle = designerColor;
        finalCtx.font = `bold ${Math.max(11, Math.round(12.5 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.fillText(authorName.toUpperCase().slice(0, 24), div1X + col2Padding, ty + titleH / 2 + 32 * txtScale);

        // ----------------------------------------------------
        // COLUMN 3: SCALE & RESOLUTION or REFERENCE (Montserrat)
        // ----------------------------------------------------
        if (hasLegend) {
          // If we have legend, draw Reference & scale info in Column 2 bottom right
          finalCtx.fillStyle = labelHeaderColor;
          finalCtx.font = `600 ${Math.max(8.5, Math.round(9 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText('N° RÉFÉRENCE', col2MidX, ty + titleH / 2 + 16 * txtScale);

          finalCtx.fillStyle = labelValueColor;
          finalCtx.font = `bold ${Math.max(11, Math.round(12.5 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText(planReference.toUpperCase().slice(0, 18), col2MidX, ty + titleH / 2 + 32 * txtScale);

          // We draw scale & DPI in Column 2 top row next to Date, or we can combine it somewhere
          // Let's add the scale as a small tag next to DATE to make it visible
          const metricText = sheet.scaleRatio 
            ? `1m = ${Math.round(sheet.scaleRatio)}px` 
            : 'Échelle N/A';
          finalCtx.fillStyle = '#10b981';
          finalCtx.font = `bold ${Math.max(8.5, Math.round(9.5 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText(`[ ${metricText} | ${dpiPreset}DPI ]`, col2MidX, ty + 42 * txtScale);
        } else {
          // If NO legend, Column 2 bottom right has Reference
          finalCtx.fillStyle = labelHeaderColor;
          finalCtx.font = `600 ${Math.max(8.5, Math.round(9 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText('N° RÉFÉRENCE', col2MidX, ty + titleH / 2 + 16 * txtScale);

          finalCtx.fillStyle = labelValueColor;
          finalCtx.font = `bold ${Math.max(11, Math.round(12.5 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText(planReference.toUpperCase().slice(0, 18), col2MidX, ty + titleH / 2 + 32 * txtScale);

          // And Column 3 is fully dedicated to METRIC SCALE & RESOLUTION
          finalCtx.beginPath();
          finalCtx.moveTo(div2X, ty + titleH / 2);
          finalCtx.lineTo(div3X, ty + titleH / 2);
          finalCtx.stroke();

          const col3Padding = 12 * txtScale;

          // Top: Metric Scale (Enlarged, Montserrat)
          finalCtx.fillStyle = labelHeaderColor;
          finalCtx.font = `600 ${Math.max(8.5, Math.round(9 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText('METRIC SCALE / ÉCHELLE', div2X + col3Padding, ty + 16 * txtScale);

          const metricText = sheet.scaleRatio 
            ? `1m = ${Math.round(sheet.scaleRatio)} px` 
            : 'Scale Not Set';
          finalCtx.fillStyle = '#10b981';
          finalCtx.font = `bold ${Math.max(11, Math.round(12.5 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText(metricText, div2X + col3Padding, ty + 32 * txtScale);

          // Bottom: Resolution DPI & Phase (Enlarged, Montserrat)
          finalCtx.fillStyle = labelHeaderColor;
          finalCtx.font = `600 ${Math.max(8.5, Math.round(9 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText('DPI RESOLUTION & PHASE', div2X + col3Padding, ty + titleH / 2 + 16 * txtScale);

          finalCtx.fillStyle = '#fbbf24';
          finalCtx.font = `bold ${Math.max(11, Math.round(12.5 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText(`${targetW}x${targetH} @ ${dpiPreset}DPI | EXE`, div2X + col3Padding, ty + titleH / 2 + 32 * txtScale);
        }

        // ----------------------------------------------------
        // COLUMN 3 / COLUMN 4: SIGNATURE, VISA & CACHET (Realistic approval block, Montserrat)
        // ----------------------------------------------------
        const approvalColX = hasLegend ? div2X : div3X;
        const approvalColW = hasLegend ? cartW - col1W - col2W : titleW - col1W - col2W - col3W;

        const stampX = approvalColX + 10 * txtScale;
        const stampY = ty + 8 * txtScale;
        const stampW = approvalColW - 20 * txtScale;
        const stampH = titleH - 16 * txtScale;

        // Draw dotted Stamp box
        finalCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.16)' : 'rgba(0, 0, 0, 0.12)';
        finalCtx.lineWidth = Math.max(1, 1 * txtScale);
        finalCtx.setLineDash([3 * txtScale, 3 * txtScale]);
        finalCtx.strokeRect(stampX, stampY, stampW, stampH);
        finalCtx.setLineDash([]);

        // Divide the approval block into Left (Signature) and Right (Cachet / Stamp)
        const halfW = stampW / 2;
        const sigColX = stampX;
        const stampColX = stampX + halfW;

        // Draw an elegant vertical separator between the two sections inside the box
        finalCtx.strokeStyle = isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.05)';
        finalCtx.lineWidth = Math.max(0.5, 0.5 * txtScale);
        finalCtx.setLineDash([2 * txtScale, 2 * txtScale]);
        finalCtx.beginPath();
        finalCtx.moveTo(stampX + halfW, stampY);
        finalCtx.lineTo(stampX + halfW, stampY + stampH);
        finalCtx.stroke();
        finalCtx.setLineDash([]);

        // Dynamic spacing offset to push signature and stamp towards the outer edges for more space
        const extraGap = 18 * txtScale;

        // Label for Left side (Signature) (Enlarged, Montserrat)
        finalCtx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.35)' : 'rgba(71, 85, 105, 0.55)';
        finalCtx.font = `bold ${Math.max(8.5, Math.round(9 * txtScale))}px "Montserrat", sans-serif`;
        finalCtx.textAlign = 'center';
        finalCtx.fillText('SIGNATURE AUTORISÉE', sigColX + halfW / 2 - extraGap, stampY + 14 * txtScale);

        // Label for Right side (Cachet / Stamp) (Enlarged, Montserrat)
        finalCtx.fillText('CACHET ET VISA', stampColX + halfW / 2 + extraGap, stampY + 14 * txtScale);

        // --- SIGNATURE DRAWING (LEFT SIDE) ---
        if (sigImg) {
          // Draw custom uploaded signature (pushed left)
          const sigFitW = halfW * 0.8;
          const sigFitH = stampH * 0.6;
          finalCtx.drawImage(
            sigImg, 
            sigColX + (halfW - sigFitW) / 2 - extraGap, 
            stampY + 12 * txtScale + (stampH - 12 * txtScale - sigFitH) / 2, 
            sigFitW, 
            sigFitH
          );
        } else {
          // Draw a beautiful simulated blue pen vector signature path (pushed left)
          finalCtx.strokeStyle = isDark ? '#60a5fa' : '#1d4ed8'; // authentic blue ink
          finalCtx.lineWidth = Math.max(1, 1.2 * txtScale);
          finalCtx.beginPath();
          const startX = sigColX + halfW * 0.10;
          const startY = stampY + stampH * 0.55;
          finalCtx.moveTo(startX, startY);
          
          finalCtx.bezierCurveTo(
            sigColX + halfW * 0.28, stampY + stampH * 0.3,
            sigColX + halfW * 0.38, stampY + stampH * 0.8,
            sigColX + halfW * 0.48, stampY + stampH * 0.45
          );
          finalCtx.bezierCurveTo(
            sigColX + halfW * 0.58, stampY + stampH * 0.35,
            sigColX + halfW * 0.68, stampY + stampH * 0.75,
            sigColX + halfW * 0.80, stampY + stampH * 0.5
          );
          finalCtx.stroke();

          // Underline text (Enlarged, Montserrat, pushed left)
          finalCtx.fillStyle = isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(100, 116, 139, 0.4)';
          finalCtx.font = `italic ${Math.max(6, Math.round(6.5 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText('Signature manuscrite', sigColX + halfW / 2 - extraGap, stampY + stampH - 8 * txtScale);
        }

        // --- STAMP DRAWING (RIGHT SIDE) ---
        if (stampImg) {
          // Draw custom uploaded stamp slightly rotated (pushed right)
          finalCtx.save();
          const stampFitW = stampH * 0.8;
          const stampFitH = stampH * 0.8;
          const sCenterX = stampColX + halfW / 2 + extraGap;
          const sCenterY = stampY + 12 * txtScale + (stampH - 12 * txtScale) / 2;
          finalCtx.translate(sCenterX, sCenterY);
          finalCtx.rotate(-6 * Math.PI / 180);
          finalCtx.drawImage(stampImg, -stampFitW / 2, -stampFitH / 2, stampFitW, stampFitH);
          finalCtx.restore();
        } else {
          // Fallback circular red ink approval seal (Montserrat, pushed right)
          finalCtx.save();
          const stampCenterX = stampColX + halfW / 2 + extraGap;
          const stampCenterY = stampY + 12 * txtScale + (stampH - 12 * txtScale) / 2;
          finalCtx.translate(stampCenterX, stampCenterY);
          finalCtx.rotate(-10 * Math.PI / 180);

          const stampColor = isDark ? 'rgba(248, 113, 113, 0.75)' : 'rgba(220, 38, 38, 0.6)';
          finalCtx.strokeStyle = stampColor;
          finalCtx.lineWidth = Math.max(1, 1.2 * txtScale);

          finalCtx.beginPath();
          finalCtx.arc(0, 0, 16 * txtScale, 0, 2 * Math.PI);
          finalCtx.stroke();

          finalCtx.beginPath();
          finalCtx.arc(0, 0, 13 * txtScale, 0, 2 * Math.PI);
          finalCtx.stroke();

          finalCtx.fillStyle = stampColor;
          finalCtx.font = `bold ${Math.max(5.5, Math.round(6 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.textBaseline = 'middle';
          finalCtx.fillText('APPROUVÉ', 0, -4 * txtScale);

          finalCtx.font = `bold ${Math.max(4.5, Math.round(5 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText('VOLTPLAN BE', 0, 5 * txtScale);

          finalCtx.restore();
        }

        finalCtx.textAlign = 'left'; // Reset text alignment
        finalCtx.textBaseline = 'alphabetic'; // Reset text baseline

        // ----------------------------------------------------
        // RIGHT PARTITION: THE INTEGRATED EQUIPMENT LEGEND (Enlarged icons & text, Montserrat)
        // ----------------------------------------------------
        if (hasLegend) {
          const legendX = tx + cartW;
          const legendInnerW = titleW - cartW - 24 * txtScale;
          
          // Header (Montserrat)
          finalCtx.fillStyle = labelHeaderColor;
          finalCtx.font = `bold ${Math.max(9, Math.round(10 * txtScale))}px "Montserrat", sans-serif`;
          finalCtx.fillText(legendCustomTitle || 'LÉGENDE DES ÉQUIPEMENTS', legendX + 20 * txtScale, ty + 16 * txtScale);

          // Get unique equipment
          const uniqueTypes = Array.from(new Set(sheet.equipment.map(e => e.type)));
          const typeCounts = sheet.equipment.reduce((acc, eq) => {
            acc[eq.type] = (acc[eq.type] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const gridX = legendX + 20 * txtScale;
          const gridY = ty + 24 * txtScale;
          const gridColW = legendInnerW / 2;
          
          // Compute rows dynamically to optimize spacing (allowing larger sizes)
          const numCols = 2;
          const numRows = Math.ceil(uniqueTypes.length / numCols) || 1;
          const gridRowH = (titleH - 36 * txtScale) / numRows;
          const actualRowH = Math.max(16 * txtScale, Math.min(32 * txtScale, gridRowH));

          uniqueTypes.forEach((type, index) => {
            const colIdx = index % numCols;
            const rowIdx = Math.floor(index / numCols);
            const itemX = gridX + colIdx * gridColW;
            const itemY = gridY + rowIdx * actualRowH + 12 * txtScale;

            if (itemY + 12 * txtScale < ty + titleH) {
              const matchedItem = sheet.equipment.find(eq => eq.type === type);
              if (!matchedItem) return;

              const count = typeCounts[type] || 0;

              // Draw Icon (Substantially Enlarged)
              const iconImg = getIconImageElement(type, matchedItem?.properties?.coverageColor);
              const iconSize = 20 * txtScale;
              if (iconImg) {
                finalCtx.drawImage(iconImg, itemX, itemY - 14 * txtScale, iconSize, iconSize);
              }

              // Draw label and quantity count (Enlarged, Montserrat)
              finalCtx.fillStyle = labelValueColor;
              finalCtx.font = `600 ${Math.max(8.5, Math.round(9.5 * txtScale))}px "Montserrat", sans-serif`;
              const defaultLabel = matchedItem.subType || type.replace(/_/g, ' ');
              const labelText = legendCustomLabels[type] || defaultLabel;
              
              const fullText = `${labelText.toUpperCase()} (${count})`;
              finalCtx.fillText(fullText.slice(0, 26), itemX + 26 * txtScale, itemY);
            }
          });
        }

        finalCtx.restore();
      }

      return finalCanvas;
    }

    return sheetCanvas;
  };

  // Main high-res compiling engine
  const handleExportExecute = async () => {
    setIsGenerating(true);
    setProgress(5);
    setProgressMessage('Initializing design render pipeline...');

    try {
      const sheetsToExport = exportTarget === 'current' 
        ? [currentSheet] 
        : exportTarget === 'selected'
          ? sheets.filter(s => selectedSheetIds.includes(s.id))
          : sheets;

      if (sheetsToExport.length === 0) {
        throw new Error("No plans selected for export.");
      }

      if (exportFormat === 'pdf') {
        // PDF Export Flow
        const { jsPDF } = await import('jspdf');
        let pdfDoc: any = null;

        for (let i = 0; i < sheetsToExport.length; i++) {
          const sheet = sheetsToExport[i];
          if (!sheet) continue;

          const stepSize = Math.floor(90 / sheetsToExport.length);
          setProgress(Math.round(10 + i * stepSize));
          setProgressMessage(`Rendering sheet ${i + 1}/${sheetsToExport.length}: "${sheet.name}"...`);

          // Render sheet canvas
          const planCanvas = await renderPlanToCanvas(sheet);
          const w = planCanvas.width;
          const h = planCanvas.height;

          const dataUrl = planCanvas.toDataURL('image/png', 0.95);
          const orientation = w > h ? 'landscape' : 'portrait';

          if (i === 0) {
            pdfDoc = new jsPDF({
              orientation,
              unit: 'px',
              format: [w, h]
            });
          } else {
            pdfDoc.addPage([w, h], orientation);
          }

          // Add rendered blueprint onto the PDF page
          pdfDoc.addImage(dataUrl, 'PNG', 0, 0, w, h, undefined, 'FAST');
        }

        setProgress(95);
        setProgressMessage('Finalizing and packaging high-quality PDF...');

        if (pdfDoc) {
          const fileName = exportTarget === 'current'
            ? `VoltPlan_${currentSheet.name.replace(/\s+/g, '_')}_DPI${dpiPreset}.pdf`
            : `VoltPlan_BatchExport_${sheets.length}_Sheets_DPI${dpiPreset}.pdf`;
          pdfDoc.save(fileName);
        }

      } else {
        // PNG Export Flow
        if (exportTarget === 'current') {
          // Single Image download
          setProgress(50);
          setProgressMessage(`Compiling High-Res image for "${currentSheet.name}"...`);
          
          const planCanvas = await renderPlanToCanvas(currentSheet);
          
          setProgress(90);
          setProgressMessage('Downloading image to device...');

          const link = document.createElement('a');
          link.download = `VoltPlan_${currentSheet.name.replace(/\s+/g, '_')}_${sizePreset}_${dpiPreset}DPI.png`;
          link.href = planCanvas.toDataURL('image/png', 1.0);
          link.click();
        } else {
          // Batch ZIP Export download
          setProgress(10);
          setProgressMessage('Initializing zip packager...');

          const JSZipLib = (await import('jszip')).default;
          const zip = new JSZipLib();

          for (let i = 0; i < sheets.length; i++) {
            const sheet = sheets[i];
            const stepSize = Math.floor(70 / sheets.length);
            setProgress(Math.round(15 + i * stepSize));
            setProgressMessage(`Compiling page ${i + 1}/${sheets.length}: "${sheet.name}"...`);

            const planCanvas = await renderPlanToCanvas(sheet);
            const dataUrl = planCanvas.toDataURL('image/png', 0.95);
            // Convert to raw base64 data for ZIP insertion
            const base64Data = dataUrl.split(',')[1];
            
            const sanitizedName = sheet.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            zip.file(`${i + 1}_${sanitizedName}_${sizePreset}.png`, base64Data, { base64: true });
          }

          setProgress(85);
          setProgressMessage('Compressing pages into ZIP archive...');

          const blob = await zip.generateAsync({ type: 'blob' });
          
          setProgress(95);
          setProgressMessage('Saving ZIP archive to Downloads...');

          const link = document.createElement('a');
          link.download = `VoltPlan_BatchExport_${sheets.length}_Sheets_${sizePreset}.zip`;
          link.href = URL.createObjectURL(blob);
          link.click();
        }
      }

      setProgress(100);
      setProgressMessage('Success! File exported.');
      
      // Reset state on success
      setTimeout(() => {
        setIsGenerating(false);
        onClose();
      }, 1200);

    } catch (error) {
      console.error("Export failure: ", error);
      setProgressMessage(`Error: ${error instanceof Error ? error.message : "Canvas compilation failed"}`);
      setProgress(0);
      setTimeout(() => setIsGenerating(false), 3000);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={!isGenerating ? onClose : undefined}
            className="absolute inset-0 bg-black/75 backdrop-blur-sm"
          />

          {/* Modal Window */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 15 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 15 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="relative w-full max-w-4xl h-[85vh] bg-[#1a1a1e] border border-[#2e2e36] rounded-xl shadow-2xl overflow-hidden flex flex-col text-white"
          >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-[#2e2e36] bg-[#222228]">
            <div className="flex items-center gap-2.5">
              <Printer className="text-blue-400" size={18} />
              <div>
                <h3 className="text-sm font-bold tracking-tight">Professional Export Settings (Cartouche & DPI)</h3>
                <p className="text-[10px] text-zinc-400">Configure pixel-perfect print & PDF outputs up to 8K resolution</p>
              </div>
            </div>
            {!isGenerating && (
              <button 
                onClick={onClose}
                className="text-zinc-400 hover:text-white hover:bg-[#2a2a32] p-1.5 rounded-lg transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          {/* Core Body Container */}
          <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-6 min-h-0">
            
            {/* Left Options Controls */}
            <div className="flex-1 space-y-5">
              
              {/* Scope & Format Selectors */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block">Export Target Scope</label>
                  <div className="bg-[#222228] p-1 rounded-lg border border-[#33333c] flex flex-wrap gap-1">
                    <button
                      onClick={() => setExportTarget('current')}
                      className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                        exportTarget === 'current' 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon size={11} />
                      <span>Current</span>
                    </button>
                    <button
                      onClick={() => setExportTarget('selected')}
                      className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                        exportTarget === 'selected' 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Check size={11} />
                      <span>Select</span>
                    </button>
                    <button
                      onClick={() => setExportTarget('all')}
                      className={`flex-1 min-w-[80px] flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[10px] font-semibold transition-all ${
                        exportTarget === 'all' 
                          ? 'bg-blue-600 text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <Archive size={11} />
                      <span>All ({sheets.length})</span>
                    </button>
                  </div>

                  {exportTarget === 'selected' && (
                    <motion.div 
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      className="mt-2 p-2 bg-[#111115] rounded-lg border border-zinc-800 space-y-1 max-h-40 overflow-y-auto custom-scrollbar"
                    >
                      <div className="flex items-center justify-between px-1 mb-1">
                        <span className="text-[9px] text-zinc-500 font-bold uppercase">Select Sheets</span>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => setSelectedSheetIds(sheets.map(s => s.id))}
                            className="text-[8px] text-blue-500 hover:underline"
                          >
                            All
                          </button>
                          <button 
                            onClick={() => setSelectedSheetIds([])}
                            className="text-[8px] text-zinc-500 hover:underline"
                          >
                            None
                          </button>
                        </div>
                      </div>
                      {sheets.map(sheet => (
                        <label key={sheet.id} className="flex items-center gap-2 p-1.5 hover:bg-zinc-800/50 rounded cursor-pointer transition-colors">
                          <input 
                            type="checkbox"
                            checked={selectedSheetIds.includes(sheet.id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedSheetIds(prev => [...prev, sheet.id]);
                              } else {
                                setSelectedSheetIds(prev => prev.filter(id => id !== sheet.id));
                              }
                            }}
                            className="accent-blue-500 w-3 h-3"
                          />
                          <span className={`text-[10px] truncate ${selectedSheetIds.includes(sheet.id) ? 'text-blue-400 font-medium' : 'text-zinc-400'}`}>
                            {sheet.name}
                          </span>
                        </label>
                      ))}
                    </motion.div>
                  )}
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] text-zinc-400 font-bold uppercase block">File Format</label>
                  <div className="bg-[#222228] p-1 rounded-lg border border-[#33333c] flex">
                    <button
                      onClick={() => setExportFormat('png')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        exportFormat === 'png' 
                          ? 'bg-orange-600 text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <ImageIcon size={12} />
                      <span>PNG {exportTarget !== 'current' ? '(ZIP)' : ''}</span>
                    </button>
                    <button
                      onClick={() => setExportFormat('pdf')}
                      className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-xs font-semibold transition-all ${
                        exportFormat === 'pdf' 
                          ? 'bg-purple-600 text-white shadow-sm' 
                          : 'text-zinc-400 hover:text-white'
                      }`}
                    >
                      <FileText size={12} />
                      <span>PDF Doc</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Resolution / Print size Preset Selector */}
              <div className="space-y-2">
                <label className="text-[10px] text-zinc-400 font-bold uppercase block">Output Resolution Preset</label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'original', name: 'Original', desc: 'Natural dimensions' },
                    { id: '1080p', name: '1080p', desc: 'Full HD standard' },
                    { id: '4k', name: '4K UHD', desc: 'Ultra High Def' },
                    { id: '8k', name: '8K UHD', desc: 'Maximum 7680px' },
                    { id: 'a4', name: 'A4 Paper', desc: '11.7" x 8.3"' },
                    { id: 'a3', name: 'A3 Poster', desc: '16.5" x 11.7"' },
                    { id: 'letter', name: 'Letter', desc: '11" x 8.5"' },
                    { id: 'custom', name: 'Custom px', desc: 'Manual width' },
                  ].map(p => (
                    <button
                      key={p.id}
                      onClick={() => setSizePreset(p.id)}
                      className={`p-2 rounded-lg border text-left transition-all hover:bg-[#25252e] ${
                        sizePreset === p.id 
                          ? 'border-blue-500 bg-[#20202a] shadow-md' 
                          : 'border-[#33333c] bg-[#1e1e24]'
                      }`}
                    >
                      <span className="text-xs font-bold block">{p.name}</span>
                      <span className="text-[8px] text-zinc-400 font-mono block leading-tight">{p.desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Width Input (Only if custom selected) */}
              {sizePreset === 'custom' && (
                <div className="space-y-1.5 bg-[#20202a] p-3 rounded-lg border border-blue-500/20">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Target Output Width:</span>
                    <span className="font-mono text-blue-400 font-bold">{customWidth} px</span>
                  </div>
                  <input
                    type="range"
                    min="1000"
                    max="7680"
                    step="100"
                    value={customWidth}
                    onChange={(e) => setCustomWidth(parseInt(e.target.value))}
                    className="w-full h-1 bg-[#15151a] rounded-lg appearance-none cursor-pointer accent-blue-500"
                  />
                  <span className="text-[9px] text-zinc-500 block">Height will be automatically calculated to preserve layout aspect ratio.</span>
                </div>
              )}

              {/* DPI Quality Preset Selection */}
              <div className="space-y-1.5">
                <label className="text-[10px] text-zinc-400 font-bold uppercase block">Print DPI Quality</label>
                <div className="grid grid-cols-5 gap-1.5">
                  {[
                    { dpi: 72, label: '72 DPI', badge: 'Screen' },
                    { dpi: 150, label: '150 DPI', badge: 'Draft' },
                    { dpi: 300, label: '300 DPI', badge: 'High-Res' },
                    { dpi: 600, label: '600 DPI', badge: 'Ultra-Res' },
                    { dpi: 1200, label: '1200 DPI', badge: 'Max Press' },
                  ].map(d => (
                    <button
                      key={d.dpi}
                      onClick={() => setDpiPreset(d.dpi)}
                      className={`py-2 px-1 rounded-lg border flex flex-col items-center justify-center transition-all ${
                        dpiPreset === d.dpi 
                          ? 'border-emerald-500 bg-[#1f2923] text-emerald-300' 
                          : 'border-[#33333c] bg-[#1e1e24] text-zinc-300 hover:bg-[#25252e]'
                      }`}
                    >
                      <span className="text-[10px] font-bold">{d.label}</span>
                      <span className="text-[7.5px] font-semibold uppercase opacity-60 leading-none">{d.badge}</span>
                    </button>
                  ))}
                </div>
              </div>
              {/* Blueprint Overlays & Metadata */}
              <div className="space-y-4.5 p-4.5 bg-[#1b1b22] rounded-xl border border-zinc-800 shadow-xl relative overflow-hidden">
                {/* Glow Accent Deco */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />
                
                <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2">
                  <div className="flex items-center gap-1.5">
                    <Settings2 size={13} className="text-blue-400" />
                    <span className="text-[10px] text-zinc-300 uppercase font-bold tracking-wider">
                      Mise en Page & Cartouche <span className="text-zinc-500 font-normal">/ Layout Settings</span>
                    </span>
                  </div>
                  <span className="text-[8px] font-mono bg-blue-950/40 text-blue-400 px-1.5 py-0.5 rounded border border-blue-900/30 uppercase tracking-widest">CAD Overlays</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  {/* Card 1: Outer Border */}
                  <label className={`group relative flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
                    includeBorder 
                      ? 'bg-blue-950/15 border-blue-500/40 shadow-[0_2px_8px_-3px_rgba(59,130,246,0.2)]' 
                      : 'bg-[#141419] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}>
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={includeBorder}
                        onChange={(e) => setIncludeBorder(e.target.checked)}
                        className="accent-blue-500 rounded border-zinc-700 w-3.5 h-3.5"
                      />
                    </div>
                    <div className="flex flex-col leading-snug">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">Cadre & Marges</span>
                        <span className="text-[7.5px] text-zinc-500 font-mono">/ Frame</span>
                      </div>
                      <span className="text-[8.5px] text-zinc-400 mt-0.5">Marges de sécurité de 8% tout autour du plan</span>
                    </div>
                  </label>

                  {/* Card 2: Title Block / Cartouche */}
                  <label className={`group relative flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
                    !includeBorder 
                      ? 'opacity-30 pointer-events-none bg-[#111] border-transparent' 
                      : includeTitleBlock 
                        ? 'bg-blue-950/15 border-blue-500/40 shadow-[0_2px_8px_-3px_rgba(59,130,246,0.2)]' 
                        : 'bg-[#141419] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}>
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        disabled={!includeBorder}
                        checked={includeTitleBlock}
                        onChange={(e) => setIncludeTitleBlock(e.target.checked)}
                        className="accent-blue-500 rounded border-zinc-700 w-3.5 h-3.5"
                      />
                    </div>
                    <div className="flex flex-col leading-snug">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">Cartouche Standard</span>
                        <span className="text-[7.5px] text-zinc-500 font-mono">/ Title Block</span>
                      </div>
                      <span className="text-[8.5px] text-zinc-400 mt-0.5">Échelle métrique, date, auteur & informations de résolution</span>
                    </div>
                  </label>

                  {/* Card 3: Grid Overlay */}
                  <label className={`group relative flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
                    includeGrid 
                      ? 'bg-blue-950/15 border-blue-500/40 shadow-[0_2px_8px_-3px_rgba(59,130,246,0.2)]' 
                      : 'bg-[#141419] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                  }`}>
                    <div className="pt-0.5">
                      <input
                        type="checkbox"
                        checked={includeGrid}
                        onChange={(e) => setIncludeGrid(e.target.checked)}
                        className="accent-blue-500 rounded border-zinc-700 w-3.5 h-3.5"
                      />
                    </div>
                    <div className="flex flex-col leading-snug">
                      <div className="flex items-center gap-1">
                        <span className="font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">Grille Technique</span>
                        <span className="text-[7.5px] text-zinc-500 font-mono">/ Grid</span>
                      </div>
                      <span className="text-[8.5px] text-zinc-400 mt-0.5">Trame isométrique fine de référence technique en arrière-plan</span>
                    </div>
                  </label>

                  {/* Card 4: Legend Overlay */}
                  <div className="flex flex-col gap-2">
                    <label className={`group relative flex items-start gap-3 cursor-pointer p-3 rounded-lg border transition-all ${
                      includeLegend 
                        ? 'bg-blue-950/15 border-blue-500/40 shadow-[0_2px_8px_-3px_rgba(59,130,246,0.2)]' 
                        : 'bg-[#141419] border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/40'
                    }`}>
                      <div className="pt-0.5">
                        <input
                          type="checkbox"
                          checked={includeLegend}
                          onChange={(e) => setIncludeLegend(e.target.checked)}
                          className="accent-blue-500 rounded border-zinc-700 w-3.5 h-3.5"
                        />
                      </div>
                      <div className="flex flex-col leading-snug">
                        <div className="flex items-center gap-1">
                          <span className="font-bold text-zinc-100 group-hover:text-blue-400 transition-colors">Légende Export</span>
                          <span className="text-[7.5px] text-zinc-500 font-mono">/ Legend</span>
                        </div>
                        <span className="text-[8.5px] text-zinc-400 mt-0.5">Affiche la légende récapitulative des équipements sur l'image exportée</span>
                      </div>
                    </label>

                    {includeLegend && (
                      <div className="bg-[#141419] p-3 rounded-lg border border-blue-900/30 flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-200">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">Thème (Model)</span>
                          <div className="flex bg-[#222228] p-0.5 rounded-md">
                            {(['dark', 'light', 'blueprint'] as const).map(theme => (
                              <button
                                key={theme}
                                type="button"
                                onClick={() => setLegendStyle(theme)}
                                className={`px-2 py-1 text-[9px] font-semibold rounded capitalize ${
                                  legendStyle === theme ? 'bg-blue-600 text-white' : 'text-zinc-500 hover:text-zinc-300'
                                }`}
                              >
                                {theme}
                              </button>
                            ))}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-1.5">
                          <span className="text-[10px] text-zinc-400 font-bold uppercase">Titre de la Légende</span>
                          <input
                            type="text"
                            value={legendCustomTitle}
                            onChange={(e) => setLegendCustomTitle(e.target.value)}
                            className="bg-[#222228] text-white border border-[#33333c] focus:border-blue-500 text-[10px] px-2 py-1.5 rounded outline-none w-full"
                          />
                        </div>

                        {allUniqueEquipmentTypes.length > 0 && (
                          <div className="flex flex-col gap-1.5 pt-2 border-t border-zinc-800">
                            <span className="text-[10px] text-zinc-400 font-bold uppercase mb-1">Étiquettes d'Équipement</span>
                            <div className="max-h-[120px] overflow-y-auto custom-scrollbar space-y-2 pr-1">
                              {allUniqueEquipmentTypes.map(type => {
                                // Try to find a default subtype to show as placeholder
                                let placeholder = type.replace(/_/g, ' ');
                                const ex = currentSheet?.equipment.find(e => e.type === type);
                                if (ex && ex.subType) placeholder = ex.subType;
                                
                                return (
                                  <div key={type} className="flex items-center gap-2">
                                    <span className="text-[9px] text-zinc-500 font-mono w-16 truncate" title={type}>{type}</span>
                                    <input
                                      type="text"
                                      value={legendCustomLabels[type] || ''}
                                      onChange={(e) => setLegendCustomLabels(prev => ({ ...prev, [type]: e.target.value }))}
                                      placeholder={placeholder}
                                      className="flex-1 bg-[#222228] text-zinc-200 border border-[#33333c] focus:border-blue-500 text-[10px] px-2 py-1 rounded outline-none"
                                    />
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Informations du Cartouche / Parameterized text inputs */}
                  {includeTitleBlock && (
                    <div className="bg-[#141419] p-4 rounded-lg border border-zinc-800/80 flex flex-col gap-4 col-span-1 sm:col-span-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 border-b border-zinc-800/50 pb-2">
                        <Sliders size={13} className="text-blue-400" />
                        <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider leading-none">
                          Informations du Cartouche <span className="text-zinc-500 font-normal">/ Text Fields</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        {/* Company Name */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase">Nom de l'Entreprise</span>
                          <input
                            type="text"
                            value={companyName}
                            onChange={(e) => setCompanyName(e.target.value)}
                            placeholder="VOLTPLAN INDUSTRIES"
                            className="bg-[#0d0d12] border border-zinc-800 hover:border-zinc-700 text-white rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500/80 font-medium"
                          />
                        </div>

                        {/* Company Address */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase">Adresse</span>
                          <input
                            type="text"
                            value={companyAddress}
                            onChange={(e) => setCompanyAddress(e.target.value)}
                            placeholder="15 Rue de la Technologie, 75008 Paris"
                            className="bg-[#0d0d12] border border-zinc-800 hover:border-zinc-700 text-white rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500/80 font-medium"
                          />
                        </div>

                        {/* Company Contact */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase">Contact (Tél | Email)</span>
                          <input
                            type="text"
                            value={companyContact}
                            onChange={(e) => setCompanyContact(e.target.value)}
                            placeholder="Tél: +33 1 89 20 40 50 | contact@voltplan.tech"
                            className="bg-[#0d0d12] border border-zinc-800 hover:border-zinc-700 text-white rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500/80 font-medium"
                          />
                        </div>

                        {/* SIRET & TVA */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase">SIRET & TVA</span>
                          <input
                            type="text"
                            value={companySiret}
                            onChange={(e) => setCompanySiret(e.target.value)}
                            placeholder="SIRET: 987 654 321 00012 | TVA: FR12987654321"
                            className="bg-[#0d0d12] border border-zinc-800 hover:border-zinc-700 text-white rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500/80 font-medium"
                          />
                        </div>

                        {/* Custom Plan Title */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase">Nom du Plan (Surcharge)</span>
                          <input
                            type="text"
                            value={customPlanTitle}
                            onChange={(e) => setCustomPlanTitle(e.target.value)}
                            placeholder={currentSheet?.name || "Titre du plan"}
                            className="bg-[#0d0d12] border border-zinc-800 hover:border-zinc-700 text-white rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500/80 font-medium"
                          />
                        </div>

                        {/* Plan Reference */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase">N° de Référence</span>
                          <input
                            type="text"
                            value={planReference}
                            onChange={(e) => setPlanReference(e.target.value)}
                            placeholder="REF-2026-001"
                            className="bg-[#0d0d12] border border-zinc-800 hover:border-zinc-700 text-white rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500/80 font-medium"
                          />
                        </div>

                        {/* Plan Custom Date */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase">Date de Publication</span>
                          <input
                            type="text"
                            value={planCustomDate}
                            onChange={(e) => setPlanCustomDate(e.target.value)}
                            className="bg-[#0d0d12] border border-zinc-800 hover:border-zinc-700 text-white rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500/80 font-medium"
                          />
                        </div>

                        {/* Author name (integrated directly here) */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase">Auteur Concepteur</span>
                          <input
                            type="text"
                            value={authorName}
                            onChange={(e) => setAuthorName(e.target.value)}
                            placeholder="Expert Security Integrator"
                            className="bg-[#0d0d12] border border-zinc-800 hover:border-zinc-700 text-white rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500/80 font-medium"
                          />
                        </div>

                        {/* Electrical security / Norm warnings */}
                        <div className="flex flex-col gap-1 col-span-1 sm:col-span-2">
                          <span className="text-[8.5px] text-zinc-400 font-bold uppercase">Texte de Sécurité & Conformité</span>
                          <input
                            type="text"
                            value={securityText}
                            onChange={(e) => setSecurityText(e.target.value)}
                            placeholder="CONTRÔLE DE SÉCURITÉ & CONFORMITÉ ÉLECTRIQUE..."
                            className="bg-[#0d0d12] border border-zinc-800 hover:border-zinc-700 text-white rounded px-2.5 py-1.5 text-[11px] focus:outline-none focus:border-blue-500/80 font-medium"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Imported Assets Group */}
                  {includeTitleBlock && (
                    <div className="bg-[#141419] p-3 rounded-lg border border-zinc-800/80 flex flex-col gap-3 col-span-1 sm:col-span-2 animate-in fade-in zoom-in-95 duration-200">
                      <div className="flex items-center gap-1.5 border-b border-zinc-800/50 pb-1.5">
                        <UploadCloud size={13} className="text-blue-400" />
                        <span className="text-[10px] text-zinc-300 font-bold uppercase tracking-wider leading-none">
                          Éléments Graphiques <span className="text-zinc-500 font-normal">/ Uploads</span>
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                        {/* Custom Logo Upload */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Logo Entreprise</span>
                          <div className="relative border border-dashed border-zinc-800 rounded-lg p-1.5 flex flex-col items-center justify-center bg-[#0d0d12] hover:bg-zinc-900/30 hover:border-zinc-700 transition-colors h-16 group select-none">
                            {customLogo ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img src={customLogo} alt="Logo" className="max-h-full max-w-full object-contain rounded" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => setCustomLogo('')}
                                  className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 transition-colors shadow-lg"
                                  title="Supprimer"
                                >
                                  <Trash2 size={8} />
                                </button>
                              </div>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                <Building2 size={14} className="text-zinc-600 group-hover:text-blue-400 mb-0.5 transition-colors" />
                                <span className="text-[7.5px] text-zinc-400 text-center font-medium leading-none">Importer Logo</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => setCustomLogo(reader.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Custom Stamp Upload */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Cachet / Stamp</span>
                          <div className="relative border border-dashed border-zinc-800 rounded-lg p-1.5 flex flex-col items-center justify-center bg-[#0d0d12] hover:bg-zinc-900/30 hover:border-zinc-700 transition-colors h-16 group select-none">
                            {customStamp ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img src={customStamp} alt="Cachet" className="max-h-full max-w-full object-contain rounded" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => setCustomStamp('')}
                                  className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 transition-colors shadow-lg"
                                  title="Supprimer"
                                >
                                  <Trash2 size={8} />
                                </button>
                              </div>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                <BadgeCheck size={14} className="text-zinc-600 group-hover:text-blue-400 mb-0.5 transition-colors" />
                                <span className="text-[7.5px] text-zinc-400 text-center font-medium leading-none">Importer Cachet</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => setCustomStamp(reader.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>

                        {/* Custom Signature Upload */}
                        <div className="flex flex-col gap-1">
                          <span className="text-[8px] text-zinc-400 font-bold uppercase tracking-wider">Signature</span>
                          <div className="relative border border-dashed border-zinc-800 rounded-lg p-1.5 flex flex-col items-center justify-center bg-[#0d0d12] hover:bg-zinc-900/30 hover:border-zinc-700 transition-colors h-16 group select-none">
                            {customSignature ? (
                              <div className="relative w-full h-full flex items-center justify-center">
                                <img src={customSignature} alt="Signature" className="max-h-full max-w-full object-contain rounded" referrerPolicy="no-referrer" />
                                <button
                                  type="button"
                                  onClick={() => setCustomSignature('')}
                                  className="absolute -top-1.5 -right-1.5 bg-red-600 hover:bg-red-500 text-white rounded-full p-1 transition-colors shadow-lg"
                                  title="Supprimer"
                                >
                                  <Trash2 size={8} />
                                </button>
                              </div>
                            ) : (
                              <label className="w-full h-full flex flex-col items-center justify-center cursor-pointer">
                                <Feather size={14} className="text-zinc-600 group-hover:text-blue-400 mb-0.5 transition-colors" />
                                <span className="text-[7.5px] text-zinc-400 text-center font-medium leading-none">Importer Signature</span>
                                <input
                                  type="file"
                                  accept="image/*"
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onload = () => setCustomSignature(reader.result as string);
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                  className="hidden"
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Right Estimations and Virtual Preview Column */}
            <div className="w-full md:w-[320px] bg-[#222228] p-5 rounded-xl border border-[#2e2e36] flex flex-col justify-between">
              
              <div className="space-y-4">
                <span className="text-[10px] text-zinc-400 font-bold uppercase block">Layout Export Metrics</span>
                
                {/* Virtual preview icon showing border & titleblock positioning */}
                <div className="aspect-[4/3] w-full bg-[#121215] rounded-lg border border-[#33333c] relative overflow-hidden flex flex-col justify-between p-2">
                  <div className="absolute inset-0 flex items-center justify-center opacity-10">
                    <Printer size={50} />
                  </div>
                  
                  {/* Mock outer border */}
                  {includeBorder && (
                    <div className="absolute inset-1.5 border border-[#444] rounded pointer-events-none flex flex-col justify-between p-1">
                      
                      {/* Grid overlay visualization inside */}
                      {includeGrid && (
                        <div className="absolute inset-0 bg-[linear-gradient(to_right,#333_1px,transparent_1px),linear-gradient(to_bottom,#333_1px,transparent_1px)] bg-[size:10px_10px] opacity-10" />
                      )}

                      {/* Mock Canvas Plan */}
                      <div className="w-full h-[65%] border border-[#333]/80 bg-[#1a1a1e]/80 flex items-center justify-center text-[10px] text-zinc-500 font-bold select-none">
                        Blueprint Content
                      </div>

                      {/* Legend bottom left mockup */}
                      <div className="flex justify-between items-end w-full">
                        <div className="w-[30%] h-6 bg-[#25252c]/90 rounded border border-[#444] p-0.5 flex flex-col gap-[1px]">
                          <div className="w-4/5 h-[3px] bg-blue-500 rounded-[1px]" />
                          <div className="w-3/5 h-[2px] bg-zinc-600 rounded-[1px]" />
                          <div className="w-1/2 h-[2px] bg-zinc-600 rounded-[1px]" />
                        </div>

                        {/* Cartouche bottom right mockup */}
                        {includeTitleBlock ? (
                          <div className="w-[50%] h-6 bg-[#25252c]/90 rounded border border-[#444] p-0.5 flex flex-col justify-center gap-[2px]">
                            <div className="w-4/5 h-[3px] bg-zinc-500 rounded-[1px]" />
                            <div className="flex gap-1">
                              <div className="w-2/5 h-[2px] bg-zinc-600 rounded-[1px]" />
                              <div className="w-2/5 h-[2px] bg-emerald-500 rounded-[1px]" />
                            </div>
                          </div>
                        ) : (
                          <div className="w-[30%] h-3 bg-red-900/40 rounded border border-red-800/20" />
                        )}
                      </div>

                    </div>
                  )}

                  {!includeBorder && (
                    <div className="w-full h-full flex items-center justify-center text-xs text-zinc-500 select-none">
                      Full Bleed Sheet Only
                    </div>
                  )}
                </div>

                {/* Technical specs breakdown card */}
                <div className="space-y-2 bg-[#17171c] p-3 rounded-lg border border-[#2a2a32]">
                  <div className="flex justify-between items-center text-xs border-b border-[#222] pb-1.5">
                    <span className="text-zinc-400">Total Pixels:</span>
                    <span className="font-mono text-zinc-100 font-bold">
                      {dimensionsInfo.width} x {dimensionsInfo.height}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-b border-[#222] pb-1.5">
                    <span className="text-zinc-400">Output Quality:</span>
                    <span className={`font-mono text-[10px] font-extrabold px-1.5 py-0.5 rounded uppercase ${
                      dimensionsInfo.megapixel > 15 
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                        : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                    }`}>
                      {dimensionsInfo.megapixel > 15 ? 'Studio / Print Ready' : 'Web / HD Standard'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs border-b border-[#222] pb-1.5">
                    <span className="text-zinc-400">Print Size ({dpiPreset} DPI):</span>
                    <span className="font-mono text-zinc-100 font-bold">
                      {dimensionsInfo.printW.toFixed(1)}" x {dimensionsInfo.printH.toFixed(1)}"
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-xs">
                    <span className="text-zinc-400">Est. File Weight:</span>
                    <span className="font-mono text-amber-400 font-bold">
                      {dimensionsInfo.estSize}
                    </span>
                  </div>
                </div>

                {/* Warnings Section */}
                {dimensionsInfo.isCapped && (
                  <div className="p-2.5 bg-amber-500/10 border border-amber-500/20 rounded-lg flex gap-2 text-amber-400 items-start">
                    <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                    <span className="text-[9.5px] leading-snug">
                      Dimensions capped at 8K limit to guarantee browser stability and prevent system crashes.
                    </span>
                  </div>
                )}

                {dimensionsInfo.megapixel > 16 && (
                  <div className="p-2.5 bg-blue-500/10 border border-blue-500/20 rounded-lg flex gap-2 text-blue-400 items-start">
                    <Info size={14} className="flex-shrink-0 mt-0.5" />
                    <span className="text-[9.5px] leading-snug">
                      High megapixel count ({dimensionsInfo.megapixel.toFixed(1)} MP). Rendering may take several seconds.
                    </span>
                  </div>
                )}
              </div>

              {/* Loader / Generation progress drawer */}
              {isGenerating ? (
                <div className="mt-4 p-4 bg-[#14141a] rounded-xl border border-[#2e2e36] text-center space-y-2">
                  <div className="flex items-center justify-center gap-2 text-zinc-200">
                    <Loader2 className="animate-spin text-blue-500" size={16} />
                    <span className="text-xs font-bold">Compiling Blueprint...</span>
                  </div>
                  <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-500 h-full transition-all duration-300"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                  <span className="text-[9px] text-zinc-400 block font-mono h-4">{progressMessage}</span>
                </div>
              ) : (
                <button
                  onClick={handleExportExecute}
                  className="mt-4 w-full bg-blue-600 hover:bg-blue-500 active:scale-95 text-white py-2.5 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/30"
                >
                  <Download size={14} />
                  <span>Start High-Res Export</span>
                </button>
              )}

            </div>

          </div>

          {/* Footer branding */}
          <div className="px-6 py-2 border-t border-[#2e2e36] bg-[#14141a] flex justify-between text-[9px] text-zinc-500 font-mono">
            <span>VoltPlan Print Calibration System</span>
            <span>v1.2.4 • 8K Raster Engine Active</span>
          </div>

        </motion.div>
      </div>
      )}
    </AnimatePresence>
  );
}
