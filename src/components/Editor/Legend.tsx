import React from 'react';
import { 
  Camera, 
  Network, 
  Wifi, 
  Flame, 
  Shield, 
  Siren, 
  Server, 
  Key, 
  PhoneCall, 
  Battery, 
  Layers,
  ChevronRight,
  Info,
  Video
} from 'lucide-react';
import { Equipment } from '../../types';
import { cn } from '../../lib/utils';

interface LegendProps {
  equipment: Equipment[];
  theme?: 'light' | 'dark';
}

const EQUIPMENT_META: Record<string, { label: string; color: string; icon: any }> = {
  CCTV: { label: 'Caméra CCTV Générique', color: '#3b82f6', icon: Camera },
  CCTV_DOME: { label: 'Caméra Dôme', color: '#3b82f6', icon: Camera },
  CCTV_BULLET: { label: 'Caméra Bullet', color: '#0ea5e9', icon: Video },
  NETWORK: { label: 'Équipement Réseau', color: '#f59e0b', icon: Network },
  WIFI: { label: 'Point d\'Accès WiFi', color: '#10b981', icon: Wifi },
  WIFI_ROUTER: { label: 'Routeur WiFi Pro', color: '#10b981', icon: Wifi },
  FIRE: { label: 'Détecteur Incendie', color: '#ef4444', icon: Flame },
  FIRE_DETECTOR: { label: 'Détecteur de Fumée', color: '#ef4444', icon: Flame },
  SECURITY: { label: 'Dispositif Sécurité', color: '#8b5cf6', icon: Shield },
  ALARM_SIREN: { label: 'Sirène d\'Alarme', color: '#f43f5e', icon: Siren },
  CONTROL_PANEL: { label: 'Centrale de Contrôle', color: '#a855f7', icon: Shield },
  SWITCH_RACK: { label: 'Switch Réseau Rackable', color: '#f59e0b', icon: Server },
  SERVER_RACK: { label: 'Baie Serveur / VDI', color: '#6366f1', icon: Server },
  ACCESS_CONTROL: { label: 'Contrôle d\'Accès', color: '#8b5cf6', icon: Key },
  INTERCOM: { label: 'Interphone IP', color: '#0ea5e9', icon: PhoneCall },
  UPS_BATTERY: { label: 'Onduleur UPS', color: '#10b981', icon: Battery },
};

export const Legend: React.FC<LegendProps> = ({ equipment, theme = 'dark' }) => {
  const [isExpanded, setIsExpanded] = React.useState(true);
  
  // Extract unique types present in the current equipment list
  const activeTypes = Array.from(new Set(equipment.map(item => item.type)))
    .filter(type => EQUIPMENT_META[type])
    .sort((a, b) => EQUIPMENT_META[a].label.localeCompare(EQUIPMENT_META[b].label));
  
  if (activeTypes.length === 0) return null;

  return (
    <div className={cn(
      "absolute top-4 right-4 z-30 transition-all duration-300 ease-in-out select-none",
      isExpanded ? "w-64" : "w-10"
    )}>
      <div className={cn(
        "rounded-2xl border shadow-2xl backdrop-blur-xl overflow-hidden",
        theme === 'dark' 
          ? "bg-zinc-950/85 border-zinc-800/50 shadow-black/40" 
          : "bg-white/85 border-zinc-200/50 shadow-zinc-200/40"
      )}>
        {/* Header */}
        <div 
          className={cn(
            "flex items-center justify-between p-2.5 cursor-pointer hover:bg-white/5 transition-colors",
            !isExpanded && "justify-center"
          )}
          onClick={() => setIsExpanded(!isExpanded)}
        >
          <div className={cn("flex items-center gap-2", !isExpanded && "hidden")}>
            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <Layers size={14} className="text-emerald-500" />
            </div>
            <span className={cn(
              "text-[10px] font-bold tracking-wider",
              theme === 'dark' ? "text-zinc-100" : "text-zinc-900"
            )}>LÉGENDE DU PLAN</span>
          </div>
          
          <button className={cn(
            "p-1 rounded-md transition-all",
            theme === 'dark' ? "text-zinc-500 hover:text-zinc-100" : "text-zinc-400 hover:text-zinc-900"
          )}>
            <ChevronRight 
              size={14} 
              className={cn("transition-transform duration-300", isExpanded && "rotate-90")} 
            />
          </button>
        </div>

        {/* Content */}
        {isExpanded && (
          <div className="p-2 pt-0 max-h-[60vh] overflow-y-auto scrollbar-hide">
            <div className="space-y-1">
              {activeTypes.map(type => {
                const meta = EQUIPMENT_META[type];
                const Icon = meta.icon;
                const count = equipment.filter(item => item.type === type).length;

                return (
                  <div 
                    key={type}
                    className={cn(
                      "flex items-center justify-between p-2 rounded-xl border group transition-all",
                      theme === 'dark'
                        ? "bg-zinc-900/40 border-zinc-800/40 hover:bg-zinc-800/60"
                        : "bg-zinc-50 border-zinc-100 hover:bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-7 h-7 rounded-lg flex items-center justify-center border transition-transform group-hover:scale-110"
                        style={{ 
                          backgroundColor: `${meta.color}15`, 
                          borderColor: `${meta.color}30` 
                        }}
                      >
                        <Icon size={14} style={{ color: meta.color }} />
                      </div>
                      <div className="flex flex-col">
                        <span className={cn(
                          "text-[10px] font-bold",
                          theme === 'dark' ? "text-zinc-200" : "text-zinc-800"
                        )}>
                          {meta.label}
                        </span>
                        <span className="text-[9px] text-zinc-500 font-medium">
                          {count} unité{count > 1 ? 's' : ''}
                        </span>
                      </div>
                    </div>
                    <div 
                      className="w-1 h-5 rounded-full opacity-50 group-hover:opacity-100 transition-opacity"
                      style={{ backgroundColor: meta.color }}
                    />
                  </div>
                );
              })}
            </div>
            
            <div className={cn(
              "mt-3 pt-3 border-t flex items-center gap-2 px-2 pb-1",
              theme === 'dark' ? "border-zinc-800/50" : "border-zinc-100"
            )}>
              <Info size={10} className="text-zinc-500 shrink-0" />
              <p className="text-[8px] text-zinc-500 italic leading-tight">
                La légende s'adapte automatiquement à l'inventaire actuel du projet.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
