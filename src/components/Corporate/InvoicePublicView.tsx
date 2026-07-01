import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { doc, getDoc, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Building2, MapPin, Receipt, Wallet, Calendar, Hash, FileText, User, Printer, Clock, Lock, ArrowRight, XCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

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
              Pas ça ! ❌
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div
              initial={{ opacity: 0, y: 10, scale: 0 }}
              animate={{ opacity: 1, y: -50, x: 50, scale: 1.2 }}
              exit={{ opacity: 0, scale: 0 }}
              className="absolute bg-green-600 text-white text-[10px] font-black px-2 py-1 rounded-lg whitespace-nowrap shadow-xl border border-green-400 uppercase"
            >
              C'est lui ! ✅
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

export default function InvoicePublicView() {
  const { invoiceId } = useParams<{ invoiceId: string }>();
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enteredCode, setEnteredCode] = useState('');
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [authStatus, setAuthStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [authError, setAuthError] = useState(false);

  useEffect(() => {
    if (!invoiceId) return;
    
    setLoading(true);
    const docRef = doc(db, 'invoices', invoiceId);
    
    const unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setInvoice({ id: docSnap.id, ...data });
        // If there's no access code, authorize immediately (legacy or simple)
        if (!data.accessCode) {
          setIsAuthorized(true);
        }
        setError(null);
      } else {
        setError('Facture non trouvée ou indisponible.');
      }
      setLoading(false);
    }, (err) => {
      console.error("Fetch error:", err);
      setError('Une erreur est survenue lors du chargement de la facture.');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [invoiceId]);

  const handleVerify = (e: React.FormEvent) => {
    e.preventDefault();
    if (invoice && enteredCode.toUpperCase() === invoice.accessCode?.toUpperCase()) {
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
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
          <p className="text-zinc-500 font-medium">Chargement des données...</p>
        </div>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-zinc-900 p-8 rounded-2xl border border-zinc-800 text-center">
          <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
            <Receipt size={32} />
          </div>
          <h1 className="text-xl font-bold text-white mb-2">Erreur</h1>
          <p className="text-zinc-500 mb-6">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white font-semibold py-3 rounded-xl transition-colors"
          >
            Retour à l'accueil
          </button>
        </div>
      </div>
    );
  }

  if (!isAuthorized && invoice.accessCode) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-6 font-sans">
        <div className="max-w-md w-full bg-zinc-900 border border-zinc-800 p-10 rounded-[40px] shadow-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/5 blur-3xl -mr-16 -mt-16 group-hover:bg-blue-600/10 transition-all" />
          
          <div className="relative z-10 text-center space-y-6">
            {/* Meme Animation Character */}
            <MemeCharacter status={authStatus} />
            
            <div className="space-y-2">
              <h1 className="text-3xl font-black text-white uppercase tracking-tight leading-none">
                {authStatus === 'error' ? "OUPS ! RATÉ." : authStatus === 'success' ? "C'EST GAGNÉ !" : "ACCÈS BLOQUÉ"}
              </h1>
              <p className="text-zinc-500 text-sm font-medium px-4">
                {authStatus === 'error' ? "Ce code n'est pas le bon. On réessaye ?" : "Entrez votre code client pour débloquer votre facture."}
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
                  placeholder="VOTRE CODE"
                  className={cn(
                    "w-full bg-zinc-950 border text-center text-2xl font-black tracking-[0.2em] py-5 rounded-3xl transition-all outline-none",
                    authError ? "border-red-500 text-red-500 animate-shake" : "border-zinc-800 text-white focus:border-blue-500"
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
                  authStatus === 'success' ? "bg-green-600 text-white" : "bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/20"
                )}
              >
                {authStatus === 'success' ? "DÉVERROUILLAGE..." : "DÉBLOQUER MA FACTURE"}
                <ArrowRight size={18} />
              </button>
            </form>

            <div className="pt-4">
              <p className="text-[10px] text-zinc-700 font-black uppercase tracking-[0.3em]">
                VoltPlan Pro • Sécurité Maximale
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('fr-FR', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(val).replace(/,/g, ' ');
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-white pb-20 print:bg-white print:text-black">
      {/* Header / Banner */}
      <div className="h-64 bg-gradient-to-br from-blue-600 to-indigo-900 relative print:hidden">
        <div className="absolute inset-0 bg-black/20" />
        <div className="max-w-4xl mx-auto px-6 h-full flex justify-between items-end pb-8 relative z-10">
          <div className="flex items-center gap-4">
            {invoice.data?.logo ? (
              <div className="w-20 h-20 bg-white rounded-xl p-2 flex items-center justify-center border border-white/20 shadow-xl shrink-0">
                <img src={invoice.data.logo} alt="Logo" className="max-w-full max-h-full object-contain" />
              </div>
            ) : (
              <div className="w-20 h-20 bg-white/10 backdrop-blur-xl rounded-xl flex items-center justify-center border border-white/20 shrink-0">
                <Receipt size={36} className="text-white" />
              </div>
            )}
            <div className="mb-1">
              <h1 className="text-3xl font-black tracking-tight">{invoice.invoiceRef}</h1>
              <p className="text-blue-100/80 text-sm font-medium">Proforma / Devis Officiel</p>
            </div>
          </div>
          <button 
            onClick={() => window.print()}
            className="flex items-center gap-2 bg-white text-blue-600 hover:bg-blue-50 px-4 py-2.5 rounded-xl font-bold transition-colors shadow-lg"
          >
            <Printer size={18} />
            Imprimer / PDF
          </button>
        </div>
      </div>
      
      {/* Print only header */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          body, html { background: white !important; color: black !important; }
          .print-black-text * { color: black !important; }
          .print-no-border { border: none !important; }
          .print-hidden-bg { background: transparent !important; }
        }
      `}} />

      <div className="hidden print:block max-w-4xl mx-auto px-6 pt-12 pb-8 border-b border-zinc-200">
        <div className="flex justify-between items-start">
          <div className="flex flex-col">
            {invoice.data?.logo && (
              <img src={invoice.data.logo} alt="Logo" className="h-16 object-contain mb-4" />
            )}
            <h1 className="text-xl font-black">{invoice.data?.companyName || "Entreprise"}</h1>
            <p className="text-sm text-zinc-500 whitespace-pre-line mt-1">{invoice.data?.companyAddress}</p>
            <p className="text-sm text-zinc-500 mt-1">{invoice.data?.companyPhone} | {invoice.data?.companyEmail}</p>
            <p className="text-xs text-zinc-400 mt-1">RCCM: {invoice.data?.companyRccm} | NIF: {invoice.data?.companyNif}</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-black text-blue-600 mb-1">{invoice.invoiceRef}</h2>
            <p className="font-medium text-zinc-500 uppercase tracking-widest text-xs">Proforma / Devis</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 relative z-20 print:mt-6 print:px-0 print-black-text print-no-border print-hidden-bg">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Project Card */}
            <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800/50">
              <div className="flex items-center gap-2 text-blue-400 mb-6 font-bold uppercase tracking-widest text-[10px]">
                <FileText size={14} />
                Détails du Projet
              </div>
              <h2 className="text-3xl font-black mb-6 leading-tight">
                {invoice.data?.invoiceDescription || "Prestation de Services Électriques"}
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                      <User size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Client</p>
                      <p className="font-bold text-white">{invoice.clientName}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Lieu du Projet</p>
                      <p className="font-bold text-white">{invoice.data?.projectLocation || "Non spécifié"}</p>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                      <Calendar size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Date d'émission</p>
                      <p className="font-bold text-white">{invoice.date}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="p-2 bg-zinc-800 rounded-lg text-zinc-400">
                      <Hash size={18} />
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider">Référence</p>
                      <p className="font-mono font-bold text-blue-400">{invoice.invoiceRef}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Project Planning Summary */}
            {invoice.phases && invoice.phases.length > 0 && (
              <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800/50">
                <div className="flex items-center gap-2 text-violet-400 mb-8 font-bold uppercase tracking-widest text-[10px]">
                  <Clock size={16} />
                  Planning Prévisionnel d'Exécution
                </div>
                
                <div className="relative pl-8 border-l border-zinc-800 space-y-10">
                  {invoice.phases.map((phase: any, idx: number) => (
                    <div key={idx} className="relative">
                      <div className="absolute -left-[41px] top-0 w-4 h-4 rounded-full bg-zinc-950 border-2 border-violet-500 z-10" />
                      <div className="flex justify-between items-start gap-4">
                        <div>
                          <p className="text-base font-black text-white uppercase tracking-tight">{phase.name}</p>
                          <p className="text-xs text-zinc-500 mt-1.5 leading-relaxed">{phase.description || 'Phase critique d\'exécution du projet.'}</p>
                        </div>
                        <div className="text-right shrink-0">
                          <p className="text-[10px] font-black text-violet-400 bg-violet-400/10 px-3 py-1 rounded-full border border-violet-400/20 uppercase tracking-widest">
                            J+{phase.startDay} — {phase.duration} JOURS
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Inventory List */}
            {((invoice.items && invoice.items.length > 0) || (invoice.cables && invoice.cables.length > 0) || (invoice.extraItems && invoice.extraItems.length > 0)) && (
              <div className="bg-zinc-900/50 backdrop-blur-xl p-8 rounded-3xl border border-zinc-800/50">
                <div className="flex items-center gap-2 text-blue-400 mb-6 font-bold uppercase tracking-widest text-[10px]">
                  <FileText size={14} />
                  Détail du Matériel
                </div>
                
                <div className="space-y-4">
                  {invoice.items && invoice.items.map((item: any) => (
                    <div key={item.key} className="flex justify-between items-center py-3 border-b border-zinc-800/50 last:border-0">
                      <div>
                        <p className="font-bold text-white text-sm">{item.name}</p>
                        <p className="text-xs text-zinc-500">Quantité: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCurrency(item.unitPrice * item.quantity)} {invoice.currency}</p>
                        <p className="text-xs text-zinc-500">{formatCurrency(item.unitPrice)} {invoice.currency} / u</p>
                      </div>
                    </div>
                  ))}

                  {invoice.cables && invoice.cables.map((cable: any) => (
                    <div key={cable.key} className="flex justify-between items-center py-3 border-b border-zinc-800/50 last:border-0">
                      <div>
                        <p className="font-bold text-white text-sm">{cable.name}</p>
                        <p className="text-xs text-zinc-500">Longueur: {cable.length} m</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCurrency(cable.unitPrice * cable.length)} {invoice.currency}</p>
                        <p className="text-xs text-zinc-500">{formatCurrency(cable.unitPrice)} {invoice.currency} / m</p>
                      </div>
                    </div>
                  ))}

                  {invoice.extraItems && invoice.extraItems.map((item: any) => (
                    <div key={item.id} className="flex justify-between items-center py-3 border-b border-zinc-800/50 last:border-0">
                      <div>
                        <p className="font-bold text-white text-sm">{item.name}</p>
                        <p className="text-xs text-zinc-500">Quantité: {item.quantity}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-white">{formatCurrency(item.unitPrice * item.quantity)} {invoice.currency}</p>
                        <p className="text-xs text-zinc-500">{formatCurrency(item.unitPrice)} {invoice.currency} / u</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Note Section */}
            {invoice.data?.footerNote && (
              <div className="bg-blue-500/5 p-6 rounded-2xl border border-blue-500/10">
                <p className="text-zinc-400 text-sm italic leading-relaxed">
                  "{invoice.data.footerNote}"
                </p>
              </div>
            )}
          </div>

          {/* Sidebar / Totals & Payment */}
          <div className="space-y-6">
            {/* Amount Card */}
            <div className="bg-zinc-900 p-8 rounded-3xl border border-zinc-800 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Wallet size={80} />
              </div>
              <p className="text-[10px] text-zinc-500 uppercase font-black tracking-[0.2em] mb-2">Total à Régler</p>
              <div className="flex items-baseline gap-2">
                <span className="text-5xl font-black tracking-tighter text-white">
                  {formatCurrency(invoice.totalTTC)}
                </span>
                <span className="text-xl font-bold text-blue-500">{invoice.currency}</span>
              </div>
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-zinc-500">Statut de validation</span>
                  <span className={cn(
                    "px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider",
                    invoice.status === 'VALIDATED' ? "bg-emerald-500/20 text-emerald-400" :
                    invoice.status === 'REFUSED' ? "bg-red-500/20 text-red-400" :
                    "bg-amber-500/20 text-amber-400"
                  )}>
                    {invoice.status === 'VALIDATED' ? 'Validée' : 
                     invoice.status === 'REFUSED' ? 'Rejetée' : 'En attente'}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Details */}
            <div className="bg-zinc-900/40 p-6 rounded-3xl border border-zinc-800/50">
              <div className="flex items-center gap-2 text-zinc-400 mb-6 font-bold uppercase tracking-widest text-[10px]">
                <Wallet size={14} />
                Moyens de Paiement
              </div>
              
              <div className="space-y-6">
                {invoice.data?.paymentMethods?.length > 0 ? (
                  invoice.data.paymentMethods.map((method: any) => (
                    <div key={method.id} className="pb-4 border-b border-zinc-800/50 last:border-0 last:pb-0">
                      <div>
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">{method.type === 'mobile_money' ? 'Mobile Money' : method.type === 'bank' ? 'Banque' : 'Moyen'}</p>
                        <p className="text-sm font-bold text-white">{method.provider}</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Titulaire</p>
                        <p className="text-sm font-bold text-white">{method.accountName}</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Numéro / RIB</p>
                        <p className="text-sm font-mono font-bold text-blue-400 break-all">{method.accountNumber}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  // Fallback for older invoices that still have bankName
                  <div className="space-y-4">
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Banque</p>
                      <p className="text-sm font-bold text-white">{invoice.data?.bankName || "Non configuré"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Titulaire du compte</p>
                      <p className="text-sm font-bold text-white">{invoice.data?.bankAccountName || "Non configuré"}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-zinc-500 uppercase font-bold tracking-wider mb-1">Numéro de Compte / RIB</p>
                      <p className="text-sm font-mono font-bold text-zinc-300 break-all">{invoice.data?.bankAccountNumber || "Non configuré"}</p>
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-zinc-800 print:hidden">
                <p className="text-[10px] text-zinc-600 text-center uppercase font-bold tracking-widest">
                  Généré par VoltPlan Pro
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Print only footer: Signatures and Stamps */}
        <div className="hidden print:block mt-16 pt-8 border-t border-zinc-200 break-inside-avoid">
          <div className="flex justify-between items-start">
            <div className="w-1/3">
              <p className="text-xs font-bold uppercase text-zinc-500 mb-8">Cachet et Signature de l'Entreprise</p>
              <div className="flex gap-4">
                {invoice.data?.stamp && (
                  <img src={invoice.data.stamp} alt="Cachet" className="h-24 object-contain mix-blend-multiply" />
                )}
                {invoice.data?.signature && (
                  <img src={invoice.data.signature} alt="Signature" className="h-20 object-contain mix-blend-multiply" />
                )}
              </div>
            </div>
            <div className="w-1/3 text-right">
              <p className="text-xs font-bold uppercase text-zinc-500 mb-8">Signature du Client (Pour accord)</p>
              <div className="h-24 border-b-2 border-dashed border-zinc-300 w-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

