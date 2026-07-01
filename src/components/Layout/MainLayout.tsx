import React, { useState } from 'react';
import { 
  Layout, 
  Camera, 
  Wifi, 
  Network as NetworkIcon, 
  ShieldAlert, 
  Layers, 
  MousePointer2, 
  MousePointerSquareDashed, 
  Square, 
  Circle, 
  Type, 
  Ruler, 
  FileUp, 
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings,
  Plus,
  Check,
  Trash2,
  FileText,
  Image as ImageIcon,
  Siren,
  Server,
  Tablet,
  Flame,
  Cpu,
  Video,
  Waypoints,
  Battery,
  Key,
  Phone,
  FilePlus,
  Copy,
  Clipboard,
  ZoomIn,
  ZoomOut,
  Eye,
  EyeOff,
  RefreshCw,
  Sparkles,
  Eraser,
  Undo,
  Redo,
  Coins,
  X,
  Sun,
  Moon,
  Focus,
  RotateCcw,
  Tv,
  Monitor
} from 'lucide-react';
import PdfPreviewModal from '../UI/PdfPreviewModal';
import AdminDashboard from '../Admin/AdminDashboard';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { EquipmentType, Equipment, PlanSheet, CustomCableType, Cable } from '../../types';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface MainLayoutProps {
  children: React.ReactNode;
  selectedTool: EquipmentType | 'SELECT' | 'MEASURE' | 'CABLE' | 'MARQUEE';
  setSelectedTool: (tool: EquipmentType | 'SELECT' | 'MEASURE' | 'CABLE' | 'MARQUEE') => void;
  sheets: PlanSheet[];
  currentSheetId: string | null;
  onSelectSheet: (id: string) => void;
  onDeleteSheet: (id: string) => void;
  zoom: number;
  setZoom: (z: number) => void;
  iconScale: number;
  setIconScale: (s: number) => void;
  onExport: () => void;
  onExportAllPdf: () => void;
  onImportFiles: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onImportImageOverlay?: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onAutoDetect?: () => void;
  isAnalyzing?: boolean;
  selectedEquipment?: Equipment | null;
  onUpdateEquipment?: (updated: Equipment) => void;
  onDeleteEquipment?: (id: string) => void;
  selectedCable?: Cable | null;
  onUpdateCable?: (updated: Cable) => void;
  onDeleteCable?: (id: string) => void;
  selectedImageOverlay?: import('../../types').PlanImage | null;
  onUpdateImageOverlay?: (updated: import('../../types').PlanImage) => void;
  onDeleteImageOverlay?: (id: string) => void;
  layers: import('../../types').Layer[];
  onUpdateLayer: (updated: import('../../types').Layer) => void;
  focusedLayerId?: string | null;
  onToggleLayerFocus?: (layerId: string) => void;
  customCableTypes: CustomCableType[];
  setCustomCableTypes: React.Dispatch<React.SetStateAction<CustomCableType[]>>;
  customEquipmentTypes: import('../../types').CustomEquipmentType[];
  setCustomEquipmentTypes: React.Dispatch<React.SetStateAction<import('../../types').CustomEquipmentType[]>>;
  onClearSheet?: () => void;
  onClearAllSheets?: () => void;
  onDuplicateSheet?: () => void;
  onCopySelected?: () => void;
  onPasteSelected?: () => void;
  onDeselect?: () => void;
  onDeleteSelected?: () => void;
  clipboardEquipment?: Equipment | null;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onOpenInventory: (tab?: 'LIST' | 'INVOICE' | 'DATABASE' | 'SETTINGS' | 'DASHBOARD') => void;
  currency: string;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
  onBackToSite?: () => void;
}

export default function MainLayout({ 
  children, 
  selectedTool, 
  setSelectedTool,
  sheets,
  currentSheetId,
  onSelectSheet,
  onDeleteSheet,
  zoom,
  setZoom,
  iconScale,
  setIconScale,
  onExport,
  onExportAllPdf,
  onImportFiles,
  onImportImageOverlay,
  onAutoDetect,
  isAnalyzing,
  selectedEquipment,
  onUpdateEquipment,
  onDeleteEquipment,
  selectedCable,
  onUpdateCable,
  onDeleteCable,
  selectedImageOverlay,
  onUpdateImageOverlay,
  onDeleteImageOverlay,
  layers,
  onUpdateLayer,
  focusedLayerId,
  onToggleLayerFocus,
  customCableTypes,
  setCustomCableTypes,
  customEquipmentTypes,
  setCustomEquipmentTypes,
  onClearSheet,
  onClearAllSheets,
  onDuplicateSheet,
  onCopySelected,
  onPasteSelected,
  onDeselect,
  onDeleteSelected,
  clipboardEquipment,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onOpenInventory,
  currency,
  theme,
  toggleTheme,
  onBackToSite
}: MainLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeMenu, setActiveMenu] = useState<'file' | 'edit' | 'view' | 'export' | null>(null);
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const [leftTab, setLeftTab] = useState<'design' | 'cables'>('design');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [editingCableTypeId, setEditingCableTypeId] = useState<string | null>(null);
  const [newCableTypeName, setNewCableTypeName] = useState('');
  const [newCableTypeColor, setNewCableTypeColor] = useState('#3b82f6');
  const [newCableTypeThickness, setNewCableTypeThickness] = useState(3);
  const [newCableTypeCost, setNewCableTypeCost] = useState(1.20);
  const [isAddingCableType, setIsAddingCableType] = useState(false);

  // Custom Equipment Management States
  const [editingCustomEquipId, setEditingCustomEquipId] = useState<string | null>(null);
  const [newCustomEquipName, setNewCustomEquipName] = useState('');
  const [newCustomEquipType, setNewCustomEquipType] = useState<EquipmentType>('CCTV');
  const [newCustomEquipIconKey, setNewCustomEquipIconKey] = useState<string>('CCTV_DOME');
  const [newCustomEquipDesc, setNewCustomEquipDesc] = useState('');
  const [newCustomEquipPrice, setNewCustomEquipPrice] = useState(120.00);
  const [isAddingCustomEquip, setIsAddingCustomEquip] = useState(false);

  const handleSaveCustomEquipment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCustomEquipName.trim()) return;

    if (editingCustomEquipId) {
      setCustomEquipmentTypes(prev => prev.map(t => t.id === editingCustomEquipId ? {
        ...t,
        name: newCustomEquipName,
        type: newCustomEquipType,
        subType: newCustomEquipName,
        desc: newCustomEquipDesc,
        price: newCustomEquipPrice,
        iconKey: newCustomEquipIconKey
      } : t));
      setEditingCustomEquipId(null);
    } else {
      const newType = {
        id: 'custom_' + Math.random().toString(36).substr(2, 9),
        name: newCustomEquipName,
        type: newCustomEquipType,
        subType: newCustomEquipName,
        desc: newCustomEquipDesc,
        price: newCustomEquipPrice,
        iconKey: newCustomEquipIconKey
      };
      setCustomEquipmentTypes(prev => [...prev, newType]);
    }

    // Reset form
    setNewCustomEquipName('');
    setNewCustomEquipType('CCTV');
    setNewCustomEquipIconKey('CCTV_DOME');
    setNewCustomEquipDesc('');
    setNewCustomEquipPrice(120.00);
    setIsAddingCustomEquip(false);
  };

  const handleSaveCableType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCableTypeName.trim()) return;

    if (editingCableTypeId) {
      setCustomCableTypes(prev => prev.map(t => t.id === editingCableTypeId ? {
        ...t,
        name: newCableTypeName,
        color: newCableTypeColor,
        thickness: newCableTypeThickness,
        costPerMeter: newCableTypeCost
      } : t));
      setEditingCableTypeId(null);
    } else {
      const newType: CustomCableType = {
        id: Math.random().toString(36).substr(2, 9),
        name: newCableTypeName,
        color: newCableTypeColor,
        thickness: newCableTypeThickness,
        costPerMeter: newCableTypeCost
      };
      setCustomCableTypes(prev => [...prev, newType]);
    }

    setNewCableTypeName('');
    setNewCableTypeColor('#3b82f6');
    setNewCableTypeThickness(3);
    setNewCableTypeCost(1.20);
    setIsAddingCableType(false);
  };

  const handleEditCableType = (type: CustomCableType) => {
    setEditingCableTypeId(type.id);
    setNewCableTypeName(type.name);
    setNewCableTypeColor(type.color);
    setNewCableTypeThickness(type.thickness);
    setNewCableTypeCost(type.costPerMeter);
    setIsAddingCableType(true);
  };

  const handleDeleteCableType = (id: string) => {
    setCustomCableTypes(prev => prev.filter(t => t.id !== id));
  };

  const toggleCategory = (category: string) => {
    setCollapsedCategories(prev => ({
      ...prev,
      [category]: !prev[category]
    }));
  };

  const currentSheetIndex = sheets.findIndex(s => s.id === currentSheetId);
  const currentSheet = sheets[currentSheetIndex];

  const renderEquipmentItem = (item: any) => (
    <div 
      key={item.type}
      draggable={!!currentSheetId}
      onDragStart={(e) => {
        e.dataTransfer.setData('text/plain', item.type);
        e.dataTransfer.effectAllowed = 'copy';
      }}
      onClick={() => currentSheetId && setSelectedTool(item.type)}
      className={cn(
        "p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer group select-none hover:-translate-y-0.5 active:scale-[0.98]",
        theme === 'dark' 
          ? "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-800/40 hover:shadow-[0_4px_12px_rgba(0,0,0,0.2)]" 
          : "bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50 shadow-sm hover:shadow-[0_4px_12px_rgba(15,23,42,0.03)]",
        selectedTool === item.type 
          ? "border-blue-500/80 ring-2 ring-blue-500/20 bg-blue-500/10 dark:bg-blue-500/15 dark:border-blue-500/60" 
          : ""
      )}
    >
      <div className="flex items-center gap-2.5 mb-1.5">
        <div className={cn(
          "p-1.5 rounded-lg border shadow-sm group-hover:scale-105 transition-all duration-300",
          theme === 'dark' ? "bg-zinc-950 border-zinc-800/60" : "bg-white border-slate-200"
        )}>
          {item.icon}
        </div>
        <span className={cn(
          "text-xs font-bold tracking-tight transition-colors",
          theme === 'dark' ? "text-slate-100" : "text-slate-900"
        )}>{item.name}</span>
      </div>
      <p className="text-[10px] text-zinc-400 leading-normal font-medium font-sans">{item.desc}</p>
    </div>
  );

  return (
    <div className={cn(
      "flex h-screen w-full overflow-hidden font-sans transition-colors duration-300",
      theme === 'dark' ? "bg-[var(--color-app-bg)] text-white" : "bg-[var(--color-app-bg)] text-[var(--color-app-text)]"
    )}>
      <header className={cn(
        "absolute top-0 left-0 right-0 h-14 border-b flex items-center justify-between px-5 z-50 transition-all duration-300 backdrop-blur-md",
        theme === 'dark' 
          ? "bg-zinc-950/85 border-zinc-800/80 shadow-[0_1px_10px_rgba(0,0,0,0.3)]" 
          : "bg-white/90 border-slate-200/80 shadow-[0_1px_10px_rgba(15,23,42,0.05)]"
      )}>
        <div className="flex items-center gap-4">
          {onBackToSite && (
            <button
              onClick={onBackToSite}
              className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-black transition-all flex items-center gap-1.5 cursor-pointer shadow-md active:scale-95"
              title="Retourner au site corporate"
            >
              ← Retour au Site
            </button>
          )}
          <div className="flex items-center gap-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 shadow-lg text-white px-3 py-1.5 rounded-lg text-xs tracking-wider font-extrabold uppercase select-none hover:scale-105 active:scale-95 transition-all">
            <Layout size={15} className="animate-spin-slow text-blue-100" />
            <span>VoltPlan Pro</span>
          </div>
          <div className={cn("h-5 w-[1px] shadow-sm", theme === 'dark' ? "bg-zinc-800" : "bg-slate-200")} />
          <div className="flex items-center gap-1 bg-zinc-900/30 dark:bg-zinc-900/40 p-0.5 rounded-lg border border-zinc-800/10 dark:border-zinc-800/40">
            <button 
              onClick={onUndo} 
              disabled={!canUndo} 
              className={cn(
                "p-1.5 rounded-md transition-all active:scale-95 disabled:opacity-20",
                theme === 'dark' ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )} 
              title="Undo"
            >
              <Undo size={14} />
            </button>
            <button 
              onClick={onRedo} 
              disabled={!canRedo} 
              className={cn(
                "p-1.5 rounded-md transition-all active:scale-95 disabled:opacity-20",
                theme === 'dark' ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              )} 
              title="Redo"
            >
              <Redo size={14} />
            </button>
          </div>
          <div className={cn("h-5 w-[1px] shadow-sm", theme === 'dark' ? "bg-zinc-800" : "bg-slate-200")} />
          <button 
            onClick={() => onOpenInventory()}
            title="Ouvrir l'inventaire matériel et ajuster les tarifs / générer un devis PDF"
            className="flex items-center gap-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 px-3 py-1.5 rounded-lg text-xs text-emerald-400 font-bold transition-all shadow-md cursor-pointer hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] active:scale-95"
          >
            <Coins size={14} className="animate-bounce" />
            <span>Inventaire & Tarifs (€)</span>
          </button>
          <div className={cn("h-5 w-[1px] shadow-sm", theme === 'dark' ? "bg-zinc-800" : "bg-slate-200")} />
          <button 
            onClick={toggleTheme}
            title={theme === 'dark' ? "Passer en mode clair (pour impression)" : "Passer en mode sombre"}
            className={cn(
              "p-1.5 rounded-lg transition-all flex items-center gap-1.5 px-3 font-extrabold text-[10px] uppercase tracking-wider cursor-pointer border shadow-sm active:scale-95",
              theme === 'dark' 
                ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border-amber-500/20" 
                : "bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500/20 border-indigo-500/20"
            )}
          >
            {theme === 'dark' ? <Sun size={14} className="text-amber-400" /> : <Moon size={14} className="text-indigo-600" />}
            <span>{theme === 'dark' ? "Clair" : "Sombre"}</span>
          </button>
          <div className={cn("h-5 w-[1px] shadow-sm", theme === 'dark' ? "bg-zinc-800" : "bg-slate-200")} />
          {activeMenu && (
            <div 
              className="fixed inset-0 z-40 bg-transparent cursor-default" 
              onClick={() => setActiveMenu(null)}
            />
          )}

          <nav className="flex items-center gap-1 text-xs text-zinc-400 relative z-50">
            {/* FILE MENU */}
            <div className="relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}
                onMouseEnter={() => activeMenu && setActiveMenu('file')}
                className={cn(
                  "px-2.5 py-1.5 rounded transition-all text-xs font-semibold hover:text-white hover:bg-zinc-800/80 flex items-center gap-1 cursor-pointer",
                  activeMenu === 'file' ? "text-white bg-zinc-800" : "text-zinc-400"
                )}
              >
                <span>Fichier</span>
                <span className="text-[9px] text-zinc-500 font-normal hidden sm:inline">/ File</span>
                <ChevronDown size={11} className={cn("transition-transform text-zinc-500", activeMenu === 'file' ? "rotate-180" : "")} />
              </button>
              
              {activeMenu === 'file' && (
                <div className={cn(
                  "absolute top-full left-0 mt-1 z-50 min-w-[240px] backdrop-blur-md border shadow-2xl rounded-md p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150 transition-colors duration-300",
                  theme === 'dark' ? "bg-zinc-950/95 border-zinc-800" : "bg-white/95 border-zinc-200"
                )}>
                  <button
                    onClick={() => {
                      setActiveMenu(null);
                      document.getElementById('pdf-import-header')?.click();
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 cursor-pointer"
                  >
                    <FilePlus size={13} className="text-blue-400" />
                    <span>Importer des Plans / Images</span>
                  </button>
                  
                  <button
                    disabled={!currentSheetId}
                    onClick={() => {
                      setActiveMenu(null);
                      onDuplicateSheet?.();
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Copy size={13} className="text-purple-400" />
                    <span>Dupliquer le Plan Actif</span>
                  </button>

                  <button
                    disabled={!currentSheetId}
                    onClick={() => {
                      if (window.confirm("Voulez-vous vraiment effacer tous les équipements de ce plan ?")) {
                        setActiveMenu(null);
                        onClearSheet?.();
                      }
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Eraser size={13} className="text-amber-400" />
                    <span>Effacer les Équipements</span>
                  </button>

                  <button
                    disabled={!currentSheetId}
                    onClick={() => {
                      if (window.confirm("Voulez-vous vraiment supprimer ce plan ?")) {
                        setActiveMenu(null);
                        if (currentSheetId) onDeleteSheet(currentSheetId);
                      }
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded hover:bg-red-600 hover:text-white transition-colors text-left font-medium text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <Trash2 size={13} className="text-red-400" />
                    <span>Supprimer le Plan Actif</span>
                  </button>

                  <div className="border-t border-zinc-800/80 my-1" />

                  <button
                    onClick={() => {
                      setActiveMenu(null);
                      onClearAllSheets?.();
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded hover:bg-red-600 hover:text-white transition-colors text-left font-medium text-red-400 cursor-pointer"
                  >
                    <Trash2 size={13} />
                    <span>Réinitialiser l'Espace</span>
                  </button>
                </div>
              )}
            </div>

            {/* EDIT MENU */}
            <div className="relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}
                onMouseEnter={() => activeMenu && setActiveMenu('edit')}
                className={cn(
                  "px-2.5 py-1.5 rounded transition-all text-xs font-semibold hover:text-white hover:bg-zinc-800/80 flex items-center gap-1 cursor-pointer",
                  activeMenu === 'edit' ? "text-white bg-zinc-800" : "text-zinc-400"
                )}
              >
                <span>Édition</span>
                <span className="text-[9px] text-zinc-500 font-normal hidden sm:inline">/ Edit</span>
                <ChevronDown size={11} className={cn("transition-transform text-zinc-500", activeMenu === 'edit' ? "rotate-180" : "")} />
              </button>
              
              {activeMenu === 'edit' && (
                <div className="absolute top-full left-0 mt-1 z-50 min-w-[260px] bg-zinc-950/95 backdrop-blur-md border border-zinc-800 shadow-2xl rounded-md p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150">
                  <button
                    disabled={!selectedEquipment}
                    onClick={() => {
                      setActiveMenu(null);
                      onCopySelected?.();
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Copy size={13} className="text-blue-400" />
                      <span>Copier l'Équipement</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">Ctrl+C</span>
                  </button>

                  <button
                    disabled={!clipboardEquipment}
                    onClick={() => {
                      setActiveMenu(null);
                      onPasteSelected?.();
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Clipboard size={13} className="text-purple-400" />
                      <span>Coller l'Équipement</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">Ctrl+V</span>
                  </button>

                  <div className="border-t border-zinc-800/80 my-1" />

                  <button
                    disabled={!selectedEquipment && !selectedCable}
                    onClick={() => {
                      setActiveMenu(null);
                      onDeleteSelected?.();
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded hover:bg-red-600 hover:text-white transition-colors text-left font-medium text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <Trash2 size={13} className="text-red-400" />
                      <span>Supprimer la Sélection</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">Suppr</span>
                  </button>

                  <button
                    disabled={!selectedEquipment && !selectedCable}
                    onClick={() => {
                      setActiveMenu(null);
                      onDeselect?.();
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded hover:bg-zinc-800 hover:text-white transition-colors text-left font-medium text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <div className="flex items-center gap-2">
                      <X size={13} className="text-zinc-400" />
                      <span>Annuler la Sélection</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">Échap</span>
                  </button>
                </div>
              )}
            </div>

            {/* VIEW MENU */}
            <div className="relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}
                onMouseEnter={() => activeMenu && setActiveMenu('view')}
                className={cn(
                  "px-2.5 py-1.5 rounded transition-all text-xs font-semibold hover:text-white hover:bg-zinc-800/80 flex items-center gap-1 cursor-pointer",
                  activeMenu === 'view' ? "text-white bg-zinc-800" : "text-zinc-400"
                )}
              >
                <span>Affichage</span>
                <span className="text-[9px] text-zinc-500 font-normal hidden sm:inline">/ View</span>
                <ChevronDown size={11} className={cn("transition-transform text-zinc-500", activeMenu === 'view' ? "rotate-180" : "")} />
              </button>
              
              {activeMenu === 'view' && (
                <div className={cn(
                  "absolute top-full left-0 mt-1 z-50 min-w-[250px] backdrop-blur-md border shadow-2xl rounded-md p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150 transition-colors duration-300",
                  theme === 'dark' ? "bg-zinc-950/95 border-zinc-800" : "bg-white/95 border-zinc-200"
                )}>
                  <button
                    onClick={() => {
                      setZoom(Math.min(zoom + 0.1, 5));
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ZoomIn size={13} className="text-blue-400" />
                      <span>Zoom Avant (+10%)</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">{Math.round(zoom * 100)}%</span>
                  </button>

                  <button
                    onClick={() => {
                      setZoom(Math.max(zoom - 0.1, 0.1));
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <ZoomOut size={13} className="text-purple-400" />
                      <span>Zoom Arrière (-10%)</span>
                    </div>
                    <span className="text-[9px] text-zinc-500 font-mono">{Math.round(zoom * 100)}%</span>
                  </button>

                  <button
                    onClick={() => {
                      setZoom(1);
                    }}
                    className="flex items-center justify-between w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 cursor-pointer"
                  >
                    <div className="flex items-center gap-2">
                      <RefreshCw size={13} className="text-amber-400" />
                      <span>Zoom Initial (100%)</span>
                    </div>
                  </button>

                  <div className="border-t border-zinc-800/80 my-1" />
                  
                  <div className="px-2.5 py-1 text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                    Visibilité des Calques
                  </div>

                  {layers.map(layer => (
                    <button
                      key={layer.id}
                      onClick={() => {
                        onUpdateLayer({ ...layer, visible: !layer.visible });
                      }}
                      className="flex items-center justify-between w-full px-2.5 py-1.5 rounded hover:bg-zinc-800 transition-colors text-left text-zinc-300 cursor-pointer"
                    >
                      <div className="flex items-center gap-2">
                        {layer.visible ? (
                          <Eye size={12} className="text-emerald-400" />
                        ) : (
                          <EyeOff size={12} className="text-zinc-600" />
                        )}
                        <span className={cn(layer.visible ? "text-zinc-100" : "text-zinc-500 line-through")}>
                          {layer.name}
                        </span>
                      </div>
                      <span className="text-[9px] text-zinc-500 uppercase font-mono">{layer.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* EXPORT MENU */}
            <div className="relative">
              <button 
                onClick={() => setActiveMenu(activeMenu === 'export' ? null : 'export')}
                onMouseEnter={() => activeMenu && setActiveMenu('export')}
                className={cn(
                  "px-2.5 py-1.5 rounded transition-all text-xs font-semibold hover:text-white hover:bg-zinc-800/80 flex items-center gap-1 cursor-pointer",
                  activeMenu === 'export' ? "text-white bg-zinc-800" : "text-zinc-400"
                )}
              >
                <span>Exportation</span>
                <span className="text-[9px] text-zinc-500 font-normal hidden sm:inline">/ Export</span>
                <ChevronDown size={11} className={cn("transition-transform text-zinc-500", activeMenu === 'export' ? "rotate-180" : "")} />
              </button>
              
              {activeMenu === 'export' && (
                <div className={cn(
                  "absolute top-full left-0 mt-1 z-50 min-w-[240px] backdrop-blur-md border shadow-2xl rounded-md p-1.5 space-y-0.5 animate-in fade-in slide-in-from-top-1 duration-150 transition-colors duration-300",
                  theme === 'dark' ? "bg-zinc-950/95 border-zinc-800" : "bg-white/95 border-zinc-200"
                )}>
                  <button
                    disabled={!currentSheetId}
                    onClick={() => {
                      setActiveMenu(null);
                      onExport();
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <ImageIcon size={13} className="text-blue-400" />
                    <span>Exporter le Plan Actif (PNG)</span>
                  </button>

                  <button
                    disabled={sheets.length === 0}
                    onClick={() => {
                      setActiveMenu(null);
                      onExportAllPdf();
                    }}
                    className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded hover:bg-blue-600 hover:text-white transition-colors text-left font-medium text-zinc-300 disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-zinc-500 cursor-pointer disabled:cursor-not-allowed"
                  >
                    <FileText size={13} className="text-purple-400" />
                    <span>Exporter Tous les Plans (PDF)</span>
                  </button>
                </div>
              )}
            </div>
          </nav>
        </div>
        
        <div className="flex items-center gap-3">
          <input 
            type="file" 
            id="pdf-import-header" 
            className="hidden" 
            accept="application/pdf,image/*"
            multiple
            onChange={onImportFiles}
          />
          <label 
            htmlFor="pdf-import-header" 
            className={cn(
              "flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border cursor-pointer active:scale-95 shadow-sm",
              theme === 'dark'
                ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <FileUp size={14} className="text-blue-500" />
            <span>Importer Plans / Images</span>
          </label>
          <button 
            onClick={onAutoDetect}
            disabled={!currentSheetId || isAnalyzing}
            title="Automatically detect equipment on this plan using AI"
            className="flex items-center gap-1.5 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 disabled:opacity-50 text-white px-3.5 py-2 rounded-lg text-xs transition-all shadow-md hover:shadow-indigo-500/10 active:scale-95 font-bold cursor-pointer"
          >
            {isAnalyzing ? <RefreshCw size={13} className="animate-spin text-white" /> : <Sparkles size={13} className="text-amber-300 animate-pulse" />}
            <span>{isAnalyzing ? "Analyse..." : "Détection IA"}</span>
          </button>
          <button 
            onClick={onExport}
            disabled={!currentSheetId}
            title="Download active sheet as high-res PNG image"
            className={cn(
              "flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-xs font-bold transition-all border active:scale-95 disabled:opacity-50 cursor-pointer shadow-sm",
              theme === 'dark'
                ? "bg-zinc-900 border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:text-white"
                : "bg-white border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900"
            )}
          >
            <Download size={13} className="text-sky-500" />
            <span>Export PNG</span>
          </button>
          <button 
            onClick={onExportAllPdf}
            disabled={sheets.length === 0}
            title="Download all sheets combined into one multi-page PDF"
            className="flex items-center gap-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white px-4 py-2 rounded-lg text-xs transition-all shadow-md hover:shadow-blue-500/10 active:scale-95 font-bold cursor-pointer"
          >
            <FileText size={13} className="text-blue-100" />
            <span>Exporter Tout en PDF</span>
          </button>
        </div>
      </header>

      <div className="flex flex-1 pt-14 overflow-hidden">
        <aside className={cn(
          "w-64 border-r shadow-sm flex flex-col transition-all duration-300 ease-in-out shrink-0",
          !sidebarOpen && "-ml-64",
          theme === 'dark' ? "bg-[#181a1f] border-zinc-700/50" : "bg-[var(--color-app-sidebar)] border-[var(--color-app-border)]"
        )}>
          {/* Left Tab Switcher */}
          <div className={cn(
            "flex border-b p-1.5 gap-1.5 shrink-0 transition-colors duration-300",
            theme === 'dark' ? "bg-zinc-950/40 border-zinc-900" : "bg-slate-100/80 border-slate-200"
          )}>
            <button
              id="left-tab-design"
              type="button"
              onClick={() => setLeftTab('design')}
              className={cn(
                "flex-1 text-center py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all cursor-pointer shadow-sm active:scale-98",
                leftTab === 'design' 
                  ? (theme === 'dark' ? "bg-zinc-900 text-blue-400 border border-blue-500/20" : "bg-white text-blue-600 border border-slate-200")
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20"
              )}
            >
              🛠️ Design
            </button>
            <button
              id="left-tab-cables"
              type="button"
              onClick={() => setLeftTab('cables')}
              className={cn(
                "flex-1 text-center py-2 text-[10px] font-extrabold uppercase tracking-wider rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-sm active:scale-98",
                leftTab === 'cables' 
                  ? (theme === 'dark' ? "bg-zinc-900 text-blue-400 border border-blue-500/20" : "bg-white text-blue-600 border border-slate-200")
                  : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-900/20"
              )}
            >
              <Waypoints size={11} className="text-pink-500" />
              <span>Câbles ({customCableTypes.length})</span>
            </button>
          </div>

          {leftTab === 'design' ? (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
            <div>
              <h3 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Plans de Travail</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] bg-indigo-500/10 dark:bg-zinc-800 border border-indigo-500/10 px-2 py-0.5 rounded-full text-indigo-500 dark:text-zinc-400 font-bold">{sheets.length}</span>
                  <input 
                    type="file" 
                    id="add-sheets-sidebar" 
                    className="hidden" 
                    accept="application/pdf,image/*"
                    multiple
                    onChange={onImportFiles}
                  />
                  <label 
                    htmlFor="add-sheets-sidebar" 
                    className={cn(
                      "p-1.5 rounded-lg cursor-pointer transition-all flex items-center justify-center border active:scale-95 shadow-sm",
                      theme === 'dark' 
                        ? "bg-zinc-900 hover:bg-zinc-800 border-zinc-800 hover:text-blue-400"
                        : "bg-white hover:bg-slate-50 border-slate-200 text-slate-700 hover:text-blue-600"
                    )}
                    title="Add more plans or images"
                  >
                    <Plus size={12} className="stroke-[3]" />
                  </label>
                </div>
              </h3>
              <div className="space-y-2.5 max-h-[320px] overflow-y-auto pr-1 custom-scrollbar">
                {sheets.length > 0 ? (
                  sheets.map((sheet, idx) => (
                    <div 
                      key={sheet.id}
                      onClick={() => onSelectSheet(sheet.id)}
                      className={cn(
                        "group p-3 rounded-xl border text-left transition-all duration-300 cursor-pointer relative flex items-center gap-3 shadow-sm hover:-translate-y-0.5 active:scale-[0.98]",
                        sheet.id === currentSheetId 
                          ? (theme === 'dark' ? "bg-indigo-600/10 border-indigo-500/80 text-white shadow-indigo-900/10" : "bg-blue-50/80 border-blue-600/80 text-blue-700 shadow-blue-100")
                          : (theme === 'dark' 
                              ? "bg-zinc-900/30 border-zinc-800/80 hover:border-zinc-700/80 text-zinc-300 hover:text-white" 
                              : "bg-white border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900")
                      )}
                    >
                    <div className={cn(
                      "p-2 rounded-lg border shadow-sm transition-colors duration-300",
                      theme === 'dark' ? "bg-zinc-950 border-zinc-800/60" : "bg-slate-50 border-slate-200"
                    )}>
                        {sheet.type === 'pdf' ? (
                          <FileText size={14} className="text-blue-500 dark:text-blue-400" />
                        ) : (
                          <ImageIcon size={14} className="text-emerald-500 dark:text-emerald-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0 pr-4">
                        <p className="text-xs font-bold truncate tracking-tight">{sheet.name}</p>
                        <p className="text-[9px] text-zinc-400 dark:text-zinc-500 font-medium font-mono mt-0.5">
                          {sheet.equipment.length} items | {sheet.dimensions.width}x{sheet.dimensions.height}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setPreviewUrl(sheet.canvasBg);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute right-8 top-1/2 -translate-y-1/2 p-1.5 hover:bg-blue-500/15 rounded-lg text-zinc-400 hover:text-blue-500 transition-all active:scale-95 duration-200"
                        title="Preview this sheet"
                      >
                        <Eye size={12} className="stroke-[2]" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteSheet(sheet.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 absolute right-2.5 top-1/2 -translate-y-1/2 p-1.5 hover:bg-red-500/15 rounded-lg text-zinc-400 hover:text-red-500 transition-all active:scale-95 duration-200"
                        title="Delete this sheet"
                      >
                        <Trash2 size={12} className="stroke-[2]" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className={cn(
                    "py-8 rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-4 transition-all duration-300",
                    theme === 'dark' ? "bg-zinc-900/20 border-zinc-800/80" : "bg-slate-50/50 border-slate-200/80"
                  )}>
                    <FileUp size={24} className="text-zinc-400 dark:text-zinc-500 mb-2" />
                    <span className="text-[11px] text-zinc-500 dark:text-zinc-400 font-medium italic">Aucun plan chargé</span>
                  </div>
                )}
              </div>
            </div>

            <div>
              <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 flex items-center justify-between">
                Bibliothèque d'Équipement
              </h3>
              <div className={cn(
                "text-[10px] rounded-md p-3 mb-4 space-y-2 leading-relaxed border transition-colors",
                theme === 'dark' 
                  ? "text-zinc-300 bg-blue-950/40 border-blue-800/60" 
                  : "text-blue-800 bg-blue-50 border-blue-200"
              )}>
                <div className="flex items-start gap-1.5">
                  <span className="text-xs shrink-0">💡</span>
                  <p>
                    <span className={cn("font-bold", theme === 'dark' ? "text-white" : "text-blue-900")}>Glissez-déposez</span> un matériel sur le plan, ou <span className={cn("font-bold", theme === 'dark' ? "text-white" : "text-blue-900")}>cliquez</span> dessus pour l'activer et le poser sur la carte.
                  </p>
                </div>
                <div className={cn("flex items-start gap-1.5 border-t pt-2 mt-2", theme === 'dark' ? "border-blue-900/40" : "border-blue-200")}>
                  <span className="text-xs shrink-0">➕</span>
                  <p>
                    <span className="font-bold text-blue-400">Ajouter un nouveau modèle :</span> Allez tout en bas de cette liste dans la section <span className={cn("font-bold", theme === 'dark' ? "text-blue-300" : "text-blue-600")}>"Équipements Personnalisés"</span> et cliquez sur <span className={cn("font-bold", theme === 'dark' ? "text-white" : "text-blue-900")}>"Créer"</span> pour définir vos modèles.
                  </p>
                </div>
                <div className={cn("flex items-start gap-1.5 border-t pt-2 mt-2", theme === 'dark' ? "border-blue-900/40" : "border-blue-200")}>
                  <span className="text-xs shrink-0">💶</span>
                  <p>
                    <span className="font-bold text-green-400">Ajuster les tarifs & devis :</span> Cliquez sur le bouton clignotant <span className="font-bold text-green-400">"Inventaire & Tarifs (€)"</span> en haut de l'écran pour modifier en temps réel le prix de chaque appareil ou câble !
                  </p>
                </div>
              </div>
                <div className="space-y-4">
                  {/* CCTV Category */}
                  <div>
                    <h4 
                      className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1 cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => toggleCategory('cctv')}
                    >
                      {collapsedCategories['cctv'] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      Video Surveillance (CCTV)
                    </h4>
                    {!collapsedCategories['cctv'] && (
                      <div className="space-y-2.5">
                        {[
                          {
                            type: 'CCTV_DOME' as EquipmentType,
                            name: 'CCTV Dome Camera',
                            desc: 'Ceiling mount hemispherical dome security camera.',
                            icon: <Camera className="w-4 h-4 text-blue-400" />
                          },
                          {
                            type: 'CCTV_BULLET' as EquipmentType,
                            name: 'CCTV Bullet Camera',
                            desc: 'Long-range bracket wall-mounted security camera.',
                            icon: <Video className="w-4 h-4 text-sky-400" />
                          },
                          {
                            type: 'CCTV' as EquipmentType,
                            name: 'Generic CCTV',
                            desc: 'General purpose CCTV camera.',
                            icon: <Camera className="w-4 h-4 text-blue-300" />
                          }
                        ].map(renderEquipmentItem)}
                      </div>
                    )}
                  </div>

                  {/* Network & WiFi Category */}
                  <div>
                    <h4 
                      className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1 cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => toggleCategory('network')}
                    >
                      {collapsedCategories['network'] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      Network & WiFi
                    </h4>
                    {!collapsedCategories['network'] && (
                      <div className="space-y-2.5">
                        {[
                          {
                            type: 'WIFI_ROUTER' as EquipmentType,
                            name: 'WiFi Access Point',
                            desc: 'High-speed ceiling wireless AP with signal coverage.',
                            icon: <Wifi className="w-4 h-4 text-green-400" />
                          },
                          {
                            type: 'WIFI' as EquipmentType,
                            name: 'Generic WiFi',
                            desc: 'General purpose wireless access point.',
                            icon: <Wifi className="w-4 h-4 text-green-300" />
                          },
                          {
                            type: 'SWITCH_RACK' as EquipmentType,
                            name: 'Network Switch Rack',
                            desc: 'Rackmount network switch with green LED ports.',
                            icon: <Cpu className="w-4 h-4 text-amber-400" />
                          },
                          {
                            type: 'SERVER_RACK' as EquipmentType,
                            name: 'Chassis Server Rack',
                            desc: 'Storage and central compute chassis server modules.',
                            icon: <Server className="w-4 h-4 text-indigo-400" />
                          },
                          {
                            type: 'UPS_BATTERY' as EquipmentType,
                            name: 'UPS Backup Battery',
                            desc: 'Uninterruptible power supply battery rack for servers.',
                            icon: <Battery className="w-4 h-4 text-emerald-400" />
                          },
                          {
                            type: 'NETWORK' as EquipmentType,
                            name: 'Generic Network',
                            desc: 'General network equipment.',
                            icon: <NetworkIcon className="w-4 h-4 text-amber-300" />
                          }
                        ].map(renderEquipmentItem)}
                      </div>
                    )}
                  </div>

                  {/* Fire & Security Category */}
                  <div>
                    <h4 
                      className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1 cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => toggleCategory('fire')}
                    >
                      {collapsedCategories['fire'] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      Fire & Security
                    </h4>
                    {!collapsedCategories['fire'] && (
                      <div className="space-y-2.5">
                        {[
                          {
                            type: 'FIRE_DETECTOR' as EquipmentType,
                            name: 'Smoke Detector & Sprinkler',
                            desc: 'Photoelectric fire safety sensor with sprinkler.',
                            icon: <Flame className="w-4 h-4 text-red-400" />
                          },
                          {
                            type: 'ALARM_SIREN' as EquipmentType,
                            name: 'Alarm Siren Beacon',
                            desc: 'Red emergency beacon strobe light with alert waves.',
                            icon: <Siren className="w-4 h-4 text-rose-400" />
                          },
                          {
                            type: 'FIRE' as EquipmentType,
                            name: 'Generic Fire Sensor',
                            desc: 'General fire/smoke detection device.',
                            icon: <Flame className="w-4 h-4 text-red-300" />
                          },
                          {
                            type: 'CONTROL_PANEL' as EquipmentType,
                            name: 'Smart Control Panel',
                            desc: 'Wall touchpad control tablet to monitor project.',
                            icon: <Tablet className="w-4 h-4 text-purple-400" />
                          },
                          {
                            type: 'ACCESS_CONTROL' as EquipmentType,
                            name: 'Badge Card Reader',
                            desc: 'RFID magnetic badge scanner and lock controller for entry doors.',
                            icon: <Key className="w-4 h-4 text-purple-400" />
                          },
                          {
                            type: 'INTERCOM' as EquipmentType,
                            name: 'IP Video Intercom',
                            desc: 'Outdoor door intercom station with camera and call button.',
                            icon: <Phone className="w-4 h-4 text-sky-400" />
                          },
                          {
                            type: 'SECURITY' as EquipmentType,
                            name: 'Security Device',
                            desc: 'Generic security equipment.',
                            icon: <ShieldAlert className="w-4 h-4 text-purple-300" />
                          }
                        ].map(renderEquipmentItem)}
                      </div>
                    )}
                  </div>

                  {/* Multimedia & Display Category */}
                  <div>
                    <h4 
                      className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2 flex items-center gap-1 cursor-pointer hover:text-zinc-300 transition-colors"
                      onClick={() => toggleCategory('multimedia')}
                    >
                      {collapsedCategories['multimedia'] ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                      Multimedia & Display (TV / Moniteurs)
                    </h4>
                    {!collapsedCategories['multimedia'] && (
                      <div className="space-y-2.5">
                        {[
                          {
                            type: 'TV' as EquipmentType,
                            name: 'Smart TV',
                            desc: 'Connected smart television for screen casting or monitoring feed.',
                            icon: <Tv className="w-4 h-4 text-orange-400" />
                          },
                          {
                            type: 'MONITOR' as EquipmentType,
                            name: 'Moniteur de Surveillance',
                            desc: 'Professional monitor optimized for continuous security display.',
                            icon: <Monitor className="w-4 h-4 text-sky-400" />
                          }
                        ].map(renderEquipmentItem)}
                      </div>
                    )}
                  </div>

                  {/* Custom Equipment Category */}
                  <div className="bg-blue-500/5 hover:bg-blue-500/10 border border-blue-500/15 rounded-md p-2.5 mt-4 transition-all">
                    <div className="flex items-center justify-between mb-2">
                      <h4 
                        className="text-[11px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1 cursor-pointer hover:text-blue-300 transition-colors"
                        onClick={() => toggleCategory('custom')}
                      >
                        {collapsedCategories['custom'] ? <ChevronRight size={12} className="text-blue-400" /> : <ChevronDown size={12} className="text-blue-400" />}
                        🌟 Équipements Personnalisés
                      </h4>
                      <button 
                        onClick={() => {
                          setIsAddingCustomEquip(!isAddingCustomEquip);
                          setEditingCustomEquipId(null);
                          setNewCustomEquipName('');
                          setNewCustomEquipType('CCTV');
                          setNewCustomEquipIconKey('CCTV_DOME');
                          setNewCustomEquipDesc('');
                          setNewCustomEquipPrice(120.00);
                        }}
                        className="text-[10px] text-white hover:text-white font-bold flex items-center gap-1 bg-blue-600 hover:bg-blue-700 px-2.5 py-1 rounded shadow transition-all active:scale-95 cursor-pointer"
                        title="Ajouter un équipement"
                      >
                        <Plus size={10} /> Créer
                      </button>
                    </div>

                    {isAddingCustomEquip && (
                      <form onSubmit={handleSaveCustomEquipment} className="bg-zinc-900 border border-zinc-700/60 rounded p-3 mb-3 space-y-2.5 animate-in fade-in duration-200 text-left">
                        <div className="flex items-center justify-between pb-1 border-b border-zinc-800">
                          <span className="text-[10px] font-bold text-zinc-300 uppercase tracking-wide">
                            {editingCustomEquipId ? 'Modifier Équipement' : 'Nouvel Équipement'}
                          </span>
                          <button 
                            type="button" 
                            onClick={() => setIsAddingCustomEquip(false)}
                            className="text-zinc-500 hover:text-white text-xs"
                          >
                            ✕
                          </button>
                        </div>

                        <div>
                          <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Nom du modèle</label>
                          <input 
                            type="text" 
                            required
                            placeholder="ex: Caméra Bullet Pro 4K"
                            value={newCustomEquipName}
                            onChange={(e) => setNewCustomEquipName(e.target.value)}
                            className="w-full bg-[#0f1115] border border-zinc-700 rounded-sm p-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Catégorie de base</label>
                            <select 
                              value={newCustomEquipType}
                              onChange={(e) => setNewCustomEquipType(e.target.value as EquipmentType)}
                              className="w-full bg-[#0f1115] border border-zinc-700 rounded-sm p-1.5 text-[11px] text-white focus:outline-none"
                            >
                              <option value="CCTV">Surveillance (CCTV)</option>
                              <option value="WIFI">Réseau & WiFi</option>
                              <option value="FIRE">Sécurité Incendie</option>
                              <option value="SECURITY">Sécurité Intrusion</option>
                              <option value="NETWORK">Réseau Générique</option>
                              <option value="UPS_BATTERY">Alimentation / UPS</option>
                            </select>
                          </div>

                          <div>
                            <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Style de l'icône</label>
                            <select 
                              value={newCustomEquipIconKey}
                              onChange={(e) => setNewCustomEquipIconKey(e.target.value)}
                              className="w-full bg-[#0f1115] border border-zinc-700 rounded-sm p-1.5 text-[11px] text-white focus:outline-none font-mono"
                            >
                              <option value="CCTV_DOME">Dome Camera</option>
                              <option value="CCTV_BULLET">Bullet Camera</option>
                              <option value="CCTV">Generic Camera</option>
                              <option value="WIFI_ROUTER">WiFi AP Router</option>
                              <option value="WIFI">Generic WiFi</option>
                              <option value="SWITCH_RACK">Switch Rack</option>
                              <option value="SERVER_RACK">Server Rack</option>
                              <option value="UPS_BATTERY">UPS Battery</option>
                              <option value="FIRE_DETECTOR">Smoke Detector</option>
                              <option value="ALARM_SIREN">Alarm Siren</option>
                              <option value="CONTROL_PANEL">Control Panel</option>
                              <option value="ACCESS_CONTROL">Badge Reader</option>
                              <option value="INTERCOM">IP Intercom</option>
                              <option value="SECURITY">Generic Shield</option>
                            </select>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <div>
                            <label className="text-[9px] text-zinc-400 uppercase font-bold block mb-1">Description / Infos</label>
                            <input 
                              type="text" 
                              placeholder="ex: Objectif varifocale..."
                              value={newCustomEquipDesc}
                              onChange={(e) => setNewCustomEquipDesc(e.target.value)}
                              className="w-full bg-[#0f1115] border border-zinc-700 rounded-sm p-1.5 text-xs text-white focus:outline-none focus:border-blue-500"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit"
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-xs transition-colors flex items-center justify-center gap-1 shadow-md"
                        >
                          <Check size={12} /> {editingCustomEquipId ? 'Mettre à jour' : 'Enregistrer l\'équipement'}
                        </button>
                      </form>
                    )}

                    {!collapsedCategories['custom'] && (
                      <div className="space-y-2">
                        {customEquipmentTypes.length === 0 ? (
                          <div className="py-4 px-2 text-center border border-dashed border-zinc-800 rounded bg-zinc-900/20">
                            <p className="text-[10px] text-zinc-500 italic leading-snug">Aucun équipement personnalisé. Cliquez sur "Créer" pour en ajouter un.</p>
                          </div>
                        ) : (
                          customEquipmentTypes.map((equip) => {
                            const isSelected = selectedTool === equip.id;
                            return (
                              <div 
                                key={equip.id}
                                draggable={!!currentSheetId}
                                onDragStart={(e) => {
                                  e.dataTransfer.setData('text/plain', equip.id);
                                  e.dataTransfer.effectAllowed = 'copy';
                                }}
                                onClick={() => currentSheetId && setSelectedTool(equip.id as any)}
                                className={cn(
                                  "p-2 rounded-sm border text-left transition-all cursor-pointer group select-none relative",
                                  "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 hover:bg-zinc-800/50 shadow-sm",
                                  isSelected ? "border-blue-500 ring-1 ring-blue-500 bg-blue-500/15" : ""
                                )}
                              >
                                <div className="flex items-center justify-between gap-1 mb-1">
                                  <div className="flex items-center gap-2">
                                    <div className="p-1 rounded-sm bg-[#0f1115] border border-zinc-700/50 shadow-sm group-hover:scale-110 transition-transform">
                                      {equip.iconKey.includes('CCTV') ? <Camera className="w-4 h-4 text-blue-400" /> :
                                       equip.iconKey.includes('WIFI') ? <Wifi className="w-4 h-4 text-green-400" /> :
                                       equip.iconKey.includes('FIRE') ? <Flame className="w-4 h-4 text-red-400" /> :
                                       equip.iconKey.includes('ALARM') ? <Siren className="w-4 h-4 text-rose-400" /> :
                                       equip.iconKey.includes('SERVER') ? <Server className="w-4 h-4 text-indigo-400" /> :
                                       equip.iconKey.includes('SWITCH') ? <Cpu className="w-4 h-4 text-amber-400" /> :
                                       equip.iconKey.includes('CONTROL') ? <Tablet className="w-4 h-4 text-purple-400" /> :
                                       equip.iconKey.includes('ACCESS') ? <Key className="w-4 h-4 text-purple-400" /> :
                                       equip.iconKey.includes('INTERCOM') ? <Phone className="w-4 h-4 text-sky-400" /> :
                                       equip.iconKey.includes('UPS') ? <Battery className="w-4 h-4 text-emerald-400" /> :
                                       <ShieldAlert className="w-4 h-4 text-purple-300" />}
                                    </div>
                                    <span className="text-xs font-bold text-white tracking-tight leading-tight truncate max-w-[180px]">{equip.name}</span>
                                  </div>
                                </div>

                                <p className="text-[10px] text-zinc-400 leading-normal font-sans pr-14 truncate">{equip.desc || 'Pas de description.'}</p>

                                {/* Hover actions */}
                                <div className={cn(
                                  "absolute right-1 bottom-1 opacity-0 group-hover:opacity-100 flex items-center gap-1 px-1.5 py-0.5 rounded border shadow-lg transition-opacity",
                                  theme === 'dark' ? "bg-[#181a1f] border-zinc-800" : "bg-white border-zinc-200"
                                )}>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setEditingCustomEquipId(equip.id);
                                      setNewCustomEquipName(equip.name);
                                      setNewCustomEquipType(equip.type);
                                      setNewCustomEquipIconKey(equip.iconKey);
                                      setNewCustomEquipDesc(equip.desc);
                                      setNewCustomEquipPrice(equip.price);
                                      setIsAddingCustomEquip(true);
                                    }}
                                    className="text-zinc-400 hover:text-blue-400 p-0.5"
                                    title="Modifier"
                                  >
                                    <Settings size={10} />
                                  </button>
                                  <button 
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      setCustomEquipmentTypes(prev => prev.filter(t => t.id !== equip.id));
                                      if (selectedTool === equip.id) {
                                        setSelectedTool('SELECT');
                                      }
                                    }}
                                    className="text-zinc-400 hover:text-red-400 p-0.5"
                                    title="Supprimer"
                                  >
                                    <Trash2 size={10} />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

                <div>
              <h3 className="text-xs font-extrabold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-4 flex items-center justify-between">
                <span>Calques de Conception</span>
                <div className="flex items-center gap-2">
                  {focusedLayerId && (
                    <button 
                      onClick={() => onToggleLayerFocus?.(focusedLayerId)}
                      className="text-blue-500 hover:text-blue-400 transition-colors p-1 rounded-md bg-blue-500/10 active:scale-95"
                      title="Quitter le mode focus"
                    >
                      <RotateCcw size={12} className="stroke-[2.5]" />
                    </button>
                  )}
                  <Plus size={14} className="cursor-pointer hover:text-blue-500 text-zinc-400 dark:text-zinc-500 transition-colors" />
                </div>
              </h3>
              <div className="space-y-2">
                {layers.map((layer) => {
                  const isFocused = focusedLayerId === layer.id;
                  return (
                  <div key={layer.id} className={cn(
                    "space-y-1.5 px-3 py-2.5 rounded-xl border cursor-pointer group transition-all relative overflow-hidden shadow-sm",
                    isFocused 
                      ? "bg-indigo-600/10 border-indigo-500/80 text-white shadow-indigo-950/20" 
                      : (theme === 'dark'
                          ? "bg-zinc-900/30 border-zinc-800/80 hover:bg-zinc-800/40 hover:border-zinc-700/80"
                          : "bg-white border-slate-200 hover:bg-slate-50 hover:border-slate-300")
                  )}>
                    {isFocused && (
                      <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 to-transparent animate-pulse pointer-events-none" />
                    )}
                    <div className="flex items-center gap-2.5 relative z-10">
                      <div className={cn(
                        "transition-all p-1 rounded-md bg-zinc-950/40",
                        layer.visible && !isFocused ? "text-indigo-400" : "text-zinc-500",
                        isFocused && "text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                      )}>
                        {layer.id === 'PLAN' ? <FileUp size={12} /> : 
                         layer.id === 'CCTV' ? <Camera size={12} /> :
                         layer.id === 'NETWORK' ? <NetworkIcon size={12} /> :
                         layer.id === 'WIFI' ? <Wifi size={12} /> : <ShieldAlert size={12} />}
                      </div>
                      <span className={cn(
                        "text-xs font-bold flex-1 truncate transition-colors tracking-tight",
                        isFocused ? "text-indigo-300 font-extrabold" : (layer.visible ? (theme === 'dark' ? "text-slate-200" : "text-slate-800") : "text-zinc-400 dark:text-zinc-600")
                      )}>{layer.name}</span>
                      
                      <div className={cn(
                        "flex items-center gap-1 transition-opacity",
                        isFocused ? "opacity-100" : "opacity-0 group-hover:opacity-100"
                      )}>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onToggleLayerFocus?.(layer.id);
                          }}
                          className={cn(
                            "p-1 rounded-md transition-all active:scale-90",
                            isFocused ? "text-indigo-300 bg-indigo-500/20 shadow-md" : "text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800"
                          )}
                          title={isFocused ? "Sortir du mode Focus" : "Focus (isoler ce calque)"}
                        >
                          <Focus size={11} className={isFocused ? "animate-pulse" : ""} />
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            onUpdateLayer({ ...layer, visible: !layer.visible });
                          }}
                          className={cn(
                            "p-1 rounded-md transition-all active:scale-90",
                            theme === 'dark' ? "text-zinc-400 hover:bg-zinc-800 hover:text-white" : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                          )}
                          title={layer.visible ? "Masquer" : "Afficher"}
                        >
                          {layer.visible ? <Eye size={12} /> : <EyeOff size={12} />}
                        </button>
                      </div>
                    </div>
                    {/* Opacity slider */}
                    <div className="pl-7 relative z-10">
                      <input 
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={layer.opacity}
                        onChange={(e) => onUpdateLayer({ ...layer, opacity: parseFloat(e.target.value) })}
                        className="w-full h-1 accent-indigo-500 bg-zinc-800 dark:bg-zinc-700 rounded-lg appearance-none cursor-pointer"
                      />
                    </div>
                  </div>
                  )})}
              </div>
              
              {currentSheetId && onImportImageOverlay && (
                <div className="mt-3">
                  <input 
                    type="file" 
                    id="add-image-overlay" 
                    className="hidden" 
                    accept="image/*"
                    multiple
                    onChange={onImportImageOverlay}
                  />
                  <label 
                    htmlFor="add-image-overlay" 
                    className="flex items-center gap-2 justify-center bg-zinc-800 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:bg-zinc-700 px-2 py-1.5 rounded-sm text-[11px] text-zinc-300 transition-all border border-zinc-700 cursor-pointer"
                  >
                    <ImageIcon size={12} />
                    <span>Add Image Overlay</span>
                  </label>
                </div>
              )}
            </div>
          </div>
          ) : (
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
              <div>
                <div className={cn(
                  "flex items-center justify-between mb-3 pb-1 border-b transition-colors duration-300",
                  theme === 'dark' ? "border-zinc-800" : "border-[var(--color-app-border)]"
                )}>
                  <h3 className={cn(
                    "text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 transition-colors duration-300",
                    theme === 'dark' ? "text-zinc-400" : "text-[var(--color-app-text-muted)]"
                  )}>
                    <Waypoints size={13} className="text-blue-400" />
                    <span>Cable Library</span>
                  </h3>
                  {!isAddingCableType && (
                    <button
                      id="btn-add-cable-type"
                      type="button"
                      onClick={() => {
                        setEditingCableTypeId(null);
                        setNewCableTypeName('');
                        setNewCableTypeColor('#3b82f6');
                        setNewCableTypeThickness(3);
                        setNewCableTypeCost(1.20);
                        setIsAddingCableType(true);
                      }}
                      className="p-1 hover:bg-zinc-800 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.05)] hover:text-blue-400 rounded-sm cursor-pointer transition-all border border-zinc-700 bg-zinc-800 flex items-center justify-center"
                      title="Define new cable type"
                    >
                      <Plus size={12} />
                    </button>
                  )}
                </div>

                {isAddingCableType && (
                  <form onSubmit={handleSaveCableType} className="bg-[#0f1115] p-3 rounded-sm border border-zinc-700/50 shadow-sm space-y-3 mb-4 animate-in fade-in duration-200">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wide">
                      {editingCableTypeId ? "Edit Cable Type" : "Create Cable Type"}
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Name</label>
                      <input
                        type="text"
                        required
                        value={newCableTypeName}
                        onChange={(e) => setNewCableTypeName(e.target.value)}
                        placeholder="e.g. Cat6, Fiber OM4"
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Color</label>
                        <div className="flex gap-1.5 items-center">
                          <input
                            type="color"
                            value={newCableTypeColor}
                            onChange={(e) => setNewCableTypeColor(e.target.value)}
                            className="w-6 h-6 border-0 bg-transparent cursor-pointer rounded overflow-hidden"
                          />
                          <span className="text-[10px] font-mono text-zinc-400 uppercase">{newCableTypeColor}</span>
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] text-zinc-500 block mb-1">Thick (px)</label>
                        <input
                          type="number"
                          min="1"
                          max="10"
                          step="0.5"
                          value={newCableTypeThickness}
                          onChange={(e) => setNewCableTypeThickness(parseFloat(e.target.value) || 3)}
                          className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 block mb-1">Cost per Meter (€/m)</label>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={newCableTypeCost}
                        onChange={(e) => setNewCableTypeCost(parseFloat(e.target.value) || 0)}
                        className="w-full bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
                      />
                    </div>
                    <div className="flex justify-end gap-1.5 pt-1">
                      <button
                        type="button"
                        onClick={() => setIsAddingCableType(false)}
                        className="px-2.5 py-1 text-[10px] font-bold uppercase rounded border border-zinc-700 bg-zinc-800 text-zinc-400 hover:text-white"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-2.5 py-1 text-[10px] font-bold uppercase rounded bg-blue-600 hover:bg-blue-700 text-white shadow-sm"
                      >
                        {editingCableTypeId ? "Save" : "Add"}
                      </button>
                    </div>
                  </form>
                )}

                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1">
                  {customCableTypes.map((type) => {
                    const stats = (() => {
                      const currentSheet = sheets.find(s => s.id === currentSheetId);
                      const currentCables = currentSheet ? currentSheet.cables : [];
                      const currentScaleRatio = currentSheet ? (currentSheet.scaleRatio || 20) : 20;
                      let count = 0;
                      let totalPx = 0;
                      currentCables.forEach((cable) => {
                        if (cable.cableTypeId === type.id || cable.type === type.id) {
                          count++;
                          let pxLen = 0;
                          for (let i = 0; i < cable.points.length - 2; i += 2) {
                            const dx = cable.points[i+2] - cable.points[i];
                            const dy = cable.points[i+3] - cable.points[i+1];
                            pxLen += Math.sqrt(dx * dx + dy * dy);
                          }
                          totalPx += pxLen;
                        }
                      });
                      const meters = totalPx / currentScaleRatio;
                      return { count, meters };
                    })();
                    return (
                      <div 
                        key={type.id} 
                        className="group bg-[#0f1115] p-2 rounded-sm border border-zinc-700/50 hover:border-zinc-700 transition-all text-left relative flex flex-col gap-1"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span 
                              className="w-2.5 h-2.5 rounded-full border border-zinc-900 shadow-sm block shrink-0" 
                              style={{ backgroundColor: type.color }} 
                            />
                            <span className="text-[11px] font-bold text-zinc-200 truncate">{type.name}</span>
                          </div>
                          <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 transition-all shrink-0">
                            <button
                              id={`edit-cable-type-${type.id}`}
                              type="button"
                              onClick={() => handleEditCableType(type)}
                              className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-blue-400 rounded transition-all cursor-pointer"
                              title="Edit cable type"
                            >
                              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                              </svg>
                            </button>
                            <button
                              id={`delete-cable-type-${type.id}`}
                              type="button"
                              onClick={() => handleDeleteCableType(type.id)}
                              className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded transition-all cursor-pointer"
                              title="Delete cable type"
                            >
                              <Trash2 size={11} />
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 text-[9px] text-zinc-500 font-mono">
                          <div>Thick: <span className="text-zinc-400 font-semibold">{type.thickness}px</span></div>
                          <div className="text-right">Cost: <span className="text-zinc-400 font-semibold font-bold">{(type.costPerMeter < 200 ? Math.round(type.costPerMeter * 655.957) : Math.round(type.costPerMeter)).toLocaleString('fr-FR').replace(/\//g, ' ')} {currency}/m</span></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest mb-3 pb-1 border-b border-zinc-800">
                  Bill of Materials (BOM)
                </h3>
                <div className="bg-[#0f1115] rounded-sm border border-zinc-700/50 p-2.5 space-y-2.5">
                  {sheets.length > 0 ? (
                    <>
                      <div className="space-y-1.5">
                        {customCableTypes.map((type) => {
                          const stats = (() => {
                            const currentSheet = sheets.find(s => s.id === currentSheetId);
                            const currentCables = currentSheet ? currentSheet.cables : [];
                            const currentScaleRatio = currentSheet ? (currentSheet.scaleRatio || 20) : 20;
                            let count = 0;
                            let totalPx = 0;
                            currentCables.forEach((cable) => {
                              if (cable.cableTypeId === type.id || cable.type === type.id) {
                                count++;
                                let pxLen = 0;
                                for (let i = 0; i < cable.points.length - 2; i += 2) {
                                  const dx = cable.points[i+2] - cable.points[i];
                                  const dy = cable.points[i+3] - cable.points[i+1];
                                  pxLen += Math.sqrt(dx * dx + dy * dy);
                                }
                                totalPx += pxLen;
                              }
                            });
                            const meters = totalPx / currentScaleRatio;
                            return { count, meters };
                          })();
                          if (stats.count === 0) return null;
                          const finalCostPerMeter = type.costPerMeter < 200 ? Math.round(type.costPerMeter * 655.957) : type.costPerMeter;
                          const totalCost = stats.meters * finalCostPerMeter;
                          return (
                            <div key={type.id} className="flex justify-between items-center text-[10px] border-b border-zinc-900/60 pb-1.5 last:border-0 last:pb-0">
                              <div className="space-y-0.5 min-w-0 flex-1">
                                <div className="flex items-center gap-1.5 font-bold text-zinc-300 min-w-0">
                                  <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: type.color }} />
                                  <span className="truncate">{type.name}</span>
                                </div>
                                <div className="text-[9px] text-zinc-500 font-mono">Qty: {stats.count} | {stats.meters.toFixed(1)}m</div>
                              </div>
                              <div className="text-right font-mono font-bold text-blue-400 shrink-0 pl-2">
                                {Math.round(totalCost).toLocaleString('fr-FR').replace(/\//g, ' ')} {currency}
                              </div>
                            </div>
                          );
                        })}
                        {customCableTypes.every(t => {
                          const currentSheet = sheets.find(s => s.id === currentSheetId);
                          const currentCables = currentSheet ? currentSheet.cables : [];
                          return !currentCables.some(c => c.cableTypeId === t.id || c.type === t.id);
                        }) && (
                          <div className="py-4 text-center text-zinc-500 text-[10px] italic">
                            No cables drawn on this plan sheet yet. Select CABLE tool and start drawing!
                          </div>
                        )}
                      </div>

                      <div className="border-t border-zinc-800/80 pt-2 flex justify-between items-center text-xs">
                        <span className="font-bold text-zinc-400">Project Estimate:</span>
                        <span className="font-mono font-bold text-green-400 text-sm">
                          {Math.round(customCableTypes.reduce((acc, type) => {
                            const currentSheet = sheets.find(s => s.id === currentSheetId);
                            const currentCables = currentSheet ? currentSheet.cables : [];
                            const currentScaleRatio = currentSheet ? (currentSheet.scaleRatio || 20) : 20;
                            let totalPx = 0;
                            currentCables.forEach((cable) => {
                              if (cable.cableTypeId === type.id || cable.type === type.id) {
                                let pxLen = 0;
                                for (let i = 0; i < cable.points.length - 2; i += 2) {
                                  const dx = cable.points[i+2] - cable.points[i];
                                  const dy = cable.points[i+3] - cable.points[i+1];
                                  pxLen += Math.sqrt(dx * dx + dy * dy);
                                }
                                totalPx += pxLen;
                              }
                            });
                            const finalCostPerMeter = type.costPerMeter < 200 ? Math.round(type.costPerMeter * 655.957) : type.costPerMeter;
                            return acc + ((totalPx / currentScaleRatio) * finalCostPerMeter);
                          }, 0)).toLocaleString('fr-FR').replace(/\//g, ' ')} {currency}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="py-4 text-center text-zinc-500 text-[10px] italic">
                      No plans loaded yet
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          <div className="p-4 border-t border-zinc-700/50 shadow-sm">
            <button 
              onClick={() => onOpenInventory('SETTINGS')}
              className="w-full flex items-center justify-center gap-2 text-xs text-zinc-500 hover:text-white py-2"
            >
              <Settings size={14} />
              Project Settings
            </button>
          </div>
        </aside>

        <main className={cn(
          "flex-1 relative flex flex-col overflow-hidden transition-colors duration-300",
          theme === 'dark' ? "bg-[#0a0a0a]" : "bg-[var(--color-app-bg)]"
        )}>
          <div className={cn(
            "h-12 border-b shadow-sm flex items-center px-4 gap-6 z-40 shadow-md transition-colors duration-300",
            theme === 'dark' ? "bg-[#181a1f] border-zinc-700/50" : "bg-white border-zinc-200"
          )}>
            <div className={cn(
              "flex items-center rounded-sm p-0.5 border transition-colors duration-300",
              theme === 'dark' ? "bg-[#0f1115] border-zinc-700" : "bg-zinc-200 border-zinc-300"
            )}>
              <button 
                onClick={() => setSelectedTool('SELECT')}
                className={cn("p-1.5 rounded-sm transition-colors", selectedTool === 'SELECT' ? "bg-zinc-800 text-white" : "hover:bg-zinc-800 text-zinc-400")}
                title="Pointeur de Sélection"
              >
                <MousePointer2 size={16} />
              </button>
              <button 
                onClick={() => setSelectedTool('MARQUEE')}
                className={cn("p-1.5 rounded-sm transition-colors", selectedTool === 'MARQUEE' ? "bg-zinc-800 text-white" : "hover:bg-zinc-800 text-zinc-400")}
                title="Sélection Multi-Équipements (Marquee)"
              >
                <MousePointerSquareDashed size={16} />
              </button>
              <button 
                onClick={() => setSelectedTool('RECTANGLE')}
                className={cn("p-1.5 rounded-sm transition-colors", selectedTool === 'RECTANGLE' ? "bg-zinc-800 text-white" : "hover:bg-zinc-800 text-zinc-400")}
                title="Rectangle (Frame)"
              >
                <Square size={16} />
              </button>
              <button 
                onClick={() => setSelectedTool('CIRCLE')}
                className={cn("p-1.5 rounded-sm transition-colors", selectedTool === 'CIRCLE' ? "bg-zinc-800 text-white" : "hover:bg-zinc-800 text-zinc-400")}
                title="Circle (Frame)"
              >
                <Circle size={16} />
              </button>
              <button 
                onClick={() => setSelectedTool('TEXT')}
                className={cn("p-1.5 rounded-sm transition-colors", selectedTool === 'TEXT' ? "bg-zinc-800 text-white" : "hover:bg-zinc-800 text-zinc-400")}
                title="Text"
              >
                <Type size={16} />
              </button>
              <button 
                onClick={() => setSelectedTool('MEASURE')}
                className={cn("p-1.5 rounded-sm transition-colors", selectedTool === 'MEASURE' ? "bg-zinc-800 text-white ring-1 ring-blue-500/50" : "hover:bg-zinc-800 text-zinc-400 hover:text-white")}
                title="Measure Distance & Calibration Tool"
              >
                <Ruler size={16} />
              </button>
              <button 
                onClick={() => setSelectedTool('CABLE')}
                className={cn("p-1.5 rounded-sm transition-colors", selectedTool === 'CABLE' ? "bg-zinc-800 text-white ring-1 ring-blue-500/50" : "hover:bg-zinc-800 text-zinc-400 hover:text-white")}
                title="Draw Cables (Straight or Curved)"
              >
                <Waypoints size={16} />
              </button>
            </div>

            <div className="h-6 w-[1px] bg-zinc-700" />

            <div className="flex items-center gap-1">
              {[
                { id: 'CCTV', name: 'CCTV', icon: <Camera size={16} /> },
                { id: 'WIFI', name: 'Wifi', icon: <Wifi size={16} /> },
                { id: 'NETWORK', name: 'Network', icon: <NetworkIcon size={16} /> },
                { id: 'FIRE', name: 'Fire', icon: <ShieldAlert size={16} /> },
              ].map(tool => (
                <button 
                  key={tool.id}
                  onClick={() => setSelectedTool(tool.id as EquipmentType)}
                  className={cn(
                    "p-2 rounded-sm transition-all flex items-center gap-2 border border-transparent",
                    selectedTool === tool.id ? "bg-blue-600/20 text-blue-400 border-blue-500/30" : "hover:bg-zinc-800 text-zinc-300"
                  )}
                >
                  {tool.icon}
                  <span className="text-xs font-medium">{tool.name}</span>
                </button>
              ))}
            </div>

            <div className="flex-1" />

            <div className={cn(
              "flex items-center gap-4 px-3 py-1 rounded-sm border transition-colors duration-300",
              theme === 'dark' ? "bg-[#0f1115] border-zinc-700" : "bg-white border-zinc-300"
            )}>
               <button 
                onClick={() => currentSheetIndex > 0 && onSelectSheet(sheets[currentSheetIndex - 1].id)}
                disabled={currentSheetIndex <= 0}
                className="text-zinc-400 hover:text-white disabled:opacity-30"
                title="Previous Sheet"
               >
                <ChevronLeft size={16} />
               </button>
               <span className="text-xs font-mono text-blue-400 min-w-[80px] text-center">
                 Sheet {sheets.length > 0 ? currentSheetIndex + 1 : 0} / {sheets.length}
               </span>
               <button 
                onClick={() => currentSheetIndex < sheets.length - 1 && onSelectSheet(sheets[currentSheetIndex + 1].id)}
                disabled={currentSheetIndex >= sheets.length - 1 || currentSheetIndex === -1}
                className="text-zinc-400 hover:text-white disabled:opacity-30"
                title="Next Sheet"
               >
                 <ChevronRight size={16} />
               </button>
            </div>

            <div className="flex items-center gap-2 bg-[#0f1115] px-2 py-1 rounded-sm border border-zinc-700">
              <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">Zoom</span>
              <input 
                type="text" 
                value={`${Math.round(zoom * 100)}%`} 
                onChange={(e) => {
                  const val = parseInt(e.target.value);
                  if (!isNaN(val)) setZoom(val / 100);
                }}
                className="w-12 bg-transparent text-xs text-center border-none focus:ring-0" 
              />
            </div>
            
            <div className="flex items-center gap-2 bg-[#0f1115] px-2 py-1 rounded-sm border border-zinc-700">
              <span className="text-[10px] text-zinc-500 font-bold uppercase mr-1">Icon Size</span>
              <input 
                type="range"
                min="0.5"
                max="3"
                step="0.1"
                value={iconScale}
                onChange={(e) => setIconScale(parseFloat(e.target.value))}
                className="w-20 h-1 bg-zinc-700 rounded-sm appearance-none cursor-pointer accent-blue-500" 
              />
            </div>
          </div>

          <div className={cn(
            "flex-1 relative overflow-hidden flex items-stretch justify-stretch transition-colors duration-300",
            theme === 'dark' ? "bg-[#0a0a0a] pattern-grid" : "bg-white/50 pattern-grid opacity-100"
          )}>
            {children}
          </div>
        </main>

        <aside className={cn(
          "w-72 border-l shadow-sm flex flex-col shadow-2xl transition-colors duration-300",
          theme === 'dark' ? "bg-[#181a1f] border-zinc-700/50" : "bg-[var(--color-app-sidebar)] border-[var(--color-app-border)]"
        )}>
          <div className={cn(
            "p-4 border-b shadow-sm transition-colors duration-300",
            theme === 'dark' ? "bg-[#181a1f] border-zinc-700/50" : "bg-white border-[var(--color-app-border)]"
          )}>
            <h3 className="text-xs font-bold text-zinc-100 uppercase tracking-widest">Properties</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedImageOverlay ? (
              <div className={cn(
                "rounded-sm p-4 border space-y-4 transition-colors duration-300",
                theme === 'dark' ? "bg-[#181a1f] border-zinc-700" : "bg-zinc-50 border-zinc-200 shadow-sm"
              )}>
                <div className={cn(
                  "flex items-center justify-between border-b pb-2 transition-colors duration-300",
                  theme === 'dark' ? "border-zinc-700" : "border-zinc-200"
                )}>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">Image Overlay</span>
                  <button 
                    onClick={() => onDeleteImageOverlay && onDeleteImageOverlay(selectedImageOverlay.id)}
                    className="p-1 rounded-sm hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
                
                <div className="text-xs text-zinc-400 break-words mb-2">
                  {selectedImageOverlay.name}
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Rotation ({selectedImageOverlay.rotation}°)</label>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={selectedImageOverlay.rotation || 0}
                    onChange={(e) => onUpdateImageOverlay && onUpdateImageOverlay({
                      ...selectedImageOverlay,
                      rotation: parseInt(e.target.value)
                    })}
                    className="w-full accent-blue-500 bg-[#0f1115] h-1 rounded-sm appearance-none cursor-pointer"
                  />
                </div>
              </div>
            ) : selectedCable ? (
              <div className={cn(
                "rounded-sm p-4 border space-y-4 transition-colors duration-300",
                theme === 'dark' ? "bg-[#181a1f] border-zinc-700" : "bg-zinc-50 border-zinc-200 shadow-sm"
              )}>
                <div className={cn(
                  "flex items-center justify-between border-b pb-2 transition-colors duration-300",
                  theme === 'dark' ? "border-zinc-700" : "border-zinc-200"
                )}>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">
                    Cable: {customCableTypes.find(t => t.id === selectedCable.cableTypeId || t.id === selectedCable.type)?.name || selectedCable.type}
                  </span>
                  <button 
                    onClick={() => onDeleteCable && onDeleteCable(selectedCable.id)}
                    className="p-1 rounded-sm hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                {/* Cable Type Dropdown Selection */}
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Defined Library Type</label>
                  <select
                    value={selectedCable.cableTypeId || ''}
                    onChange={(e) => {
                      const typeId = e.target.value;
                      const typeDef = customCableTypes.find(t => t.id === typeId);
                      if (onUpdateCable && typeDef) {
                        onUpdateCable({
                          ...selectedCable,
                          cableTypeId: typeId,
                          color: typeDef.color,
                          strokeWidth: typeDef.thickness
                        });
                      }
                    }}
                    className={cn(
                      "w-full border rounded-sm p-2 text-xs focus:outline-none focus:border-blue-500 transition-colors duration-300",
                      theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                    )}
                  >
                    <option value="" disabled>-- Select Custom Type --</option>
                    {customCableTypes.map(t => (
                      <option key={t.id} value={t.id}>{t.name}</option>
                    ))}
                  </select>
                </div>

                {/* Cable Metrics & Estimate Box */}
                <div className={cn(
                  "border rounded p-2.5 space-y-1.5 font-mono text-[10px] transition-colors",
                  theme === 'dark' ? "bg-[#0f1115] border-zinc-800" : "bg-white border-zinc-200 shadow-sm"
                )}>
                  {(() => {
                    let pxLen = 0;
                    for (let i = 0; i < selectedCable.points.length - 2; i += 2) {
                      const dx = selectedCable.points[i+2] - selectedCable.points[i];
                      const dy = selectedCable.points[i+3] - selectedCable.points[i+1];
                      pxLen += Math.sqrt(dx * dx + dy * dy);
                    }
                    const currentSheet = sheets.find(s => s.id === currentSheetId);
                    const currentScaleRatio = currentSheet ? (currentSheet.scaleRatio || 20) : 20;
                    const lenMeters = pxLen / currentScaleRatio;
                    const matchedType = customCableTypes.find(t => t.id === selectedCable.cableTypeId || t.id === selectedCable.type);
                    return (
                      <>
                        <div className="flex justify-between">
                          <span className="text-zinc-500">Segment Length:</span>
                          <span className={cn("font-bold", theme === 'dark' ? "text-zinc-300" : "text-zinc-700")}>{lenMeters.toFixed(2)} m</span>
                        </div>
                        {matchedType && (
                          <div className={cn("flex justify-between border-t pt-1.5", theme === 'dark' ? "border-zinc-900/60" : "border-zinc-100")}>
                            <span className="text-zinc-500">Unit Cost:</span>
                            <span className={cn(theme === 'dark' ? "text-zinc-300" : "text-zinc-700")}>€{matchedType.costPerMeter.toFixed(2)}/m</span>
                          </div>
                        )}
                        <div className={cn("flex justify-between border-t pt-1.5", theme === 'dark' ? "border-zinc-900/60" : "border-zinc-100")}>
                          <span className="text-zinc-500">Estimated Cost:</span>
                          <span className="text-green-400 font-bold">
                            {matchedType 
                              ? `€${(lenMeters * matchedType.costPerMeter).toFixed(2)}` 
                              : 'N/A (No Type)'}
                          </span>
                        </div>
                      </>
                    );
                  })()}
                </div>

                {selectedCable.type === 'curved' && (
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Curvature (Tension)</label>
                      <span className="text-[10px] text-blue-400 font-mono">{selectedCable.tension?.toFixed(1) ?? '0.4'}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1.5" 
                      step="0.1"
                      value={selectedCable.tension ?? 0.4}
                      onChange={(e) => onUpdateCable && onUpdateCable({
                        ...selectedCable,
                        tension: parseFloat(e.target.value)
                      })}
                      className={cn(
                        "w-full accent-blue-500 h-1 rounded-sm appearance-none cursor-pointer transition-colors",
                        theme === 'dark' ? "bg-[#0f1115]" : "bg-zinc-300"
                      )}
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Thickness Override</label>
                    <span className="text-[10px] text-blue-400 font-mono">{selectedCable.strokeWidth ?? 2} px</span>
                  </div>
                  <input 
                    type="range" 
                    min="1" 
                    max="10" 
                    step="0.5"
                    value={selectedCable.strokeWidth ?? 2}
                    onChange={(e) => onUpdateCable && onUpdateCable({
                      ...selectedCable,
                      strokeWidth: parseFloat(e.target.value)
                    })}
                    className={cn(
                      "w-full accent-blue-500 h-1 rounded-sm appearance-none cursor-pointer transition-colors",
                      theme === 'dark' ? "bg-[#0f1115]" : "bg-zinc-300"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Dashed Pattern</label>
                  <select
                    value={selectedCable.dash ? selectedCable.dash.join(',') : 'solid'}
                    onChange={(e) => {
                      const val = e.target.value;
                      const newDash = val === 'solid' ? undefined : val.split(',').map(Number);
                      if (onUpdateCable) {
                        onUpdateCable({ ...selectedCable, dash: newDash });
                      }
                    }}
                    className={cn(
                      "w-full border rounded-sm p-2 text-xs focus:outline-none focus:border-blue-500 transition-colors duration-300",
                      theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                    )}
                  >
                    <option value="solid">Solid</option>
                    <option value="5,5">Dashed (5,5)</option>
                    <option value="10,10">Dashed (10,10)</option>
                    <option value="15,5">Dashed (15,5)</option>
                    <option value="2,4">Dotted (2,4)</option>
                  </select>
                </div>
                
                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Color Override</label>
                  <div className="flex flex-wrap gap-2">
                    {['#3b82f6', '#ef4444', '#22c55e', '#eab308', '#a855f7', '#64748b', '#ec4899'].map(color => (
                      <button
                        key={color}
                        onClick={() => onUpdateCable && onUpdateCable({ ...selectedCable, color })}
                        className={`w-5 h-5 rounded-sm border-2 ${selectedCable.color === color ? 'border-white' : 'border-zinc-800'} cursor-pointer`}
                        style={{ backgroundColor: color }}
                      />
                    ))}
                  </div>
                </div>

              </div>
            ) : selectedEquipment ? (
              <div className={cn(
                "rounded-sm p-4 border space-y-4 transition-colors duration-300",
                theme === 'dark' ? "bg-[#181a1f] border-zinc-700" : "bg-zinc-50 border-zinc-200 shadow-sm"
              )}>
                <div className={cn(
                  "flex items-center justify-between border-b pb-2 transition-colors duration-300",
                  theme === 'dark' ? "border-zinc-700" : "border-zinc-200"
                )}>
                  <span className="text-xs font-bold text-blue-400 uppercase tracking-wider">{selectedEquipment.type}</span>
                  <button 
                    onClick={() => onDeleteEquipment && onDeleteEquipment(selectedEquipment.id)}
                    className="p-1 rounded-sm hover:bg-red-500/20 text-zinc-400 hover:text-red-400 transition-colors"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] text-zinc-400 uppercase font-bold">Device Type / Model</label>
                  <input 
                    type="text" 
                    value={selectedEquipment.subType}
                    onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                      ...selectedEquipment,
                      subType: e.target.value
                    })}
                    className={cn(
                      "w-full border rounded-sm p-2 text-xs focus:outline-none focus:border-blue-500 transition-colors duration-300",
                      theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Rotation</label>
                    <div className="flex items-center gap-1">
                      <input 
                        type="number" 
                        min="0" 
                        max="359" 
                        value={selectedEquipment.rotation}
                        onChange={(e) => {
                          let val = parseInt(e.target.value);
                          if (isNaN(val)) val = 0;
                          val = (val % 360 + 360) % 360;
                          onUpdateEquipment && onUpdateEquipment({
                            ...selectedEquipment,
                            rotation: val
                          });
                        }}
                        className={cn(
                          "w-12 text-center border rounded-sm py-0.5 px-1 text-xs font-mono focus:outline-none focus:border-blue-500",
                          theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                      <span className="text-[10px] text-zinc-500 font-bold font-mono">°</span>
                    </div>
                  </div>
                  <input 
                    type="range" 
                    min="0" 
                    max="360" 
                    value={selectedEquipment.rotation}
                    onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                      ...selectedEquipment,
                      rotation: parseInt(e.target.value)
                    })}
                    className={cn(
                      "w-full accent-blue-500 h-1 rounded-sm appearance-none cursor-pointer transition-colors",
                      theme === 'dark' ? "bg-[#0f1115]" : "bg-zinc-300"
                    )}
                  />
                  {/* Preset Buttons */}
                  <div className="flex gap-1 flex-wrap mt-1">
                    {[0, 90, 180, 270].map((deg) => (
                      <button
                        key={deg}
                        type="button"
                        onClick={() => onUpdateEquipment && onUpdateEquipment({
                          ...selectedEquipment,
                          rotation: deg
                        })}
                        className={cn(
                          "px-2 py-0.5 rounded text-[9px] font-mono font-bold transition-all border active:scale-95",
                          selectedEquipment.rotation === deg 
                            ? "bg-blue-600 border-blue-500 text-white" 
                            : theme === 'dark'
                              ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                              : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                        )}
                      >
                        {deg}°
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => onUpdateEquipment && onUpdateEquipment({
                        ...selectedEquipment,
                        rotation: ((selectedEquipment.rotation - 15 + 360) % 360)
                      })}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all border active:scale-95 ml-auto",
                        theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                      )}
                      title="Tourner -15°"
                    >
                      -15°
                    </button>
                    <button
                      type="button"
                      onClick={() => onUpdateEquipment && onUpdateEquipment({
                        ...selectedEquipment,
                        rotation: ((selectedEquipment.rotation + 15) % 360)
                      })}
                      className={cn(
                        "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all border active:scale-95",
                        theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200" : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                      )}
                      title="Tourner +15°"
                    >
                      +15°
                    </button>
                  </div>
                </div>

                {/* CCTV Camera Focal Length Selector & Custom Adjustments */}
                {(selectedEquipment.type === 'CCTV' || selectedEquipment.type === 'CCTV_DOME' || selectedEquipment.type === 'CCTV_BULLET') && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold block">Focal Length (Lens Preset)</label>
                      <select
                        value={selectedEquipment.properties?.focalLength || 2.8}
                        onChange={(e) => {
                          const fl = parseFloat(e.target.value);
                          const newProps = { ...selectedEquipment.properties, focalLength: fl } as any;
                          delete newProps.reach;
                          delete newProps.fovAngle;
                          onUpdateEquipment && onUpdateEquipment({
                            ...selectedEquipment,
                            properties: newProps
                          });
                        }}
                        className={cn(
                          "w-full border rounded-sm p-2 text-xs focus:outline-none focus:border-blue-500 font-mono transition-colors duration-300",
                          theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      >
                        <option value="2.8">2.8 mm (100° Wide Angle)</option>
                        <option value="4">4.0 mm (80° Standard)</option>
                        <option value="6">6.0 mm (60° Telephoto)</option>
                        <option value="8">8.0 mm (45° Zoom)</option>
                        <option value="12">12.0 mm (25° Narrow Zoom)</option>
                      </select>
                    </div>

                    {/* Custom Focal Distance Slider */}
                    {(() => {
                      const currentSheet = sheets.find(s => s.id === currentSheetId);
                      const currentScaleRatio = currentSheet ? (currentSheet.scaleRatio || 20) : 20;
                      const currentReachPx = selectedEquipment.properties?.reach !== undefined 
                        ? selectedEquipment.properties.reach 
                        : (selectedEquipment.properties?.focalLength === 4 ? 140 
                          : selectedEquipment.properties?.focalLength === 6 ? 180 
                          : selectedEquipment.properties?.focalLength === 8 ? 220 
                          : selectedEquipment.properties?.focalLength === 12 ? 280 
                          : 110);
                      const currentReachMeters = parseFloat((currentReachPx / currentScaleRatio).toFixed(1));

                      return (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-zinc-400 uppercase font-bold">Focal Distance (Portée)</label>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                step="0.5"
                                min="1"
                                max="1000"
                                value={currentReachMeters}
                                onChange={(e) => {
                                  let val = parseFloat(e.target.value);
                                  if (isNaN(val) || val <= 0) return;
                                  const newReachPx = Math.round(val * currentScaleRatio);
                                  onUpdateEquipment && onUpdateEquipment({
                                    ...selectedEquipment,
                                    properties: {
                                      ...selectedEquipment.properties,
                                      reach: newReachPx
                                    }
                                  });
                                }}
                                className={cn(
                                  "w-12 text-center border rounded-sm py-0.5 px-1 text-xs font-mono focus:outline-none focus:border-blue-500",
                                  theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                                )}
                              />
                              <span className="text-[10px] text-zinc-500 font-bold font-mono">m</span>
                            </div>
                          </div>
                          <input 
                            type="range" 
                            min="20" 
                            max="1000" 
                            value={currentReachPx}
                            onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                              ...selectedEquipment,
                              properties: {
                                ...selectedEquipment.properties,
                                reach: parseInt(e.target.value)
                              }
                            })}
                            className="w-full accent-blue-500 bg-[#0f1115] h-1 rounded-sm appearance-none cursor-pointer"
                          />
                          {/* Preset buttons */}
                          <div className="flex gap-1 flex-wrap mt-1">
                            {[5, 10, 15, 20, 30].map((mVal) => (
                              <button
                                key={mVal}
                                type="button"
                                onClick={() => {
                                  const newReachPx = Math.round(mVal * currentScaleRatio);
                                  onUpdateEquipment && onUpdateEquipment({
                                    ...selectedEquipment,
                                    properties: {
                                      ...selectedEquipment.properties,
                                      reach: newReachPx
                                    }
                                  });
                                }}
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all border active:scale-95",
                                  Math.abs(currentReachMeters - mVal) < 0.2
                                    ? "bg-blue-600 border-blue-500 text-white" 
                                    : theme === 'dark'
                                      ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                      : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                                )}
                              >
                                {mVal}m
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}

                    {/* Custom Focal Angle / Aperture Slider */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Focal Coverage (Angle FOV)</label>
                        <span className="text-xs font-mono text-purple-400 font-bold">
                          {selectedEquipment.properties?.fovAngle !== undefined 
                            ? `${selectedEquipment.properties.fovAngle}°` 
                            : 'Preset'}
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="10" 
                        max="360" 
                        value={selectedEquipment.properties?.fovAngle !== undefined 
                          ? selectedEquipment.properties.fovAngle 
                          : (selectedEquipment.properties?.focalLength === 4 ? 80 
                            : selectedEquipment.properties?.focalLength === 6 ? 60 
                            : selectedEquipment.properties?.focalLength === 8 ? 45 
                            : selectedEquipment.properties?.focalLength === 12 ? 25 
                            : 100)}
                        onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                          ...selectedEquipment,
                          properties: {
                            ...selectedEquipment.properties,
                            fovAngle: parseInt(e.target.value)
                          }
                        })}
                        className="w-full accent-purple-500 bg-[#0f1115] h-1 rounded-sm appearance-none cursor-pointer"
                      />
                    </div>
                    {/* Range Opacity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Range Opacity</label>
                        <span className="text-xs font-mono text-zinc-400 font-bold">
                          {((selectedEquipment.properties?.coverageOpacity || 0.12) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={selectedEquipment.properties?.coverageOpacity || 0.12}
                        onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                          ...selectedEquipment,
                          properties: { ...selectedEquipment.properties, coverageOpacity: parseFloat(e.target.value) }
                        })}
                        className="w-full accent-blue-500 bg-[#0f1115] h-1 rounded-sm appearance-none cursor-pointer"
                      />
                    </div>
                    
                    {/* Range Color */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Range Color</label>
                      <input 
                        type="color" 
                        value={selectedEquipment.properties?.coverageColor || "#3b82f6"}
                        onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                          ...selectedEquipment,
                          properties: { ...selectedEquipment.properties, coverageColor: e.target.value }
                        })}
                        className="w-full bg-[#0f1115] border border-zinc-700 rounded-sm p-1 h-8 text-xs text-white"
                      />
                    </div>
                  </div>
                )}
                
                {/* Text Tool */}
                {selectedEquipment.type === 'TEXT' && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Text Content</label>
                    <input
                      type="text"
                      value={selectedEquipment.properties?.text || ""}
                      onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                        ...selectedEquipment,
                        properties: { ...selectedEquipment.properties, text: e.target.value }
                      })}
                      className={cn(
                        "w-full border rounded-sm p-2 text-xs focus:outline-none focus:border-blue-500 transition-colors duration-300",
                        theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>
                )}
                {/* Rectangle/Circle Tool */}
                {(selectedEquipment.type === 'RECTANGLE' || selectedEquipment.type === 'CIRCLE') && (
                  <div className="space-y-2">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">
                        {selectedEquipment.type === 'RECTANGLE' ? 'Width / Height' : 'Radius'}
                    </label>
                    {selectedEquipment.type === 'RECTANGLE' && (
                        <div className="flex gap-2">
                            <input type="number" placeholder="W" value={selectedEquipment.properties?.width || 100} onChange={(e) => onUpdateEquipment && onUpdateEquipment({...selectedEquipment, properties: {...selectedEquipment.properties, width: parseInt(e.target.value)}})} className={cn(
                              "w-full border rounded-sm p-2 text-xs focus:outline-none focus:border-blue-500 transition-colors duration-300",
                              theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                            )} />
                            <input type="number" placeholder="H" value={selectedEquipment.properties?.height || 50} onChange={(e) => onUpdateEquipment && onUpdateEquipment({...selectedEquipment, properties: {...selectedEquipment.properties, height: parseInt(e.target.value)}})} className={cn(
                              "w-full border rounded-sm p-2 text-xs focus:outline-none focus:border-blue-500 transition-colors duration-300",
                              theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                            )} />
                        </div>
                    )}
                    {selectedEquipment.type === 'CIRCLE' && (
                        <input type="number" value={selectedEquipment.properties?.radius || 50} onChange={(e) => onUpdateEquipment && onUpdateEquipment({...selectedEquipment, properties: {...selectedEquipment.properties, radius: parseInt(e.target.value)}})} className={cn(
                          "w-full border rounded-sm p-2 text-xs focus:outline-none focus:border-blue-500 transition-colors duration-300",
                          theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )} />
                    )}
                  </div>
                )}

                {/* WiFi / Fire / Siren Range Controls */}
                {(selectedEquipment.type === 'WIFI' || selectedEquipment.type === 'WIFI_ROUTER' || 
                  selectedEquipment.type === 'FIRE' || selectedEquipment.type === 'FIRE_DETECTOR' || 
                  selectedEquipment.type === 'ALARM_SIREN') && (
                  <div className="space-y-2">
                    {(() => {
                      const currentSheet = sheets.find(s => s.id === currentSheetId);
                      const currentScaleRatio = currentSheet ? (currentSheet.scaleRatio || 20) : 20;
                      const currentCoveragePx = selectedEquipment.properties?.coverageRange || (selectedEquipment.type.startsWith('WIFI') ? 80 : selectedEquipment.type.startsWith('FIRE') ? 50 : 60);
                      const currentCoverageMeters = parseFloat((currentCoveragePx / currentScaleRatio).toFixed(1));

                      return (
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <label className="text-[10px] text-zinc-400 uppercase font-bold">Rayon de couverture</label>
                            <div className="flex items-center gap-1">
                              <input 
                                type="number" 
                                step="0.5"
                                min="1"
                                max="1000"
                                value={currentCoverageMeters}
                                onChange={(e) => {
                                  let val = parseFloat(e.target.value);
                                  if (isNaN(val) || val <= 0) return;
                                  const newCoveragePx = Math.round(val * currentScaleRatio);
                                  onUpdateEquipment && onUpdateEquipment({
                                    ...selectedEquipment,
                                    properties: {
                                      ...selectedEquipment.properties,
                                      coverageRange: newCoveragePx
                                    }
                                  });
                                }}
                                className={cn(
                                  "w-12 text-center border rounded-sm py-0.5 px-1 text-xs font-mono focus:outline-none focus:border-blue-500",
                                  theme === 'dark' ? "bg-[#0f1115] border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                                )}
                              />
                              <span className="text-[10px] text-zinc-500 font-bold font-mono">m</span>
                            </div>
                          </div>
                          <input 
                            type="range" 
                            min="10" 
                            max="500" 
                            value={currentCoveragePx}
                            onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                              ...selectedEquipment,
                              properties: {
                                ...selectedEquipment.properties,
                                coverageRange: parseInt(e.target.value)
                              }
                            })}
                            className="w-full accent-blue-500 bg-[#0f1115] h-1 rounded-sm appearance-none cursor-pointer"
                          />
                          {/* Preset buttons */}
                          <div className="flex gap-1 flex-wrap mt-1">
                            {[2, 3, 5, 8, 12, 15].map((mVal) => (
                              <button
                                key={mVal}
                                type="button"
                                onClick={() => {
                                  const newCoveragePx = Math.round(mVal * currentScaleRatio);
                                  onUpdateEquipment && onUpdateEquipment({
                                    ...selectedEquipment,
                                    properties: {
                                      ...selectedEquipment.properties,
                                      coverageRange: newCoveragePx
                                    }
                                  });
                                }}
                                className={cn(
                                  "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold transition-all border active:scale-95",
                                  Math.abs(currentCoverageMeters - mVal) < 0.2
                                    ? "bg-blue-600 border-blue-500 text-white" 
                                    : theme === 'dark'
                                      ? "bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200"
                                      : "bg-zinc-100 border-zinc-200 text-zinc-600 hover:bg-zinc-200"
                                )}
                              >
                                {mVal}m
                              </button>
                            ))}
                          </div>
                        </div>
                      );
                    })()}
                    {/* Range Opacity */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-zinc-400 uppercase font-bold">Range Opacity</label>
                        <span className="text-xs font-mono text-zinc-400 font-bold">
                          {((selectedEquipment.properties?.coverageOpacity || 0.18) * 100).toFixed(0)}%
                        </span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="1" 
                        step="0.05"
                        value={selectedEquipment.properties?.coverageOpacity || 0.18}
                        onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                          ...selectedEquipment,
                          properties: { ...selectedEquipment.properties, coverageOpacity: parseFloat(e.target.value) }
                        })}
                        className="w-full accent-blue-500 bg-[#0f1115] h-1 rounded-sm appearance-none cursor-pointer"
                      />
                    </div>
                    
                    {/* Range Color */}
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-400 uppercase font-bold">Range Color</label>
                      <input 
                        type="color" 
                        value={selectedEquipment.properties?.coverageColor || (selectedEquipment.type.startsWith('WIFI') ? "#22c55e" : selectedEquipment.type.startsWith('FIRE') ? "#ef4444" : "#f43f5e")}
                        onChange={(e) => onUpdateEquipment && onUpdateEquipment({
                          ...selectedEquipment,
                          properties: { ...selectedEquipment.properties, coverageColor: e.target.value }
                        })}
                        className="w-full bg-[#0f1115] border border-zinc-700 rounded-sm p-1 h-8 text-xs text-white"
                      />
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Position X</label>
                    <div className="bg-[#0f1115] p-2 rounded-sm text-xs text-zinc-400 border border-zinc-700">
                      {Math.round(selectedEquipment.x)} px
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-zinc-400 uppercase font-bold">Position Y</label>
                    <div className="bg-[#0f1115] p-2 rounded-sm text-xs text-zinc-400 border border-zinc-700">
                      {Math.round(selectedEquipment.y)} px
                    </div>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-zinc-700">
                  <span className="text-[10px] text-zinc-500 uppercase font-bold">Device Specifications</span>
                  <div className="bg-[#0f1115] p-2.5 rounded-sm text-[11px] text-zinc-400 leading-relaxed border border-zinc-700 space-y-1">
                    {(selectedEquipment.type === 'CCTV' || selectedEquipment.type === 'CCTV_DOME' || selectedEquipment.type === 'CCTV_BULLET') && (() => {
                      const fl = selectedEquipment.properties?.focalLength || 2.8;
                      const hasCustomReach = selectedEquipment.properties?.reach !== undefined;
                      const hasCustomFov = selectedEquipment.properties?.fovAngle !== undefined;

                      let fov = hasCustomFov ? `${selectedEquipment.properties.fovAngle}°` : "100°";
                      let rangeVal = hasCustomReach ? `${(selectedEquipment.properties.reach / 20).toFixed(1)} meters` : "30 meters";

                      if (!hasCustomFov) {
                        if (fl === 4) fov = "80°";
                        else if (fl === 6) fov = "60°";
                        else if (fl === 8) fov = "45°";
                        else if (fl === 12) fov = "25°";
                      }

                      if (!hasCustomReach) {
                        if (fl === 4) rangeVal = "40 meters";
                        else if (fl === 6) rangeVal = "55 meters";
                        else if (fl === 8) rangeVal = "70 meters";
                        else if (fl === 12) rangeVal = "95 meters";
                      }

                      return (
                        <>
                          <p>• Lens Focal Length: {fl}mm {hasCustomReach || hasCustomFov ? '(Customized)' : ''}</p>
                          <p>• Angle of View: {fov}</p>
                          <p>• Visual Reach: {rangeVal}</p>
                          <p>• Smart FOV Sector: Active</p>
                        </>
                      );
                    })()}
                    {(selectedEquipment.type === 'WIFI' || selectedEquipment.type === 'WIFI_ROUTER') && (
                      <>
                        <p>• Frequency: Dual-Band 2.4/5GHz</p>
                        <p>• Standard: WiFi 6 (802.11ax)</p>
                        <p>• Coverage radius: ~{selectedEquipment.properties?.coverageRange || 80} px</p>
                      </>
                    )}
                    {(selectedEquipment.type === 'FIRE' || selectedEquipment.type === 'FIRE_DETECTOR') && (
                      <>
                        <p>• Certification: EN54 Compliant</p>
                        <p>• Sensor: Photoelectric Smoke</p>
                        <p>• Radius coverage: ~{selectedEquipment.properties?.coverageRange || 50} px</p>
                      </>
                    )}
                    {selectedEquipment.type === 'ALARM_SIREN' && (
                      <>
                        <p>• Audio Alert: High Decibel Siren</p>
                        <p>• Warning Radius: ~{selectedEquipment.properties?.coverageRange || 60} px</p>
                      </>
                    )}
                    {selectedEquipment.type === 'NETWORK' && (
                      <>
                        <p>• Connection: RJ45 PoE (802.3af)</p>
                        <p>• Link Speed: 10/100/1000 Mbps</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className={cn(
                "rounded-sm p-8 flex flex-col items-center justify-center text-center space-y-4 border border-solid transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-800 border-zinc-700" : "bg-zinc-100 border-zinc-200"
              )}>
                <div className={cn(
                  "w-10 h-10 rounded-sm-full flex items-center justify-center transition-colors duration-300",
                  theme === 'dark' ? "bg-[#0f1115] text-zinc-500" : "bg-white text-zinc-400 border border-zinc-200"
                )}>
                  <MousePointer2 size={20} />
                </div>
                <p className="text-[11px] text-zinc-500 leading-relaxed uppercase font-bold tracking-tight">Select an object to edit parameters</p>
              </div>
            )}
            
            <div className={cn(
              "space-y-4 pt-4 border-t transition-colors",
              theme === 'dark' ? "border-zinc-700/50 shadow-sm" : "border-zinc-200"
            )}>
               <div className="space-y-1">
                 <button 
                  onClick={onAutoDetect}
                  disabled={sheets.length === 0 || isAnalyzing}
                  className={cn(
                    "w-full p-3 rounded-sm text-xs font-bold flex items-center justify-center gap-2 transition-all active:scale-95",
                    theme === 'dark' 
                      ? "bg-blue-600 hover:bg-blue-500 disabled:bg-[#181a1f] text-white shadow-[inset_0_1px_0_0_rgba(255,255,255,0.1)]" 
                      : "bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-200 disabled:text-zinc-400 text-white shadow-sm"
                  )}
                 >
                   <ShieldAlert size={14} className={cn(isAnalyzing && "animate-pulse")} />
                   {isAnalyzing ? "Analyzing Plan..." : "Auto-Detect Features"}
                 </button>
               </div>
            </div>
          </div>
        </aside>
      </div>
      {previewUrl && <PdfPreviewModal url={previewUrl} onClose={() => setPreviewUrl(null)} />}
    </div>
  );
}
