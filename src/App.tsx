import { useState, useEffect, useRef } from 'react';
import { AnimatePresence } from 'framer-motion';
import { Routes, Route } from 'react-router-dom';
import AdminDashboard from './components/Admin/AdminDashboard';
import MainLayout from './components/Layout/MainLayout';
import EquipmentInventoryModal from './components/UI/EquipmentInventoryModal';
import DesignCanvas from './components/Editor/DesignCanvas';
import ExportSettingsModal from './components/Editor/ExportSettingsModal';
import CorporateSite from './components/Corporate/CorporateSite';
import InvoicePublicView from './components/Corporate/InvoicePublicView';
import ProjectPublicView from './components/Corporate/ProjectPublicView';
import { loadPDF, renderPageToCanvas } from './lib/pdf-utils';
import { Equipment, Cable, EquipmentType, PlanSheet, Layer, CustomCableType } from './types';
import { FileUp, FileText, Image as ImageIcon, Sparkles, Download } from 'lucide-react';
import { getIconImageElement } from './lib/icon-registry';
import { useProjectStore } from './store/useProjectStore';

// Enable cross-tab synchronization for the Zustand store
if (typeof window !== 'undefined') {
  window.addEventListener('storage', (event) => {
    if (event.key === 'voltplan-pro-unified-store') {
      useProjectStore.persist.rehydrate();
    }
  });
}

function drawEquipmentOnCanvas(
  ctx: CanvasRenderingContext2D,
  item: Equipment,
  scale: number,
  iconScale: number = 1
) {
  const x = item.x * scale;
  const y = item.y * scale;
  const rotationRad = (item.rotation * Math.PI) / 180;

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(rotationRad);

  // 1. Draw premium functional architectural/engineering overlays
  if (item.type === 'CCTV' || item.type === 'CCTV_DOME' || item.type === 'CCTV_BULLET') {
    const focalLength = item.properties?.focalLength || 2.8;
    // Map focalLength to fovAngle and reach:
    let fovAngle = item.properties?.fovAngle !== undefined ? item.properties.fovAngle : 100;
    let reach = item.properties?.reach !== undefined ? item.properties.reach : 110;
    if (item.properties?.fovAngle === undefined && item.properties?.reach === undefined) {
      if (focalLength === 4) { fovAngle = 80; reach = 140; }
      else if (focalLength === 6) { fovAngle = 60; reach = 180; }
      else if (focalLength === 8) { fovAngle = 45; reach = 220; }
      else if (focalLength === 12) { fovAngle = 25; reach = 280; }
    }

    const reachScaled = reach * scale;
    const startAngleRad = (-90 - fovAngle / 2) * Math.PI / 180;
    const endAngleRad = (-90 + fovAngle / 2) * Math.PI / 180;

    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.arc(0, 0, reachScaled, startAngleRad, endAngleRad);
    ctx.closePath();
    ctx.fillStyle = 'rgba(59, 130, 246, 0.12)';
    ctx.fill();
    ctx.lineWidth = 1 * scale;
    ctx.strokeStyle = 'rgba(59, 130, 246, 0.35)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (item.type === 'WIFI' || item.type === 'WIFI_ROUTER') {
    const coverageRange = (item.properties?.coverageRange || 80) * scale;
    // Coverage area propagation
    ctx.beginPath();
    ctx.arc(0, 0, coverageRange, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(34, 197, 94, 0.08)';
    ctx.fill();

    // Concentric wave lines
    ctx.beginPath();
    ctx.arc(0, 0, 20 * scale, 0, 2 * Math.PI);
    ctx.lineWidth = 0.75 * scale;
    ctx.strokeStyle = 'rgba(34, 197, 94, 0.4)';
    ctx.setLineDash([3, 3]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (item.type === 'FIRE' || item.type === 'FIRE_DETECTOR') {
    const coverageRange = (item.properties?.coverageRange || 50) * scale;
    // Safety range circle
    ctx.beginPath();
    ctx.arc(0, 0, coverageRange, 0, 2 * Math.PI);
    ctx.lineWidth = 1 * scale;
    ctx.strokeStyle = 'rgba(239, 68, 68, 0.18)';
    ctx.setLineDash([4, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  } else if (item.type === 'ALARM_SIREN') {
    const coverageRange = (item.properties?.coverageRange || 60) * scale;
    // Siren range circle
    ctx.beginPath();
    ctx.arc(0, 0, coverageRange, 0, 2 * Math.PI);
    ctx.lineWidth = 1 * scale;
    ctx.strokeStyle = 'rgba(244, 63, 94, 0.25)';
    ctx.setLineDash([2, 4]);
    ctx.stroke();
    ctx.setLineDash([]);
  }

  // 2. Render Centralized High-Resolution SVG Icon Component
  const iconImg = getIconImageElement(item.type);
  if (iconImg) {
    const size = 44 * scale * iconScale;
    ctx.drawImage(iconImg, -size / 2, -size / 2, size, size);
  }

  // 3. Draw device model text label below
  ctx.restore(); 
  ctx.save();
  ctx.translate(x, y);
  ctx.fillStyle = '#ffffff';
  ctx.font = `bold ${Math.max(8, Math.round(8 * scale))}px Montserrat, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  ctx.shadowColor = 'black';
  ctx.shadowBlur = 3;
  ctx.fillText(item.subType, 0, (22 * iconScale + 6) * scale);
  ctx.restore();
}

export default function App() {
  return (
    <Routes>
      <Route path="/invoice/:invoiceId" element={<InvoicePublicView />} />
      <Route path="/project/:id" element={<ProjectPublicView />} />
      <Route path="/*" element={<MainAppContent />} />
    </Routes>
  );
}

function MainAppContent() {
  const [currentView, setCurrentView] = useState<'corporate' | 'designer' | 'dashboard'>('corporate');
  
  const sheets = useProjectStore(state => state.sheets);
  const setSheets = useProjectStore(state => state.setSheets);
  const history = useProjectStore(state => state.history);
  const historyIndex = useProjectStore(state => state.historyIndex);
  const undo = useProjectStore(state => state.undo);
  const redo = useProjectStore(state => state.redo);
  const customCableTypes = useProjectStore(state => state.customCableTypes);
  const setCustomCableTypes = useProjectStore(state => state.setCustomCableTypes);
  const customEquipmentTypes = useProjectStore(state => state.customEquipmentTypes);
  const setCustomEquipmentTypes = useProjectStore(state => state.setCustomEquipmentTypes);
  const [currentSheetId, setCurrentSheetId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [iconScale, setIconScale] = useState(1);
  const [selectedTool, setSelectedTool] = useState<EquipmentType | 'SELECT' | 'MEASURE' | 'CABLE' | 'MARQUEE'>('SELECT');
  const [selectedEquipmentId, setSelectedEquipmentId] = useState<string | null>(null);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [inventoryInitialTab, setInventoryInitialTab] = useState<'LIST' | 'INVOICE' | 'DATABASE' | 'SETTINGS' | 'CLIENTS' | 'DASHBOARD' | 'BILLING_MGMT' | 'HISTORY'>('INVOICE');
  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    return (localStorage.getItem('app-theme') as 'dark' | 'light') || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('app-theme', theme);
    if (theme === 'light') {
      document.body.classList.add('light');
    } else {
      document.body.classList.remove('light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const openInventory = (tab: 'LIST' | 'INVOICE' | 'DATABASE' | 'SETTINGS' | 'DASHBOARD' | 'BILLING_MGMT' | 'HISTORY' = 'INVOICE') => {
    setInventoryInitialTab(tab);
    setShowInventoryModal(true);
  };
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [isExportingPdf, setIsExportingPdf] = useState(false);
  const [isExportSettingsOpen, setIsExportSettingsOpen] = useState(false);
  const [exportInitTarget, setExportInitTarget] = useState<'current' | 'all'>('current');
  const [exportInitFormat, setExportInitFormat] = useState<'png' | 'pdf'>('png');
  const [layers, setLayers] = useState<Layer[]>([
    { id: 'PLAN', name: 'Plan Original', visible: true, locked: true, type: 'PLAN', opacity: 1 },
    { id: 'CCTV', name: 'CCTV', visible: true, locked: false, type: 'CCTV', opacity: 1 },
    { id: 'NETWORK', name: 'Network', visible: true, locked: false, type: 'NETWORK', opacity: 1 },
    { id: 'WIFI', name: 'WiFi', visible: true, locked: false, type: 'WIFI', opacity: 1 },
    { id: 'FIRE', name: 'Fire Safety', visible: true, locked: false, type: 'FIRE', opacity: 1 },
  ]);
  const [focusedLayerId, setFocusedLayerId] = useState<string | null>(null);
  const [preFocusLayers, setPreFocusLayers] = useState<Layer[] | null>(null);

  const handleToggleLayerFocus = (layerId: string) => {
    if (focusedLayerId === layerId) {
      // Restore all layers that were previously visible
      if (preFocusLayers) {
        setLayers(preFocusLayers);
      } else {
        setLayers(prev => prev.map(l => ({ ...l, visible: true })));
      }
      setFocusedLayerId(null);
      setPreFocusLayers(null);
    } else {
      // Save current state before focusing
      setPreFocusLayers([...layers]);
      // Hide all layers except the focused one
      setLayers(prev => prev.map(l => ({
        ...l,
        visible: l.id === layerId
      })));
      setFocusedLayerId(layerId);
    }
  };

  const [currency, setCurrency] = useState(() => localStorage.getItem('invoice_currency') || 'F CFA');

  useEffect(() => {
    localStorage.setItem('invoice_currency', currency);
  }, [currency]);

  const currentSheet = sheets.find(s => s.id === currentSheetId);

  // Compute values for the currently selected sheet
  const equipment = currentSheet ? currentSheet.equipment : [];
  const cables = currentSheet ? currentSheet.cables : [];
  const canvasBg = currentSheet ? currentSheet.canvasBg : undefined;
  const dimensions = currentSheet ? currentSheet.dimensions : { width: 800, height: 600 };
  const selectedEquipment = equipment.find(e => e.id === selectedEquipmentId);
  const selectedCable = cables.find(c => c.id === selectedEquipmentId);

  // Wrappers to update current sheet properties inside sheets state
  const setEquipment = (updatedEquip: Equipment[] | ((prev: Equipment[]) => Equipment[])) => {
    if (!currentSheetId) return;
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id === currentSheetId) {
        const nextEquip = typeof updatedEquip === 'function' ? updatedEquip(sheet.equipment) : updatedEquip;
        return { ...sheet, equipment: nextEquip };
      }
      return sheet;
    }));
  };

  const setCables = (updatedCables: Cable[] | ((prev: Cable[]) => Cable[])) => {
    if (!currentSheetId) return;
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id === currentSheetId) {
        const nextCables = typeof updatedCables === 'function' ? updatedCables(sheet.cables) : updatedCables;
        return { ...sheet, cables: nextCables };
      }
      return sheet;
    }));
  };

  const handleUpdateEquipment = (updated: Equipment) => {
    setEquipment(equipment.map(e => e.id === updated.id ? updated : e));
  };

  const handleDeleteEquipment = (id: string) => {
    setEquipment(equipment.filter(e => e.id !== id));
    if (selectedEquipmentId === id) {
      setSelectedEquipmentId(null);
    }
  };

  const handleUpdateCable = (updated: Cable) => {
    setCables(cables.map(c => c.id === updated.id ? updated : c));
  };

  const handleDeleteCable = (id: string) => {
    setCables(cables.filter(c => c.id !== id));
    if (selectedEquipmentId === id) {
      setSelectedEquipmentId(null);
    }
  };

  const handleUpdateMultipleEquipment = (updatedList: Equipment[]) => {
    const map = new Map(updatedList.map(e => [e.id, e]));
    setEquipment(prev => prev.map(e => map.has(e.id) ? map.get(e.id)! : e));
  };

  const handleAddMultipleEquipment = (newItems: Equipment[]) => {
    setEquipment(prev => [...prev, ...newItems]);
  };

  const handleDeleteMultipleEquipment = (ids: string[]) => {
    setEquipment(prev => prev.filter(e => !ids.includes(e.id)));
    if (selectedEquipmentId && ids.includes(selectedEquipmentId)) {
      setSelectedEquipmentId(null);
    }
  };

  const setScaleRatio = (ratio: number) => {
    if (!currentSheetId) return;
    setSheets(prevSheets => prevSheets.map(sheet => {
      if (sheet.id === currentSheetId) {
        return { ...sheet, scaleRatio: ratio };
      }
      return sheet;
    }));
  };

  const [clipboardEquipment, setClipboardEquipment] = useState<Equipment | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger if typing in an input
      if (document.activeElement?.tagName === 'INPUT' || document.activeElement?.tagName === 'TEXTAREA') {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEquipmentId) {
          handleDeleteEquipment(selectedEquipmentId);
          handleDeleteCable(selectedEquipmentId);
        }
      } else if (e.key === 'Escape') {
        setSelectedEquipmentId(null);
        setSelectedTool('SELECT');
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
        if (selectedEquipmentId) {
          const item = equipment.find(eq => eq.id === selectedEquipmentId);
          if (item) setClipboardEquipment(item);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
        if (clipboardEquipment) {
          const newEquipment: Equipment = {
            ...clipboardEquipment,
            id: Math.random().toString(36).substr(2, 9),
            x: clipboardEquipment.x + 20,
            y: clipboardEquipment.y + 20,
          };
          setEquipment(prev => [...prev, newEquipment]);
          setSelectedEquipmentId(newEquipment.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEquipmentId, equipment, cables, clipboardEquipment]);

  const handleImportFiles = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newSheetsList: PlanSheet[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type === 'application/pdf') {
        try {
          const fileUrl = URL.createObjectURL(file);
          const pdfDoc = await loadPDF(fileUrl);
          const tempCanvas = document.createElement('canvas');
          
          for (let pageNum = 1; pageNum <= pdfDoc.numPages; pageNum++) {
            // Render at high scale (4x) for ultra-crisp vector detail
            const renderScale = 4;
            const viewport = await renderPageToCanvas(pdfDoc, pageNum, tempCanvas, renderScale);
            const canvasBg = tempCanvas.toDataURL('image/png', 1.0);
            
            newSheetsList.push({
              id: `${file.name}-page-${pageNum}-${Math.random().toString(36).substr(2, 5)}`,
              name: `${file.name} (P. ${pageNum})`,
              type: 'pdf',
              pageNum,
              canvasBg,
              dimensions: { 
                width: viewport.width / renderScale, 
                height: viewport.height / renderScale 
              },
              equipment: [],
              cables: []
            });
          }
        } catch (error) {
          console.error('Failed to load PDF file:', file.name, error);
        }
      } else if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          const loadImgPromise = new Promise<{ width: number; height: number; dataUrl: string }>((resolve, reject) => {
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              const img = new Image();
              img.onload = () => {
                resolve({
                  width: img.naturalWidth || 1000,
                  height: img.naturalHeight || 700,
                  dataUrl
                });
              };
              img.onerror = reject;
              img.src = dataUrl;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const imgData = await loadImgPromise;
          newSheetsList.push({
            id: `${file.name}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            type: 'image',
            canvasBg: imgData.dataUrl,
            dimensions: { width: imgData.width, height: imgData.height },
            equipment: [],
            cables: []
          });
        } catch (error) {
          console.error('Failed to load image file:', file.name, error);
        }
      }
    }

    if (newSheetsList.length > 0) {
      setSheets(prev => {
        const updated = [...prev, ...newSheetsList];
        if (!currentSheetId) {
          setCurrentSheetId(newSheetsList[0].id);
        }
        return updated;
      });
    }
  };

  const handleImportImageOverlay = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!currentSheetId) return;
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newImages: any[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.type.startsWith('image/')) {
        try {
          const reader = new FileReader();
          const loadImgPromise = new Promise<{ width: number; height: number; dataUrl: string }>((resolve, reject) => {
            reader.onload = (event) => {
              const dataUrl = event.target?.result as string;
              const img = new Image();
              img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight, dataUrl });
              img.onerror = reject;
              img.src = dataUrl;
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
          });

          const imgData = await loadImgPromise;
          newImages.push({
            id: `img-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
            name: file.name,
            src: imgData.dataUrl,
            width: Math.min(imgData.width, 800), // Default constraint
            height: imgData.height * (Math.min(imgData.width, 800) / imgData.width),
            x: 200 + i * 50,
            y: 200 + i * 50,
            rotation: 0
          });
        } catch (error) {
          console.error('Failed to load image overlay:', file.name, error);
        }
      }
    }

    if (newImages.length > 0) {
      setSheets(prev => prev.map(sheet => {
        if (sheet.id === currentSheetId) {
          return {
            ...sheet,
            images: [...(sheet.images || []), ...newImages]
          };
        }
        return sheet;
      }));
    }

    e.target.value = '';
  };

  const handleSelectSheet = (id: string) => {
    setCurrentSheetId(id);
    setSelectedEquipmentId(null);
  };

  const handleDeleteSheet = (id: string) => {
    setSheets(prev => {
      const nextSheets = prev.filter(s => s.id !== id);
      if (currentSheetId === id) {
        setCurrentSheetId(nextSheets[0]?.id || null);
      }
      return nextSheets;
    });
  };

  const handleClearSheet = () => {
    if (!currentSheetId) return;
    setSheets(prev => prev.map(s => {
      if (s.id === currentSheetId) {
        return { ...s, equipment: [], cables: [] };
      }
      return s;
    }));
    setSelectedEquipmentId(null);
  };

  const handleClearAllSheets = () => {
    setSheets([]);
    setCurrentSheetId(null);
    setSelectedEquipmentId(null);
  };

  const handleDuplicateSheet = () => {
    if (!currentSheet) return;
    const nextId = Math.random().toString(36).substr(2, 9);
    const newSheet: PlanSheet = {
      ...currentSheet,
      id: nextId,
      name: `${currentSheet.name} (Copy)`,
      equipment: currentSheet.equipment.map(eq => ({
        ...eq,
        id: Math.random().toString(36).substr(2, 9)
      })),
      cables: currentSheet.cables.map(cab => ({
        ...cab,
        id: Math.random().toString(36).substr(2, 9)
      }))
    };
    setSheets(prev => [...prev, newSheet]);
    setCurrentSheetId(nextId);
  };

  const handleCopySelected = () => {
    if (selectedEquipment) {
      setClipboardEquipment(selectedEquipment);
    }
  };

  const handlePasteSelected = () => {
    if (clipboardEquipment) {
      const newEquipment: Equipment = {
        ...clipboardEquipment,
        id: Math.random().toString(36).substr(2, 9),
        x: clipboardEquipment.x + 25,
        y: clipboardEquipment.y + 25,
      };
      setEquipment(prev => [...prev, newEquipment]);
      setSelectedEquipmentId(newEquipment.id);
    }
  };

  const handleExport = async () => {
    setExportInitTarget('current');
    setExportInitFormat('png');
    setIsExportSettingsOpen(true);
  };

  const handleExportAllPdf = async () => {
    setExportInitTarget('all');
    setExportInitFormat('pdf');
    setIsExportSettingsOpen(true);
  };

  const getEquipmentDefaults = (type: EquipmentType) => {
    switch (type) {
      case 'CCTV_DOME':
        return { subType: 'Dome Camera', layerId: 'CCTV' };
      case 'CCTV_BULLET':
        return { subType: 'Bullet Camera', layerId: 'CCTV' };
      case 'WIFI_ROUTER':
        return { subType: 'Access Point', layerId: 'WIFI' };
      case 'SWITCH_RACK':
        return { subType: 'Network Switch', layerId: 'NETWORK' };
      case 'SERVER_RACK':
        return { subType: 'Server Rack', layerId: 'NETWORK' };
      case 'FIRE_DETECTOR':
        return { subType: 'Smoke Detector', layerId: 'FIRE' };
      case 'ALARM_SIREN':
        return { subType: 'Alarm Siren', layerId: 'FIRE' };
      case 'CONTROL_PANEL':
        return { subType: 'Touchpad Panel', layerId: 'NETWORK' };
      case 'ACCESS_CONTROL':
        return { subType: 'Badge Reader', layerId: 'CCTV' };
      case 'INTERCOM':
        return { subType: 'IP Intercom', layerId: 'CCTV' };
      case 'UPS_BATTERY':
        return { subType: 'UPS Backup', layerId: 'NETWORK' };
      case 'TEXT':
        return { subType: 'New Text', layerId: 'ANNOTATION' };
      case 'RECTANGLE':
        return { subType: 'Rectangle', layerId: 'ANNOTATION' };
      case 'CIRCLE':
        return { subType: 'Circle', layerId: 'ANNOTATION' };
      case 'CCTV':
        return { subType: 'Dome', layerId: 'CCTV' };
      case 'WIFI':
        return { subType: 'AP', layerId: 'WIFI' };
      case 'FIRE':
        return { subType: 'Sensor', layerId: 'FIRE' };
      case 'NETWORK':
        return { subType: 'Switch', layerId: 'NETWORK' };
      case 'SECURITY':
        return { subType: 'Security Device', layerId: 'CCTV' };
      default:
        return { subType: 'Device', layerId: 'NETWORK' };
    }
  };

  const handleCanvasClick = (pos: { x: number, y: number }) => {
    if (selectedTool === 'SELECT') return;

    const customEquip = customEquipmentTypes.find(t => t.id === selectedTool);
    const defaults = getEquipmentDefaults(customEquip ? customEquip.type : (selectedTool as EquipmentType));
    const newEquipment: Equipment = {
      id: Math.random().toString(36).substr(2, 9),
      type: selectedTool as EquipmentType,
      subType: customEquip ? customEquip.name : defaults.subType,
      x: pos.x,
      y: pos.y,
      rotation: 0,
      properties: customEquip ? {
        iconKey: customEquip.iconKey,
        price: customEquip.price,
        desc: customEquip.desc
      } : {},
      layerId: defaults.layerId,
    };

    setEquipment([...equipment, newEquipment]);
  };

  const handleDropAddEquipment = (type: string, pos: { x: number, y: number }) => {
    const customEquip = customEquipmentTypes.find(t => t.id === type);
    const defaults = getEquipmentDefaults(customEquip ? customEquip.type : (type as EquipmentType));
    const newEquipment: Equipment = {
      id: Math.random().toString(36).substr(2, 9),
      type: type as EquipmentType,
      subType: customEquip ? customEquip.name : defaults.subType,
      x: pos.x,
      y: pos.y,
      rotation: 0,
      properties: customEquip ? {
        iconKey: customEquip.iconKey,
        price: customEquip.price,
        desc: customEquip.desc
      } : {},
      layerId: defaults.layerId,
    };
    setEquipment(prev => [...prev, newEquipment]);
  };

  // Allow Esc key to reset placement tool to SELECT mode, and Delete/Backspace to delete selected items
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't trigger delete if user is typing in an input
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement).tagName)) return;

      if (e.key === 'Escape') {
        setSelectedTool('SELECT');
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedEquipmentId) {
          const isEquipment = equipment.some(eq => eq.id === selectedEquipmentId);
          const isCable = cables.some(c => c.id === selectedEquipmentId);
          
          if (isEquipment) {
            handleDeleteEquipment(selectedEquipmentId);
          } else if (isCable) {
            handleDeleteCable(selectedEquipmentId);
          } else {
            setSheets(prev => prev.map(sheet => {
              if (sheet.id === currentSheetId && sheet.images?.some(img => img.id === selectedEquipmentId)) {
                return {
                  ...sheet,
                  images: sheet.images.filter(img => img.id !== selectedEquipmentId)
                };
              }
              return sheet;
            }));
            setSelectedEquipmentId(null);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedEquipmentId, equipment, currentSheetId]);

  const handleAddCable = (
    points: { x: number; y: number }[],
    type: string,
    tension?: number,
    color?: string,
    strokeWidth?: number,
    cableTypeId?: string
  ) => {
    const newCable: Cable = {
      id: Math.random().toString(36).substr(2, 9),
      points: points.flatMap(p => [p.x, p.y]),
      type,
      color: color || '#3b82f6',
      layerId: 'layer-cables',
      tension,
      strokeWidth: strokeWidth || 3,
      cableTypeId
    };
    setCables(prev => [...prev, newCable]);
  };

  const handleAutoDetect = async () => {
    if (!canvasBg) return;
    setIsAnalyzing(true);
    setApiError(null);
    try {
      const response = await fetch('/api/analyze-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: canvasBg }),
      });
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Auto-detection failed');
      }

      if (data.detections) {
        const newEquips: Equipment[] = data.detections.map((d: any) => ({
          id: Math.random().toString(36).substr(2, 9),
          type: d.type as EquipmentType,
          subType: 'Auto-Detected',
          x: (d.x_percent / 100) * dimensions.width,
          y: (d.y_percent / 100) * dimensions.height,
          rotation: 0,
          properties: { reason: d.reason },
          layerId: d.type,
        }));
        setEquipment([...equipment, ...newEquips]);
      }
    } catch (error: any) {
      console.error('Auto-detection failed', error);
      setApiError(error.message);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (currentView === 'corporate') {
    return (
      <CorporateSite
        onOpenDesigner={() => setCurrentView('designer')}
        onOpenDashboard={() => setCurrentView('dashboard')}
        theme={theme}
        toggleTheme={toggleTheme}
      />
    );
  }

  if (currentView === 'dashboard') {
    return <AdminDashboard onNavigate={setCurrentView} onOpenInventory={openInventory} />;
  }

  return (
    <div className="min-h-screen bg-[#0f1115] text-white">
      <MainLayout
      onBackToSite={() => setCurrentView('corporate')}
      selectedTool={selectedTool}
      setSelectedTool={setSelectedTool}
      sheets={sheets}
      currentSheetId={currentSheetId}
      onSelectSheet={handleSelectSheet}
      onDeleteSheet={handleDeleteSheet}
      onClearSheet={handleClearSheet}
      onClearAllSheets={handleClearAllSheets}
      onDuplicateSheet={handleDuplicateSheet}
      onCopySelected={handleCopySelected}
      onPasteSelected={handlePasteSelected}
      onDeselect={() => setSelectedEquipmentId(null)}
      onDeleteSelected={() => {
        if (selectedEquipmentId) {
          handleDeleteEquipment(selectedEquipmentId);
          handleDeleteCable(selectedEquipmentId);
        }
      }}
      clipboardEquipment={clipboardEquipment}
      zoom={zoom}
      setZoom={setZoom}
      iconScale={iconScale}
      setIconScale={setIconScale}
      onExport={handleExport}
      onExportAllPdf={handleExportAllPdf}
      onImportFiles={handleImportFiles}
      onImportImageOverlay={handleImportImageOverlay}
      onAutoDetect={handleAutoDetect}
      isAnalyzing={isAnalyzing}
      selectedEquipment={selectedEquipment}
      onUpdateEquipment={handleUpdateEquipment}
      onDeleteEquipment={handleDeleteEquipment}
      selectedCable={selectedCable}
      onUpdateCable={handleUpdateCable}
      onDeleteCable={handleDeleteCable}
      selectedImageOverlay={currentSheet?.images?.find(img => img.id === selectedEquipmentId) || null}
      onUpdateImageOverlay={(updated) => {
        setSheets(prev => prev.map(s => {
          if (s.id === currentSheetId) {
            return {
              ...s,
              images: s.images?.map(img => img.id === updated.id ? updated : img)
            };
          }
          return s;
        }));
      }}
      onDeleteImageOverlay={(id) => {
        setSheets(prev => prev.map(s => {
          if (s.id === currentSheetId) {
            return {
              ...s,
              images: s.images?.filter(img => img.id !== id)
            };
          }
          return s;
        }));
        setSelectedEquipmentId(null);
      }}
      layers={layers}
      onUpdateLayer={(updated) => setLayers(prev => prev.map(l => l.id === updated.id ? updated : l))}
      focusedLayerId={focusedLayerId}
      onToggleLayerFocus={handleToggleLayerFocus}
      customCableTypes={customCableTypes}
      setCustomCableTypes={setCustomCableTypes}
      customEquipmentTypes={customEquipmentTypes}
      setCustomEquipmentTypes={setCustomEquipmentTypes}
      onUndo={undo}
      onRedo={redo}
      canUndo={historyIndex > 0}
      canRedo={historyIndex < history.length - 1}
      onOpenInventory={openInventory}
      currency={currency}
      theme={theme}
      toggleTheme={toggleTheme}
    >
      {sheets.length === 0 ? (
        <div className="flex flex-col items-center justify-center space-y-6 text-center animate-in fade-in duration-700 p-8 max-w-xl mx-auto">
          <div className="w-24 h-24 bg-blue-600/10 rounded-sm-full flex items-center justify-center border border-blue-600/30 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] shadow-2xl shadow-blue-500/10">
            <input 
              type="file" 
              id="pdf-upload" 
              className="hidden" 
              accept="application/pdf,image/*"
              multiple
              onChange={handleImportFiles}
            />
            <label htmlFor="pdf-upload" className="cursor-pointer">
              <svg className="w-12 h-12 text-[#007acc]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </label>
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight mb-2">Architectural Plan Designer</h1>
            <p className="text-zinc-400 text-sm leading-relaxed">
              Import one or multiple PDF vector plans or high-resolution architectural images (PNG, JPG, SVG). Your drawings will be kept in full-definition crisp detail.
            </p>
          </div>
          <label htmlFor="pdf-upload" className="bg-blue-600 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)] hover:bg-blue-700 px-8 py-3 rounded-sm-full font-bold transition-all cursor-pointer shadow-lg active:scale-95 text-sm">
            Select PDF / Image Plans
          </label>
          <div className="flex gap-4 text-[10px] text-zinc-500 uppercase font-bold tracking-widest pt-8 border-t border-zinc-700/50 shadow-sm w-full justify-center">
            <span className="flex items-center gap-1"><FileText size={12} /> Multi-page PDF</span>
            <span className="w-1 h-1 bg-zinc-700 rounded-sm-full my-auto" />
            <span className="flex items-center gap-1"><ImageIcon size={12} /> High-Res Images</span>
            <span className="w-1 h-1 bg-zinc-700 rounded-sm-full my-auto" />
            <span className="flex items-center gap-1"><Sparkles size={12} /> All-in-one PDF Export</span>
          </div>
        </div>
      ) : (
        <div className="relative group w-full h-full flex flex-col items-stretch justify-stretch">

          <DesignCanvas
            backgroundImage={canvasBg}
            width={dimensions.width}
            height={dimensions.height}
            zoom={zoom}
            setZoom={setZoom}
            iconScale={iconScale}
            equipment={equipment}
            cables={cables}
            onEquipmentClick={(id) => {
              setSelectedEquipmentId(id);
              setSelectedTool('SELECT');
            }}
            onCanvasClick={handleCanvasClick}
            selectedTool={selectedTool}
            onAddEquipmentAt={handleDropAddEquipment}
            onUpdateEquipment={handleUpdateEquipment}
            onUpdateMultipleEquipment={handleUpdateMultipleEquipment}
            onAddMultipleEquipment={handleAddMultipleEquipment}
            onDeleteMultipleEquipment={handleDeleteMultipleEquipment}
            selectedEquipmentId={selectedEquipmentId}
            onDeleteEquipment={handleDeleteEquipment}
            onAddCable={handleAddCable}
            scaleRatio={currentSheet?.scaleRatio}
            onUpdateScaleRatio={setScaleRatio}
            sheet={currentSheet}
            onUpdateSheet={(updatedSheet) => {
              setSheets(prev => prev.map(s => s.id === updatedSheet.id ? updatedSheet : s));
            }}
            layers={layers}
            customCableTypes={customCableTypes}
            customEquipmentTypes={customEquipmentTypes}
          />
          
          {/* Floating Zoom Controls */}
          <div className="absolute bottom-8 right-8 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
              onClick={() => setZoom(Math.min(zoom + 0.1, 5))}
              className="w-10 h-10 bg-[#2d2d2d] border border-[#444] rounded-sm flex items-center justify-center hover:bg-[#3d3d3d] shadow-xl text-white font-bold"
              title="Zoom In"
            >
              +
            </button>
            <button 
              onClick={() => setZoom(Math.max(zoom - 0.1, 0.1))}
              className="w-10 h-10 bg-[#2d2d2d] border border-[#444] rounded-sm flex items-center justify-center hover:bg-[#3d3d3d] shadow-xl text-white font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <button 
              onClick={() => setZoom(1)}
              className="bg-[#2d2d2d] border border-[#444] px-2 py-1 rounded-sm text-[10px] hover:bg-[#3d3d3d] shadow-xl text-white font-mono"
            >
              RESET
            </button>
          </div>
        </div>
      )}

      {isExportingPdf && (
        <div className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in duration-350">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-sm-full animate-spin mb-4" />
          <h2 className="text-lg font-bold text-white mb-1">Generating High-Definition PDF Document...</h2>
          <p className="text-xs text-zinc-400">Compiling and rendering all sheets with pixel-perfect vectors. Please wait.</p>
        </div>
      )}

      {apiError && (
        <div className="fixed top-8 right-8 z-50 bg-red-900/90 text-white p-4 rounded shadow-lg border border-red-700 animate-in slide-in-from-right-4">
          <div className="flex justify-between items-center gap-4">
            <p className="text-sm">{apiError}</p>
            <button onClick={() => setApiError(null)} className="text-white hover:text-red-200">✕</button>
          </div>
        </div>
      )}

      <ExportSettingsModal
        isOpen={isExportSettingsOpen}
        onClose={() => setIsExportSettingsOpen(false)}
        sheets={sheets}
        currentSheetId={currentSheetId}
        iconScale={iconScale}
        initialTarget={exportInitTarget}
        initialFormat={exportInitFormat}
        layers={layers}
      />
    </MainLayout>
    <AnimatePresence>
      {showInventoryModal && (
        <EquipmentInventoryModal
          sheets={sheets}
          customCableTypes={customCableTypes}
          customEquipmentTypes={customEquipmentTypes}
          onClose={() => setShowInventoryModal(false)}
          currency={currency}
          setCurrency={setCurrency}
          initialTab={inventoryInitialTab}
          theme={theme}
        />
      )}
    </AnimatePresence>
    </div>
  );
}
