import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { 
  ShieldCheck, 
  Package, 
  Zap, 
  Download, 
  CheckCircle2, 
  MapPin, 
  Calendar,
  Layers,
  Box,
  ArrowRight,
  ChevronRight,
  Clock,
  Lock
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import { ProjectPhase } from '../../types';

const MemeCharacter = ({ status }: { status: 'idle' | 'success' | 'error' }) => {
  const variants = {
    idle: { scale: 1, rotate: 0, y: 0 },
    error: { 
      scale: [1, 1.3, 0.9, 1.1, 1],
      rotate: [-15, 15, -15, 15, 0],
      transition: { duration: 0.5 }
    },
    success: { 
      scale: [1, 1.6, 1],
      y: [0, -30, 0],
      rotate: [0, 360],
      transition: { duration: 0.6, type: "spring" as const }
    }
  };

  return (
    <div className="relative mb-8">
      <motion.div 
        animate={status}
        variants={variants}
        className="relative w-32 h-32 mx-auto flex items-center justify-center bg-zinc-800/50 rounded-full border-2 border-zinc-700/50"
      >
        <AnimatePresence mode="wait">
          {status === 'error' && (
            <motion.div
              key="error"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="text-7xl"
            >
              🙅‍♂️
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0 }}
              className="text-7xl"
            >
              🥳
            </motion.div>
          )}
          {status === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="text-7xl"
            >
              🧐
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Bubbles */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0 }}
              animate={{ opacity: 1, y: -50, x: 50, scale: 1 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute bg-red-600 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap shadow-xl border border-red-400 uppercase"
            >
              Erreur ! ❌
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0 }}
              animate={{ opacity: 1, y: -50, x: 50, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap shadow-xl border border-green-400 uppercase"
            >
              Gagné ! ✅
            </motion.div>
          )}
        </AnimatePresence>
        
        {/* Visual Feedback Rings */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              className="absolute inset-0 border-4 border-red-500 rounded-full"
            />
          )}
          {status === 'success' && (
            <motion.div 
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2.5, opacity: 0 }}
              className="absolute inset-0 border-4 border-green-500 rounded-full"
            />
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default function ProjectPublicView() {
  const { id } = useParams();
  const [project, setProject] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [enteredCode, setEnteredCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    async function fetchProject() {
      if (!id) return;
      try {
        const docRef = doc(db, 'invoices', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setProject(data);
          // If no access code, authorize immediately
          if (!data.accessCode) {
            setIsAuthorized(true);
          }
        }
      } catch (error) {
        console.error("Error fetching project details:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchProject();
  }, [id]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (project && enteredCode.toUpperCase() === project.accessCode?.toUpperCase()) {
      setAuthStatus('success');
      setTimeout(() => {
        setIsAuthorized(true);
        setAuthError(false);
      }, 800);
    } else {
      setAuthStatus('error');
      setAuthError(true);
      setTimeout(() => setAuthStatus('idle'), 1000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
        <p className="text-zinc-500 font-medium animate-pulse">Chargement du projet...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-6 text-center">
        <div className="w-20 h-20 bg-red-500/10 rounded-3xl flex items-center justify-center mb-6 border border-red-500/20">
          <ShieldCheck size={40} className="text-red-500" />
        </div>
        <h1 className="text-2xl font-black text-white mb-2">Projet non trouvé</h1>
        <p className="text-zinc-500 max-w-xs mx-auto">Le lien que vous avez suivi est peut-être expiré ou invalide.</p>
      </div>
    );
  }

  if (!isAuthorized && project.accessCode) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-indigo-600/10 transition-all" />
          
          <div className="relative z-10 text-center space-y-6">
            <MemeCharacter status={authStatus} />

            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                {authStatus === 'error' ? "CODE ERRONÉ" : authStatus === 'success' ? "VÉRIFIÉ !" : "ACCÈS SÉCURISÉ"}
              </h1>
              <p className="text-zinc-500 text-sm font-medium px-4">
                {authStatus === 'error' ? "Hmm, ce n'est pas le bon code. On réessaye ?" : "Veuillez entrer le code client pour accéder aux détails."}
              </p>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div className="relative">
                <input
                  type="text"
                  value={enteredCode}
                  onChange={(e) => {
                    setEnteredCode(e.target.value.toUpperCase());
                    if (authError) setAuthError(false);
                  }}
                  placeholder="CODE CLIENT"
                  className={cn(
                    "w-full bg-zinc-950 border text-center text-2xl font-black tracking-[0.2em] py-5 rounded-3xl transition-all outline-none",
                    authError ? "border-red-500 text-red-500 animate-shake" : "border-zinc-800 text-white focus:border-indigo-500"
                  )}
                  autoFocus
                />
                {authError && (
                  <motion.p 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-red-500 text-[10px] font-black uppercase mt-3 tracking-widest"
                  >
                    Code d'accès invalide
                  </motion.p>
                )}
              </div>

              <button
                type="submit"
                disabled={authStatus === 'success'}
                className={cn(
                  "w-full py-5 rounded-3xl font-black text-sm flex items-center justify-center gap-3 shadow-xl transition-all active:scale-95",
                  authStatus === 'success' ? "bg-green-600 text-white" : "bg-indigo-600 hover:bg-indigo-700 text-white shadow-indigo-600/20"
                )}
              >
                {authStatus === 'success' ? "CHARGEMENT..." : "DÉBLOQUER L'ESPACE"}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="pt-4">
              <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em]">
                VoltPlan Pro Technical Security
              </p>
            </div>
          </div>
        </div>

        <style dangerouslySetInnerHTML={{__html: `
          @keyframes shake {
            0%, 100% { transform: translateX(0); }
            25% { transform: translateX(-10px); }
            75% { transform: translateX(10px); }
          }
          .animate-shake {
            animation: shake 0.2s ease-in-out 0s 2;
          }
        `}} />
      </div>
    );
  }

  const equipmentCount = project.items?.length || 0;
  const cableLength = (project.cables || []).reduce((acc: number, c: any) => acc + (c.length || 0), 0);
  const totalTTC = project.totalTTC || 0;
  const phases: ProjectPhase[] = project.phases || [];

  const timelineData = phases.map(p => ({
    name: p.name,
    start: p.startDay,
    duration: p.duration,
    description: p.description
  }));

  return (
    <div className="min-h-screen bg-zinc-950 text-white selection:bg-blue-500/30">
      {/* Dynamic Header */}
      <div className="relative h-80 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-blue-600/20 to-zinc-950 z-10" />
        <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1581094794329-c8112a89af12?q=80&w=2070&auto=format&fit=crop')] bg-cover bg-center opacity-30 grayscale" />
        
        <div className="max-w-5xl mx-auto px-6 h-full flex flex-col justify-end pb-12 relative z-20">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="bg-blue-500 text-white text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full shadow-lg shadow-blue-500/20">
              Projet Certifié VoltPlan
            </span>
            <span className="bg-zinc-900/80 backdrop-blur-md text-zinc-400 text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full border border-zinc-800">
              ID: {project.invoiceRef}
            </span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight text-white mb-2 uppercase">
            {project.data?.invoiceDescription || "Détails de l'Installation"}
          </h1>
          <div className="flex flex-wrap items-center gap-6 text-zinc-400 font-medium">
            <div className="flex items-center gap-2">
              <MapPin size={18} className="text-blue-500" />
              <span>{project.data?.projectLocation || "Lomé, Togo"}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar size={18} className="text-blue-500" />
              <span>{new Date(project.date || Date.now()).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 -mt-10 relative z-30 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-xl group hover:border-blue-500/30 transition-all">
                <div className="w-10 h-10 bg-blue-500/10 rounded-xl flex items-center justify-center mb-4 border border-blue-500/20 text-blue-500">
                  <Box size={20} />
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Équipements</p>
                <p className="text-2xl font-black text-white">{equipmentCount}</p>
                <p className="text-[10px] text-zinc-600 mt-2">Unités installées</p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-xl group hover:border-indigo-500/30 transition-all">
                <div className="w-10 h-10 bg-indigo-500/10 rounded-xl flex items-center justify-center mb-4 border border-indigo-500/20 text-indigo-400">
                  <Layers size={20} />
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Câblage</p>
                <p className="text-2xl font-black text-white">{cableLength}m</p>
                <p className="text-[10px] text-zinc-600 mt-2">Longueur totale</p>
              </div>

              <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-xl group hover:border-emerald-500/30 transition-all">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-xl flex items-center justify-center mb-4 border border-emerald-500/20 text-emerald-400">
                  <Zap size={20} />
                </div>
                <p className="text-zinc-500 text-xs font-bold uppercase tracking-widest mb-1">Status</p>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-500" />
                  <p className="text-lg font-black text-white italic">Confirmé</p>
                </div>
                <p className="text-[10px] text-zinc-600 mt-2">Installation conforme</p>
              </div>
            </div>

            {/* Project Timeline */}
            {phases.length > 0 && (
              <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-xl p-6">
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-lg font-black text-white flex items-center gap-2">
                    <Clock size={20} className="text-violet-500" />
                    Planning d'Exécution
                  </h3>
                  <span className="bg-violet-500/10 text-violet-400 text-[10px] font-bold px-3 py-1 rounded-full border border-violet-500/20 uppercase">
                    Chronogramme
                  </span>
                </div>
                
                <div className="h-[300px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      layout="vertical"
                      data={timelineData}
                      margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                      barSize={12}
                    >
                      <XAxis type="number" hide />
                      <YAxis 
                        dataKey="name" 
                        type="category" 
                        stroke="#71717a" 
                        fontSize={11} 
                        width={100} 
                        tickLine={false} 
                        axisLine={false} 
                      />
                      <Tooltip 
                        cursor={{fill: 'rgba(255,255,255,0.05)'}} 
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl shadow-2xl">
                                <p className="text-white font-bold text-xs mb-1 uppercase">{data.name}</p>
                                <p className="text-zinc-400 text-[10px] mb-2">{data.description || 'Phase d\'exécution du projet.'}</p>
                                <div className="flex items-center justify-between gap-4 border-t border-zinc-800 pt-2">
                                  <span className="text-zinc-500 text-[10px] uppercase font-bold">Durée estimée</span>
                                  <span className="text-violet-400 font-black text-xs">{data.duration} Jours</span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar dataKey="start" stackId="a" fill="transparent" />
                      <Bar dataKey="duration" stackId="a" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {phases.map((phase, idx) => (
                    <div key={idx} className="flex gap-4 p-3 rounded-2xl bg-zinc-950/50 border border-zinc-800/50">
                      <div className="w-8 h-8 rounded-full bg-zinc-900 flex items-center justify-center text-[10px] font-black text-zinc-500 border border-zinc-800 shrink-0">
                        0{idx + 1}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-white uppercase tracking-tight">{phase.name}</p>
                        <p className="text-[10px] text-zinc-500 mt-0.5 leading-relaxed">{phase.description || 'Phase critique du projet.'}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Equipment Breakdown */}
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-3xl overflow-hidden backdrop-blur-xl">
              <div className="p-6 border-b border-zinc-800 flex justify-between items-center">
                <h3 className="text-lg font-black text-white flex items-center gap-2">
                  <Package size={20} className="text-blue-500" />
                  Liste du Matériel
                </h3>
                <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-3 py-1 rounded-full">
                  {equipmentCount} Items
                </span>
              </div>
              <div className="divide-y divide-zinc-800/50">
                {project.items?.map((item: any, idx: number) => (
                  <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-500 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ChevronRight size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{item.name}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">{item.type || 'Équipement'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">x{item.quantity}</p>
                    </div>
                  </div>
                ))}
                {project.cables?.map((cable: any, idx: number) => (
                  <div key={`cable-${idx}`} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-zinc-800 rounded-xl flex items-center justify-center text-zinc-400 group-hover:bg-indigo-600 group-hover:text-white transition-all">
                        <Layers size={18} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white uppercase tracking-tight">{cable.name}</p>
                        <p className="text-[10px] text-zinc-500 font-medium">Câblage</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black text-white">{cable.length}m</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Call to Action */}
            <div className="bg-blue-600 rounded-3xl p-8 shadow-2xl shadow-blue-600/20 relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16 group-hover:bg-white/20 transition-all" />
              
              <h3 className="text-xl font-black text-white mb-4 relative z-10">Facture Officielle</h3>
              <p className="text-blue-100/80 text-sm mb-6 font-medium relative z-10">
                Téléchargez le document complet incluant les détails financiers et les garanties.
              </p>
              
              <button 
                onClick={() => window.open(`/invoice/${id}`, '_blank')}
                className="w-full bg-white text-blue-600 py-4 rounded-2xl font-black text-sm flex items-center justify-center gap-3 shadow-xl hover:scale-[1.02] active:scale-95 transition-all relative z-10"
              >
                <Download size={20} />
                TÉLÉCHARGER PDF
              </button>
            </div>

            {/* Project Info */}
            <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-3xl backdrop-blur-xl">
              <h4 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-6 border-b border-zinc-800 pb-2">Résumé du Client</h4>
              
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Client</p>
                  <p className="text-sm font-black text-white uppercase">{project.clientName || "GVA - CANALBOX"}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Adresse</p>
                  <p className="text-sm text-zinc-400 whitespace-pre-line">{project.data?.clientAddress || project.clientAddress}</p>
                </div>
                <div>
                  <p className="text-[10px] text-zinc-500 font-bold uppercase mb-1">Montant Total</p>
                  <p className="text-2xl font-black text-blue-400">{totalTTC.toLocaleString()} <span className="text-xs">{project.currency || 'F CFA'}</span></p>
                </div>
              </div>
            </div>

            {/* Guarantee */}
            <div className="bg-zinc-900/30 border border-zinc-800 border-dashed p-6 rounded-3xl text-center">
              <div className="w-12 h-12 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10 text-zinc-400">
                <ShieldCheck size={24} />
              </div>
              <p className="text-sm font-bold text-white mb-1 uppercase tracking-tight">Installation Garantie</p>
              <p className="text-[10px] text-zinc-500 leading-relaxed font-medium">
                Cette installation est couverte par la garantie standard de 12 mois de VoltPlan.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Branding */}
      <div className="py-12 border-t border-zinc-900 text-center">
        <p className="text-zinc-600 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Powered by VoltPlan Pro</p>
        <div className="flex items-center justify-center gap-6">
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center grayscale opacity-50">
            <Zap size={16} />
          </div>
          <div className="w-8 h-8 bg-zinc-900 rounded-lg flex items-center justify-center grayscale opacity-50">
            <Package size={16} />
          </div>
        </div>
      </div>
    </div>
  );
}
