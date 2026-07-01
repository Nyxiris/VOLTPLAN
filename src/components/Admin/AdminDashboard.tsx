import React, { useState, useMemo, useRef } from 'react';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, Brush, ComposedChart } from 'recharts';
import { Download, RefreshCcw, Calendar, ChevronDown, TrendingUp, TrendingDown, LayoutDashboard, FileText, Users, Briefcase } from 'lucide-react';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { cn } from '../../lib/utils';

interface AdminDashboardProps {
  onNavigate?: (view: 'corporate' | 'designer' | 'dashboard') => void;
  onOpenInventory?: (tab: 'LIST' | 'INVOICE' | 'DATABASE' | 'SETTINGS' | 'CLIENTS' | 'DASHBOARD' | 'BILLING_MGMT' | 'HISTORY') => void;
}

const rawRevenueData = [
  { month: 'Jan', revenue: 4000, costs: 2400, profit: 1600 },
  { month: 'Feb', revenue: 3000, costs: 1398, profit: 1602 },
  { month: 'Mar', revenue: 5000, costs: 3800, profit: 1200 },
  { month: 'Apr', revenue: 4500, costs: 3908, profit: 592 },
  { month: 'May', revenue: 6000, costs: 4800, profit: 1200 },
  { month: 'Jun', revenue: 7000, costs: 3800, profit: 3200 },
  { month: 'Jul', revenue: 5500, costs: 3200, profit: 2300 },
  { month: 'Aug', revenue: 8000, costs: 4500, profit: 3500 },
  { month: 'Sep', revenue: 7500, costs: 4200, profit: 3300 },
  { month: 'Oct', revenue: 9000, costs: 5000, profit: 4000 },
  { month: 'Nov', revenue: 10500, costs: 5800, profit: 4700 },
  { month: 'Dec', revenue: 12000, costs: 6500, profit: 5500 },
];

const rawProjectData = [
  { month: 'Jan', active: 5, completed: 1 },
  { month: 'Feb', active: 7, completed: 2 },
  { month: 'Mar', active: 9, completed: 3 },
  { month: 'Apr', active: 10, completed: 5 },
  { month: 'May', active: 11, completed: 7 },
  { month: 'Jun', active: 12, completed: 9 },
  { month: 'Jul', active: 14, completed: 10 },
  { month: 'Aug', active: 15, completed: 12 },
  { month: 'Sep', active: 13, completed: 15 },
  { month: 'Oct', active: 16, completed: 18 },
  { month: 'Nov', active: 18, completed: 20 },
  { month: 'Dec', active: 20, completed: 25 },
];

const equipmentData = [
  { name: 'Vidéosurveillance', value: 400 },
  { name: 'Réseau', value: 300 },
  { name: 'Incendie', value: 300 },
  { name: 'Alarmes', value: 200 },
];

const COLORS = ['#3b82f6', '#22c55e', '#ef4444', '#f59e0b'];
const PROJECT_COLORS = ['#3b82f6', '#10b981'];

const phaseData = [
  { name: 'Planification', start: 0, duration: 5 },
  { name: 'Conception', start: 5, duration: 7 },
  { name: 'Infrastructure', start: 12, duration: 8 },
  { name: 'Intégration', start: 20, duration: 10 },
  { name: 'Tests', start: 30, duration: 10 },
  { name: 'Déploiement', start: 40, duration: 5 },
];

export default function AdminDashboard({ onNavigate, onOpenInventory }: AdminDashboardProps) {
  const [period, setPeriod] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [isExporting, setIsExporting] = useState(false);
  const dashboardRef = useRef<HTMLDivElement>(null);

  const revenueData = useMemo(() => {
    if (period === 'monthly') return rawRevenueData.slice(-6);
    if (period === 'quarterly') {
      const quarters = [];
      for (let i = 0; i < rawRevenueData.length; i += 3) {
        const slice = rawRevenueData.slice(i, i + 3);
        quarters.push({
          month: `Q${Math.floor(i / 3) + 1}`,
          revenue: slice.reduce((acc, curr) => acc + curr.revenue, 0),
          costs: slice.reduce((acc, curr) => acc + curr.costs, 0),
          profit: slice.reduce((acc, curr) => acc + curr.profit, 0),
        });
      }
      return quarters;
    }
    return [{
      month: '2025',
      revenue: rawRevenueData.reduce((acc, curr) => acc + curr.revenue, 0),
      costs: rawRevenueData.reduce((acc, curr) => acc + curr.costs, 0),
      profit: rawRevenueData.reduce((acc, curr) => acc + curr.profit, 0),
    }];
  }, [period]);

  const projectEvolutionData = useMemo(() => {
    if (period === 'monthly') return rawProjectData.slice(-6);
    if (period === 'quarterly') {
      const quarters = [];
      for (let i = 0; i < rawProjectData.length; i += 3) {
        const slice = rawProjectData.slice(i, i + 3);
        quarters.push({
          month: `Q${Math.floor(i / 3) + 1}`,
          active: Math.round(slice.reduce((acc, curr) => acc + curr.active, 0) / 3),
          completed: slice.reduce((acc, curr) => acc + curr.completed, 0),
        });
      }
      return quarters;
    }
    return [{
      month: '2025',
      active: Math.round(rawProjectData.reduce((acc, curr) => acc + curr.active, 0) / 12),
      completed: rawProjectData.reduce((acc, curr) => acc + curr.completed, 0),
    }];
  }, [period]);

  const exportPDF = async () => {
    if (!dashboardRef.current) return;
    setIsExporting(true);
    try {
      const canvas = await html2canvas(dashboardRef.current, {
        backgroundColor: '#09090b',
        scale: 2,
        useCORS: true,
        onclone: (clonedDoc) => {
          // Fix for html2canvas not supporting oklch/oklab colors in Tailwind v4
          const style = clonedDoc.createElement('style');
          style.innerHTML = `
            * {
              --tw-bg-opacity: 1 !important;
              --tw-text-opacity: 1 !important;
              --tw-border-opacity: 1 !important;
            }
            /* Force hex/rgb for common zinc colors to avoid oklch issues */
            .bg-zinc-950 { background-color: #09090b !important; }
            .bg-zinc-900 { background-color: #18181b !important; }
            .bg-zinc-800 { background-color: #27272a !important; }
            .text-zinc-500 { color: #71717a !important; }
            .text-zinc-400 { color: #a1a1aa !important; }
            .text-zinc-300 { color: #d4d4d8 !important; }
            .border-zinc-800 { border-color: #27272a !important; }
            .bg-blue-600 { background-color: #2563eb !important; }
          `;
          clonedDoc.head.appendChild(style);
        }
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      
      // Add a header
      pdf.setFillColor(15, 23, 42); // zinc-900
      pdf.rect(0, 0, pdfWidth, 20, 'F');
      pdf.setTextColor(255, 255, 255);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text('VOLTPLAN PRO - ANALYTICS REPORT', 10, 13);
      pdf.setFontSize(10);
      pdf.setFont('helvetica', 'normal');
      pdf.text(`Généré le : ${new Date().toLocaleString()}`, pdfWidth - 60, 13);

      pdf.addImage(imgData, 'PNG', 0, 20, pdfWidth, pdfHeight);
      pdf.save(`VoltPlan-Dashboard-${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF export failed:', error);
    } finally {
      setIsExporting(false);
    }
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-lg shadow-xl">
          <p className="text-zinc-400 text-xs font-bold uppercase mb-2">{label}</p>
          {payload.map((entry: any, index: number) => (
            <div key={index} className="flex items-center justify-between gap-4 py-1 border-t border-zinc-800 first:border-0">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                <span className="text-zinc-300 text-sm">{entry.name}</span>
              </div>
              <span className="text-white text-sm font-bold">
                {entry.value.toLocaleString()} {entry.name.includes('Revenu') || entry.name.includes('Profit') || entry.name.includes('Coût') ? '€' : ''}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="p-6 bg-zinc-950 text-white min-h-screen" ref={dashboardRef}>
      <div className="flex justify-between items-center mb-8">
        <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-600/20">
                <LayoutDashboard className="text-blue-500" size={20} />
            </div>
            <div>
                <h2 className="text-2xl font-black tracking-tight">Analytics Dashboard</h2>
                <p className="text-zinc-500 text-xs font-medium uppercase tracking-widest">Global Performance Monitoring</p>
            </div>
        </div>
        <div className="flex gap-3">
            <div className="relative group">
                <button className="bg-zinc-900 border border-zinc-800 text-zinc-300 px-4 py-2 rounded-xl text-sm flex items-center gap-2 hover:bg-zinc-800 transition-colors">
                    <Calendar size={16} className="text-zinc-500" />
                    {period === 'monthly' ? 'Mensuel' : period === 'quarterly' ? 'Trimestriel' : 'Annuel'}
                    <ChevronDown size={14} className="text-zinc-600" />
                </button>
                <div className="absolute right-0 top-full mt-2 w-40 bg-zinc-900 border border-zinc-800 rounded-xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 overflow-hidden">
                    {(['monthly', 'quarterly', 'yearly'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriod(p)}
                            className={cn(
                                "w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-800 transition-colors",
                                period === p ? "text-blue-400 bg-blue-400/5 font-bold" : "text-zinc-400"
                            )}
                        >
                            {p === 'monthly' ? 'Mensuel' : p === 'quarterly' ? 'Trimestriel' : 'Annuel'}
                        </button>
                    ))}
                </div>
            </div>
            <button 
                onClick={() => window.location.reload()}
                className="bg-zinc-900 border border-zinc-800 text-zinc-300 p-2.5 rounded-xl hover:bg-zinc-800 transition-colors"
                title="Actualiser les données"
            >
                <RefreshCcw size={18} />
            </button>
            <button 
                onClick={exportPDF}
                disabled={isExporting}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl text-sm font-bold flex items-center gap-2 transition-all shadow-lg shadow-blue-600/20 active:scale-95 disabled:opacity-50"
            >
                {isExporting ? <RefreshCcw size={18} className="animate-spin" /> : <Download size={18} />}
                Export PDF
            </button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard 
            label="Projets Actifs" 
            value="12" 
            change="+2" 
            icon={<Briefcase size={16} />}
            onClick={() => onNavigate?.('designer')}
        />
        <StatCard 
            label="Devis en attente" 
            value="5" 
            change="-1" 
            icon={<FileText size={16} />}
            onClick={() => onOpenInventory?.('BILLING_MGMT')}
        />
        <StatCard 
            label="Clients Totaux" 
            value="48" 
            change="+8" 
            icon={<Users size={16} />}
            onClick={() => onOpenInventory?.('CLIENTS')}
        />
        <StatCard 
            label="Revenu Mensuel" 
            value="12.500 €" 
            change="+15%" 
            isPositive 
            icon={<TrendingUp size={16} />}
            onClick={() => onOpenInventory?.('DASHBOARD')}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <TrendingUp size={20} className="text-blue-500" />
                Tendance Financière
            </h3>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
              <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(v) => `${v/1000}k`} />
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
              <Bar dataKey="revenue" fill="#3b82f6" name="Revenu" radius={[4, 4, 0, 0]} barSize={24} />
              <Bar dataKey="costs" fill="#ef4444" name="Coûts" radius={[4, 4, 0, 0]} barSize={24} />
              <Line type="monotone" dataKey="profit" stroke="#22c55e" strokeWidth={4} name="Profit" dot={{ r: 4, fill: '#22c55e', strokeWidth: 2, stroke: '#09090b' }} activeDot={{ r: 6 }} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        
        <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 shadow-sm">
          <h3 className="text-lg font-bold text-white mb-6">Distribution par Secteur</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={equipmentData}
                innerRadius={70}
                outerRadius={100}
                paddingAngle={8}
                dataKey="value"
                stroke="none"
              >
                {equipmentData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} className="cursor-pointer hover:opacity-80 transition-opacity" />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend verticalAlign="bottom" align="center" iconType="circle" />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 shadow-sm mb-8">
        <h3 className="text-lg font-bold text-white mb-6">Évolution Opérationnelle</h3>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={projectEvolutionData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
            <XAxis dataKey="month" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Legend verticalAlign="top" align="right" height={36} iconType="circle" />
            <Line type="monotone" dataKey="active" stroke={PROJECT_COLORS[0]} strokeWidth={3} name="Projets Actifs" dot={{ r: 5, fill: PROJECT_COLORS[0], strokeWidth: 2, stroke: '#09090b' }} activeDot={{ r: 8 }} />
            <Line type="monotone" dataKey="completed" stroke={PROJECT_COLORS[1]} strokeWidth={3} name="Projets Terminés" dot={{ r: 5, fill: PROJECT_COLORS[1], strokeWidth: 2, stroke: '#09090b' }} activeDot={{ r: 8 }} />
            <Brush dataKey="month" height={30} stroke="#3f3f46" fill="#09090b" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-zinc-900/50 p-6 rounded-3xl border border-zinc-800 shadow-sm">
        <h3 className="text-lg font-bold text-white mb-6">Chronologie des Phases</h3>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart
            layout="vertical"
            data={phaseData}
            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
            barSize={12}
          >
            <XAxis type="number" stroke="#71717a" fontSize={12} hide />
            <YAxis dataKey="name" type="category" stroke="#71717a" fontSize={11} width={100} tickLine={false} axisLine={false} />
            <Tooltip cursor={{fill: 'rgba(255,255,255,0.05)'}} content={<CustomTooltip />} />
            <Bar dataKey="start" stackId="a" fill="transparent" />
            <Bar dataKey="duration" stackId="a" fill="#8b5cf6" name="Durée (jours)" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, change, icon, onClick, isPositive }: { label: string, value: string, change: string, icon?: React.ReactNode, onClick?: () => void, isPositive?: boolean }) => (
  <div 
    onClick={onClick}
    className="bg-zinc-900 border border-zinc-800 p-5 rounded-3xl hover:border-blue-500/50 transition-all cursor-pointer group hover:bg-zinc-800/50 relative overflow-hidden"
  >
    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 blur-[40px] rounded-full -mr-12 -mt-12 group-hover:bg-blue-500/10 transition-colors" />
    
    <div className="flex justify-between items-start mb-4">
        <div className="w-10 h-10 bg-zinc-950 rounded-xl flex items-center justify-center border border-zinc-800 text-zinc-400 group-hover:text-blue-400 transition-colors">
            {icon}
        </div>
        <div className={cn(
            "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-full",
            change.startsWith('+') ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"
        )}>
            {change.startsWith('+') ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
            {change}
        </div>
    </div>
    
    <div>
        <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">{label}</p>
        <p className="text-2xl font-black text-white tracking-tight">{value}</p>
    </div>
  </div>
);
