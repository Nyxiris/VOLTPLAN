import React, { useState, useMemo, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import QRCode from 'qrcode';
import { Equipment, PlanSheet, CustomCableType, ProjectPhase } from '../../types';
import { X, FileText, Download, Filter, Receipt, Settings2, User, Building2, Coins, Calendar, Hash, Trash2, Plus, Search, RotateCcw, Database, MapPin, Info, Camera, Wifi, Flame, ShieldAlert, Server, LayoutGrid, FileSpreadsheet, CheckCircle, XCircle, Tv, Monitor, LayoutDashboard, FilePlus, Cloud, CloudOff, LogIn, LogOut, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import ClientDatabaseTab from './ClientDatabaseTab';
import AdminDashboard from '../Admin/AdminDashboard';
import { db, auth, handleFirestoreError, OperationType, loginWithGoogle, logoutUser } from '../../lib/firebase';
import { collection, query, where, onSnapshot, doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';

export interface DatabaseMaterial {
  id: string;
  name: string;
  price: number;
  category: string;
  description: string;
}

const DEFAULT_MATERIAL_DB: DatabaseMaterial[] = [
  { id: 'CCTV_DOME', name: 'Caméra Dôme IP', price: 98000, category: 'CCTV', description: 'Caméra dôme haute définition vision nocturne' },
  { id: 'CCTV_BULLET', name: 'Caméra Bullet IP', price: 110000, category: 'CCTV', description: 'Caméra tube extérieure longue portée étanche' },
  { id: 'CCTV', name: 'Caméra de Surveillance IP', price: 90000, category: 'CCTV', description: 'Caméra IP polyvalente' },
  { id: 'WIFI_ROUTER', name: 'Routeur Wi-Fi professionnel', price: 78000, category: 'WIFI', description: 'Routeur administrable double bande longue portée' },
  { id: 'WIFI', name: 'Borne Wi-Fi haut débit', price: 58000, category: 'WIFI', description: 'Point d\'accès sans fil professionnel' },
  { id: 'FIRE_DETECTOR', name: 'Détecteur de fumée', price: 25000, category: 'FIRE', description: 'Détecteur de fumée optique autonome' },
  { id: 'FIRE', name: 'Détecteur incendie', price: 32000, category: 'FIRE', description: 'Capteur de chaleur et flamme certifié' },
  { id: 'SWITCH_RACK', name: 'Switch réseau rackable', price: 163000, category: 'NETWORK', description: 'Switch gigabit 24 ports PoE montable en rack' },
  { id: 'SERVER_RACK', name: 'Baie / Rack serveur', price: 295000, category: 'NETWORK', description: 'Armoire technique métallique sécurisée 12U/24U' },
  { id: 'NETWORK', name: 'Équipement Réseau', price: 52000, category: 'NETWORK', description: 'Routeur, passerelle ou répartiteur' },
  { id: 'ALARM_SIREN', name: 'Sirène d\'alarme extérieure', price: 85000, category: 'FIRE', description: 'Sirène sonore puissante avec flash lumineux' },
  { id: 'SECURITY', name: 'Détecteur de présence', price: 45000, category: 'SECURITY', description: 'Détecteur de mouvement infrarouge' },
  { id: 'CONTROL_PANEL', name: 'Centrale de contrôle d\'accès / alarme', price: 228000, category: 'SECURITY', description: 'Centrale de gestion de sécurité multiprotocole' },
  { id: 'ACCESS_CONTROL', name: 'Lecteur de badge de contrôle d\'accès', price: 124000, category: 'SECURITY', description: 'Lecteur RFID antivandale' },
  { id: 'INTERCOM', name: 'Interphone / Portier vidéo', price: 143000, category: 'SECURITY', description: 'Interphone vidéo connecté grand angle IP65' },
  { id: 'UPS_BATTERY', name: 'Onduleur ASI de secours', price: 104000, category: 'NETWORK', description: 'Alimentation ininterrompue pour équipements critiques' },
  { id: 'TV', name: 'Télévision Smart TV 4K', price: 245000, category: 'MULTIMEDIA', description: 'Téléviseur connecté Smart TV LED 4K UHD' },
  { id: 'MONITOR', name: 'Moniteur de surveillance professionnel', price: 115000, category: 'MULTIMEDIA', description: 'Moniteur Full HD LED pour affichage continu' }
];

interface Props {
  sheets: PlanSheet[];
  customCableTypes?: CustomCableType[];
  customEquipmentTypes?: import('../../types').CustomEquipmentType[];
  onClose: () => void;
  currency: string;
  setCurrency: (c: string) => void;
  initialTab?: 'LIST' | 'INVOICE' | 'DATABASE' | 'SETTINGS' | 'CLIENTS' | 'DASHBOARD' | 'BILLING_MGMT' | 'HISTORY';
  theme?: 'dark' | 'light';
}

const getFrenchLabel = (type: string, subType: string) => {
  if (subType && subType !== type) return subType;
  
  switch (type) {
    case 'CCTV_DOME': return 'Caméra Dôme IP';
    case 'CCTV_BULLET': return 'Caméra Bullet IP';
    case 'CCTV': return 'Caméra de Surveillance IP';
    case 'WIFI_ROUTER': return 'Routeur Wi-Fi professionnel';
    case 'WIFI': return 'Borne Wi-Fi haut débit';
    case 'FIRE_DETECTOR': return 'Détecteur de fumée autonome';
    case 'FIRE': return 'Détecteur d\'incendie optique';
    case 'SWITCH_RACK': return 'Switch de réseau rackable';
    case 'SERVER_RACK': return 'Baie et Rack serveur';
    case 'NETWORK': return 'Équipement réseau IP';
    case 'ALARM_SIREN': return 'Sirène d\'alarme extérieure';
    case 'SECURITY': return 'Capteur de sécurité et présence';
    case 'CONTROL_PANEL': return 'Centrale d\'alarme et de contrôle';
    case 'ACCESS_CONTROL': return 'Lecteur de badge de contrôle d\'accès';
    case 'INTERCOM': return 'Interphone et Portier vidéo';
    case 'UPS_BATTERY': return 'Onduleur ASI de secours';
    case 'TV': return 'Télévision Smart TV';
    case 'MONITOR': return 'Moniteur de Surveillance';
    default: return type;
  }
};

const numberToWordsFR = (num: number): string => {
  if (num === 0) return "zéro";

  const mainUnits = ["", "un", "deux", "trois", "quatre", "cinq", "six", "sept", "huit", "neuf"];
  const tens = ["", "dix", "vingt", "trente", "quarante", "cinquante", "soixante", "soixante-dix", "quatre-vingts", "quatre-vingt-dix"];

  const convertGroup = (n: number): string => {
    let out = "";
    const h = Math.floor(n / 100);
    const remainder = n % 100;

    if (h > 0) {
      if (h === 1) {
        out += "cent ";
      } else {
        out += mainUnits[h] + " cent ";
      }
    }

    if (remainder > 0) {
      if (remainder < 10) {
        out += mainUnits[remainder];
      } else if (remainder < 20) {
        const tIndex = remainder - 10;
        const teensList = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
        out += teensList[tIndex];
      } else {
        const ten = Math.floor(remainder / 10);
        const unit = remainder % 10;
        if (ten === 7) {
          if (unit === 1) {
            out += "soixante et onze";
          } else {
            const unitList = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
            out += "soixante-" + unitList[unit];
          }
        } else if (ten === 9) {
          const unitList = ["dix", "onze", "douze", "treize", "quatorze", "quinze", "seize", "dix-sept", "dix-huit", "dix-neuf"];
          out += "quatre-vingt-" + unitList[unit];
        } else {
          if (unit === 1 && ten !== 8) {
            out += tens[ten] + " et un";
          } else if (unit > 0) {
            out += tens[ten] + "-" + mainUnits[unit];
          } else {
            out += tens[ten];
          }
        }
      }
    }
    return out.trim();
  };

  const chunks = [];
  let temp = num;
  while (temp > 0) {
    chunks.push(temp % 1000);
    temp = Math.floor(temp / 1000);
  }

  const scales = ["", "mille", "million", "milliard"];
  let words = "";

  for (let i = chunks.length - 1; i >= 0; i--) {
    const chunk = chunks[i];
    if (chunk === 0) continue;

    let chunkStr = convertGroup(chunk);
    if (scales[i] === "mille" && chunk === 1) {
      chunkStr = "";
    }

    words += (chunkStr ? chunkStr + " " : "") + (scales[i] ? scales[i] : "") + " ";
  }

  return words.trim();
};

const getAmountInWordsFR = (amount: number, currencySymbol: string): string => {
  const integerPart = Math.floor(amount);
  const decimalPart = Math.round((amount - integerPart) * 100);

  let currencyName = "francs CFA";
  const currencyUpper = currencySymbol.toUpperCase();
  if (currencyUpper.includes("EUR") || currencyUpper.includes("€")) {
    currencyName = "euros";
  } else if (currencyUpper.includes("USD") || currencyUpper.includes("$")) {
    currencyName = "dollars";
  } else if (currencyUpper.includes("CFA") || currencyUpper.includes("XOF") || currencyUpper.includes("XAF")) {
    currencyName = "francs CFA";
  } else {
    currencyName = currencySymbol.toLowerCase();
  }

  let words = numberToWordsFR(integerPart) + " " + currencyName;
  if (decimalPart > 0) {
    words += " et " + numberToWordsFR(decimalPart) + " centimes";
  }
  
  return words.charAt(0).toUpperCase() + words.slice(1);
};

export default function EquipmentInventoryModal({ 
  sheets, 
  customCableTypes = [], 
  customEquipmentTypes = [], 
  onClose, 
  currency, 
  setCurrency,
  initialTab = 'INVOICE',
  theme = 'dark'
}: Props) {
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const signatureInputRef = React.useRef<HTMLInputElement>(null);
  const stampInputRef = React.useRef<HTMLInputElement>(null);

  const formatNumber = (num: number) => {
    return Math.round(num).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  };

  // Tabs: 'LIST' or 'INVOICE' or 'DATABASE' or 'HISTORY' or 'CLIENTS' or 'DASHBOARD' or 'BILLING_MGMT'
  const [activeTab, setActiveTab] = useState<'LIST' | 'INVOICE' | 'DATABASE' | 'SETTINGS' | 'HISTORY' | 'CLIENTS' | 'DASHBOARD' | 'BILLING_MGMT'>(initialTab as any || 'INVOICE');
  const [user, setUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(false);
  const [settingsTab, setSettingsTab] = useState<'GENERAL' | 'LOGS'>('GENERAL');
  const [filterType, setFilterType] = useState<string>('ALL');

  // Toast notifications state
  interface Toast {
    id: string;
    message: string;
    type: 'success' | 'error' | 'info';
  }
  const [toasts, setToasts] = useState<Toast[]>([]);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Math.random().toString(36).substring(2, 11);
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  };



  const [quickClients, setQuickClients] = useState<{ id: string; name: string; address: string }[]>([]);
  const [projectPhases, setProjectPhases] = useState<ProjectPhase[]>([]);

  const generateDefaultPhases = () => {
    const categories = new Set(aggregatedEquipment.map(e => e.type));
    const hasCables = aggregatedCables.length > 0;
    
    const phases: ProjectPhase[] = [
      { id: '1', name: 'Planification', startDay: 0, duration: 3, status: 'PENDING', description: 'Étude technique et validation des schémas.' },
      { id: '2', name: 'Approvisionnement', startDay: 3, duration: 5, status: 'PENDING', description: 'Commande et réception du matériel.' },
    ];

    let currentDay = 8;

    if (hasCables) {
      phases.push({ id: '3', name: 'Infrastructure & Câblage', startDay: currentDay, duration: 7, status: 'PENDING', description: 'Pose des chemins de câbles et tirage.' });
      currentDay += 7;
    }

    if (categories.has('CCTV') || categories.has('WIFI') || categories.has('NETWORK')) {
      phases.push({ id: '4', name: 'Installation Équipements', startDay: currentDay, duration: 10, status: 'PENDING', description: 'Pose des caméras, bornes et serveurs.' });
      currentDay += 10;
    }

    phases.push({ id: '5', name: 'Configuration & Tests', startDay: currentDay, duration: 5, status: 'PENDING', description: 'Paramétrage logiciel et tests de recette.' });
    currentDay += 5;

    phases.push({ id: '6', name: 'Mise en service', startDay: currentDay, duration: 2, status: 'PENDING', description: 'Formation utilisateur et livraison finale.' });

    setProjectPhases(phases);
    showToast("Planning généré automatiquement !", "info");
  };

  // Fetch clients for quick selection
  useEffect(() => {
    const saved = localStorage.getItem('local_clients_db');
    const local = saved ? JSON.parse(saved) : [];
    setQuickClients(local);

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        const q = query(collection(db, 'clients'), where('userId', '==', user.uid));
        const unsubFirestore = onSnapshot(q, (snapshot) => {
          const cloudClients: any[] = [];
          snapshot.forEach((docSnap) => {
            const data = docSnap.data();
            cloudClients.push({ 
              id: docSnap.id, 
              name: data.name || '', 
              address: data.address || '' 
            });
          });
          cloudClients.sort((a, b) => a.name.localeCompare(b.name));
          setQuickClients(cloudClients);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'clients');
        });
        
        return () => unsubFirestore();
      } else {
        setQuickClients(local);
      }
    });

    return () => unsubscribe();
  }, [activeTab]);

  const [exportLogs, setExportLogs] = useState<any[]>(() => {
    const saved = localStorage.getItem('invoice_export_logs');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('invoice_export_logs', JSON.stringify(exportLogs));
  }, [exportLogs]);

  // Invoice History persistent state
  const [invoiceHistory, setInvoiceHistory] = useState<any[]>(() => {
    const saved = localStorage.getItem('invoice_history');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      } catch (e) { console.error(e); }
    }
    return [];
  });

  // Sync with Firestore on mount/auth
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
      if (u) {
        // Fetch ALL invoices for the user
        const q = query(collection(db, 'invoices'), where('userId', '==', u.uid));
        const unsubFirestore = onSnapshot(q, (snapshot) => {
          const cloudInvoices: any[] = [];
          snapshot.forEach((docSnap) => {
            cloudInvoices.push({ id: docSnap.id, ...docSnap.data() });
          });
          // Sort by date/timestamp descending
          cloudInvoices.sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
          setInvoiceHistory(cloudInvoices);
        }, (err) => {
          handleFirestoreError(err, OperationType.LIST, 'invoices');
        });
        return () => unsubFirestore();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    localStorage.setItem('invoice_history', JSON.stringify(invoiceHistory));
  }, [invoiceHistory]);

  const uniqueClientsInHistory = useMemo(() => {
    const clients = invoiceHistory.map(inv => inv.clientName || 'Sans nom');
    return Array.from(new Set(clients)).sort();
  }, [invoiceHistory]);

  // History filtering state
  const [historySearch, setHistorySearch] = useState('');
  const [historyClient, setHistoryClient] = useState('ALL');
  const [historyStartDate, setHistoryStartDate] = useState('');
  const [historyEndDate, setHistoryEndDate] = useState('');

  const filteredInvoiceHistory = useMemo(() => {
    return invoiceHistory.filter(invoice => {
      // 1. Search filter: matches reference or client name
      const searchLower = historySearch.toLowerCase();
      const matchesSearch = 
        !historySearch || 
        (invoice.invoiceRef && invoice.invoiceRef.toLowerCase().includes(searchLower)) ||
        (invoice.clientName && invoice.clientName.toLowerCase().includes(searchLower));

      // 2. Client filter
      const matchesClient = 
        historyClient === 'ALL' || 
        invoice.clientName === historyClient;

      // 3. Date filters (invoice.date is YYYY-MM-DD)
      let matchesDate = true;
      if (historyStartDate) {
        matchesDate = matchesDate && invoice.date >= historyStartDate;
      }
      if (historyEndDate) {
        matchesDate = matchesDate && invoice.date <= historyEndDate;
      }

      return matchesSearch && matchesClient && matchesDate;
    });
  }, [invoiceHistory, historySearch, historyClient, historyStartDate, historyEndDate]);

  const saveInvoiceToHistory = async (totals: any) => {
    const invoiceId = invoiceRef.replace(/[^a-zA-Z0-9]/g, '-');
    const newInvoice = {
      id: invoiceId,
      invoiceRef,
      clientName,
      date: invoiceDate,
      totalTTC: totals.totalTTC,
      currency,
      timestamp: Date.now(),
      status: 'PENDING_VALIDATION',
      items: aggregatedEquipment.filter(item => !excludedKeys.includes(item.key)).map(item => ({
        key: item.key,
        type: item.type,
        subType: item.subType,
        quantity: Math.max(0, item.quantity + (customQuantityOffsets[item.key] || 0)),
        unitPrice: customPrices[item.key] ?? item.unitPrice,
        name: customNames[item.key] || `${resolveLabel(item.type, item.subType)} (${item.type})`
      })),
      cables: aggregatedCables.filter(cable => !excludedKeys.includes(`cable_${cable.typeId}`)).map(cable => ({
        key: `cable_${cable.typeId}`,
        typeId: cable.typeId,
        length: Math.max(0, cable.totalLength + (customQuantityOffsets[`cable_${cable.typeId}`] || 0)),
        unitPrice: customCablePrices[`cable_${cable.typeId}`] ?? (customCableTypes.find(t => t.id === cable.typeId)?.costPerMeter || 0),
        name: customNames[`cable_${cable.typeId}`] || customCableTypes.find(t => t.id === cable.typeId)?.name || `Câble (${cable.typeId})`
      })),
      extraItems: extraItems,
      phases: projectPhases,
      accessCode: accessCode || Math.random().toString(36).substring(2, 8).toUpperCase(),
      data: {
        customPrices,
        customCablePrices,
        excludedKeys,
        customQuantityOffsets,
        customNames,
        laborRate,
        vatRate,
        invoiceDescription,
        companyName,
        companyAddress,
        companyPhone,
        companyEmail,
        companyRccm,
        companyNif,
        companyTvaStatus,
        paymentMethods,
        projectLocation,
        clientAddress,
        footerNote,
        logo,
        signature,
        stamp
      }
    };

    // Save to local state
    setInvoiceHistory(prev => {
      const exists = prev.findIndex(inv => inv.id === invoiceId);
      if (exists !== -1) {
        const updated = [...prev];
        updated[exists] = newInvoice;
        return updated;
      }
      return [newInvoice, ...prev];
    });

    // Save to Firestore for public view
    try {
      if (!user) {
        showToast("Veuillez vous connecter pour sauvegarder dans le cloud et activer le partage QR.", "info");
        return;
      }

      await setDoc(doc(db, 'invoices', invoiceId), {
        ...newInvoice,
        createdAt: serverTimestamp(),
        userId: user.uid
      }, { merge: true });
      showToast(`Facture ${invoiceRef} sauvegardée avec succès !`, 'success');
    } catch (err) {
      console.error("Firestore save error:", err);
      showToast("Erreur lors de la sauvegarde cloud, mais sauvegardé localement.", "error");
    }
  };

  const updateInvoiceStatus = async (id: string, newStatus: string) => {
    try {
      const invoiceRef = doc(db, 'invoices', id);
      await setDoc(invoiceRef, { status: newStatus }, { merge: true });
      // Local update will happen via onSnapshot
      showToast("Statut de la facture mis à jour.", "success");
    } catch (err) {
      console.error(err);
      showToast("Erreur lors de la mise à jour du statut.", "error");
    }
  };

  const loadInvoiceFromHistory = (invoice: any) => {
    setInvoiceRef(invoice.invoiceRef);
    setAccessCode(invoice.accessCode || '');
    setProjectPhases(invoice.phases || []);
    setClientName(invoice.clientName);
    setInvoiceDate(invoice.date);
    setCurrency(invoice.currency);
    
    const d = invoice.data;
    if (d) {
      if (d.customPrices) setCustomPrices(d.customPrices);
      if (d.customCablePrices) setCustomCablePrices(d.customCablePrices);
      if (d.excludedKeys) setExcludedKeys(d.excludedKeys);
      if (d.customQuantityOffsets) setCustomQuantityOffsets(d.customQuantityOffsets);
      if (d.customNames) setCustomNames(d.customNames);
      if (d.laborRate !== undefined) setLaborRate(d.laborRate);
      if (d.vatRate !== undefined) setVatRate(d.vatRate);
      if (d.invoiceDescription) setInvoiceDescription(d.invoiceDescription);
      if (d.companyName) setCompanyName(d.companyName);
      if (d.companyAddress) setCompanyAddress(d.companyAddress);
      if (d.companyPhone) setCompanyPhone(d.companyPhone);
      if (d.companyEmail) setCompanyEmail(d.companyEmail);
      if (d.companyRccm) setCompanyRccm(d.companyRccm);
      if (d.companyNif) setCompanyNif(d.companyNif);
      if (d.companyTvaStatus) setCompanyTvaStatus(d.companyTvaStatus);
      if (d.paymentMethods) {
        setPaymentMethods(d.paymentMethods);
      } else {
        // Fallback for older invoices
        const legacyMethods = [];
        if (d.bankName || d.bankAccountName || d.bankAccountNumber) {
          legacyMethods.push({
            id: crypto.randomUUID(),
            type: 'bank',
            provider: d.bankName || '',
            accountName: d.bankAccountName || '',
            accountNumber: d.bankAccountNumber || ''
          });
        }
        if (legacyMethods.length > 0) setPaymentMethods(legacyMethods);
      }
      if (d.projectLocation) setProjectLocation(d.projectLocation);
      if (d.footerNote) setFooterNote(d.footerNote);
      if (d.logo) setLogo(d.logo);
      if (d.signature) setSignature(d.signature);
      if (d.stamp) setStamp(d.stamp);
    }
    setActiveTab('INVOICE');
    showToast(`Facture ${invoice.invoiceRef} restaurée avec succès !`, 'success');
  };

  const deleteInvoiceFromHistory = (id: string) => {
    const inv = invoiceHistory.find(i => i.id === id);
    const ref = inv ? inv.invoiceRef : '';
    setInvoiceHistory(prev => prev.filter(inv => inv.id !== id));
    showToast(`Facture ${ref} supprimée de l'historique.`, 'info');
  };

  // Mini-Database persistent state
  const [materialDatabase, setMaterialDatabase] = useState<DatabaseMaterial[]>(() => {
    const saved = localStorage.getItem('materialDatabase_FCFA');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      } catch (e) {
        console.error(e);
      }
    }
    return DEFAULT_MATERIAL_DB;
  });

  // Persist material database
  useEffect(() => {
    localStorage.setItem('materialDatabase_FCFA', JSON.stringify(materialDatabase));
  }, [materialDatabase]);

  // Invoice parameters
  const [companyName, setCompanyName] = useState(() => localStorage.getItem('invoice_company_name') || 'SOCIETE MURASH');
  const [companyAddress, setCompanyAddress] = useState(() => localStorage.getItem('invoice_company_address') || 'Qt Forever, Face Garage central');
  const [companyPhone, setCompanyPhone] = useState(() => localStorage.getItem('invoice_company_phone') || '+228 90 65 35 92 / 93 79 59 76');
  const [companyEmail, setCompanyEmail] = useState(() => localStorage.getItem('invoice_company_email') || 'murashtogo@gmail.com');
  const [companyRccm, setCompanyRccm] = useState(() => localStorage.getItem('invoice_company_rccm') || 'TG4_FW-01-2022-13-00768');
  const [companyNif, setCompanyNif] = useState(() => localStorage.getItem('invoice_company_nif') || '1001169122');
  const [companyTvaStatus, setCompanyTvaStatus] = useState(() => localStorage.getItem('invoice_company_tva_status') || 'Entreprise réelle sans TVA');

  const [paymentMethods, setPaymentMethods] = useState<any[]>(() => {
    const saved = localStorage.getItem('invoice_payment_methods');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) {}
    }
    // Fallback to legacy bank fields if they exist
    const legacyBankName = localStorage.getItem('invoice_bank_name');
    if (legacyBankName) {
      return [{
        id: crypto.randomUUID(),
        type: 'bank',
        provider: legacyBankName,
        accountName: localStorage.getItem('invoice_bank_account_name') || '',
        accountNumber: localStorage.getItem('invoice_bank_account_number') || ''
      }];
    }
    return [
      {
        id: crypto.randomUUID(),
        type: 'bank',
        provider: 'ECOBANK',
        accountName: 'SOCIETE MURASH',
        accountNumber: '141559730001'
      }
    ];
  });
  const [showQrCode, setShowQrCode] = useState(() => localStorage.getItem('invoice_show_qr_code') !== 'false');
  const [bankQrCode, setBankQrCode] = useState<string>('');

  const [clientName, setClientName] = useState(() => localStorage.getItem('invoice_client_name') || 'GVA - CANALBOX TOGO');
  const [clientAddress, setClientAddress] = useState(() => localStorage.getItem('invoice_client_address') || 'contact-togo@gva.africa\nPhone (+228) 22 53 02 82');
  const [accessCode, setAccessCode] = useState('');
  const [projectLocation, setProjectLocation] = useState(() => localStorage.getItem('invoice_project_location') || 'Lomé, Togo');
  const [invoiceRef, setInvoiceRef] = useState(() => localStorage.getItem('invoice_ref') || `DP-015-${String(new Date().getMonth() + 1).padStart(2, '0')}-${String(new Date().getFullYear()).slice(2)}`);
  const [invoiceDate, setInvoiceDate] = useState(() => localStorage.getItem('invoice_date') || new Date().toISOString().split('T')[0]);
  const [vatRate, setVatRate] = useState<number>(() => {
    const saved = localStorage.getItem('invoice_vat_rate');
    return saved !== null ? Number(saved) : 0;
  });
  const [invoiceDescription, setInvoiceDescription] = useState(() => localStorage.getItem('invoice_description') || 'Systèmes CCTV pour la sécurisation des POPs: POP GVA (SAN)');
  const [footerNote, setFooterNote] = useState(() => localStorage.getItem('invoice_footer_note') || 'Ce devis est valable pour une durée de 30 jours à compter de sa date d\'émission.');
  const [showWatermark, setShowWatermark] = useState(() => localStorage.getItem('invoice_show_watermark') === 'true');
  const [watermarkText, setWatermarkText] = useState(() => localStorage.getItem('invoice_watermark_text') || 'BROUILLON');
  const [isPreviewHighContrast, setIsPreviewHighContrast] = useState(() => localStorage.getItem('invoice_preview_high_contrast') === 'true');
  const [laborRate, setLaborRate] = useState<number>(() => {
    const saved = localStorage.getItem('invoice_labor_rate');
    return saved !== null ? Number(saved) : 0;
  });

  useEffect(() => {
    localStorage.setItem('invoice_company_name', companyName);
  }, [companyName]);
  useEffect(() => {
    localStorage.setItem('invoice_company_address', companyAddress);
  }, [companyAddress]);
  useEffect(() => {
    localStorage.setItem('invoice_company_phone', companyPhone);
  }, [companyPhone]);
  useEffect(() => {
    localStorage.setItem('invoice_company_email', companyEmail);
  }, [companyEmail]);
  useEffect(() => {
    localStorage.setItem('invoice_company_rccm', companyRccm);
  }, [companyRccm]);
  useEffect(() => {
    localStorage.setItem('invoice_company_nif', companyNif);
  }, [companyNif]);
  useEffect(() => {
    localStorage.setItem('invoice_company_tva_status', companyTvaStatus);
  }, [companyTvaStatus]);
  useEffect(() => {
    localStorage.setItem('invoice_payment_methods', JSON.stringify(paymentMethods));
  }, [paymentMethods]);
  useEffect(() => {
    localStorage.setItem('invoice_show_qr_code', String(showQrCode));
  }, [showQrCode]);
  useEffect(() => {
    localStorage.setItem('invoice_client_name', clientName);
  }, [clientName]);
  useEffect(() => {
    localStorage.setItem('invoice_currency', currency);
  }, [currency]);
  useEffect(() => {
    localStorage.setItem('invoice_client_address', clientAddress);
  }, [clientAddress]);
  useEffect(() => {
    localStorage.setItem('invoice_project_location', projectLocation);
  }, [projectLocation]);
  useEffect(() => {
    localStorage.setItem('invoice_footer_note', footerNote);
  }, [footerNote]);
  useEffect(() => {
    localStorage.setItem('invoice_show_watermark', String(showWatermark));
  }, [showWatermark]);
  useEffect(() => {
    localStorage.setItem('invoice_watermark_text', watermarkText);
  }, [watermarkText]);
  useEffect(() => {
    localStorage.setItem('invoice_preview_high_contrast', String(isPreviewHighContrast));
  }, [isPreviewHighContrast]);
  useEffect(() => {
    localStorage.setItem('invoice_labor_rate', String(laborRate));
  }, [laborRate]);
  useEffect(() => {
    localStorage.setItem('invoice_ref', invoiceRef);
  }, [invoiceRef]);
  useEffect(() => {
    localStorage.setItem('invoice_date', invoiceDate);
  }, [invoiceDate]);
  useEffect(() => {
    localStorage.setItem('invoice_vat_rate', String(vatRate));
  }, [vatRate]);
  useEffect(() => {
    localStorage.setItem('invoice_description', invoiceDescription);
  }, [invoiceDescription]);

  // Dynamic pricing states
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});
  const [customCablePrices, setCustomCablePrices] = useState<Record<string, number>>({});

  // Exclusion of layout items from the invoice
  const [excludedKeys, setExcludedKeys] = useState<string[]>(() => {
    const saved = localStorage.getItem('invoice_excluded_keys');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { console.error(e); }
    }
    return [];
  });

  useEffect(() => {
    localStorage.setItem('invoice_excluded_keys', JSON.stringify(excludedKeys));
  }, [excludedKeys]);

  // Custom quantities/lengths for items on invoice
  const [customQuantityOffsets, setCustomQuantityOffsets] = useState<Record<string, number>>(() => {
    const saved = localStorage.getItem('invoice_custom_qty_offsets');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { console.error(e); }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('invoice_custom_qty_offsets', JSON.stringify(customQuantityOffsets));
  }, [customQuantityOffsets]);

  // Custom names/designations for items on invoice
  const [customNames, setCustomNames] = useState<Record<string, string>>(() => {
    const saved = localStorage.getItem('invoice_custom_names');
    if (saved) {
      try { return JSON.parse(saved); } catch(e) { console.error(e); }
    }
    return {};
  });

  useEffect(() => {
    localStorage.setItem('invoice_custom_names', JSON.stringify(customNames));
  }, [customNames]);

  // Extra / manual invoice items state
  const [extraItems, setExtraItems] = useState<{ id: string; name: string; quantity: number; unitPrice: number }[]>(() => {
    const saved = localStorage.getItem('extraInvoiceItems');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        console.error(e);
      }
    }
    return [];
  });

  // Invoice images
  const [logo, setLogo] = useState<string | null>(() => localStorage.getItem('invoice_logo'));
  const [signature, setSignature] = useState<string | null>(() => localStorage.getItem('invoice_signature'));
  const [stamp, setStamp] = useState<string | null>(() => localStorage.getItem('invoice_stamp'));

  useEffect(() => {
    try {
      if (logo) localStorage.setItem('invoice_logo', logo);
      else localStorage.removeItem('invoice_logo');
    } catch (e) {
      console.warn('Storage quota exceeded for logo', e);
    }
  }, [logo]);

  useEffect(() => {
    try {
      if (signature) localStorage.setItem('invoice_signature', signature);
      else localStorage.removeItem('invoice_signature');
    } catch (e) {
      console.warn('Storage quota exceeded for signature', e);
    }
  }, [signature]);

  useEffect(() => {
    try {
      if (stamp) localStorage.setItem('invoice_stamp', stamp);
      else localStorage.removeItem('invoice_stamp');
    } catch (e) {
      console.warn('Storage quota exceeded for stamp', e);
    }
  }, [stamp]);

  // Persist extra items
  useEffect(() => {
    localStorage.setItem('extraInvoiceItems', JSON.stringify(extraItems));
  }, [extraItems]);

  const generateInvoiceRef = () => {
    const now = new Date();
    const dateStr = now.toISOString().split('T')[0].replace(/-/g, '');
    const counter = parseInt(localStorage.getItem('last_invoice_counter') || '0', 10) + 1;
    localStorage.setItem('last_invoice_counter', counter.toString());
    return `INV-${dateStr}-${counter.toString().padStart(3, '0')}`;
  };

  const resetInvoiceData = () => {
    setCustomPrices({});
    setCustomCablePrices({});
    setExcludedKeys([]);
    setCustomQuantityOffsets({});
    setCustomNames({});
    setExtraItems([]);
    setLaborRate(0);
    setVatRate(0);
    setClientName('');
    setClientAddress('');
    setProjectLocation('');
    setInvoiceDescription('');
    
    // Update invoice reference automatically
    setInvoiceRef(generateInvoiceRef());
    setInvoiceDate(new Date().toISOString().split('T')[0]);
    showToast("La facturation a été remise à zéro.", "info");
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: React.Dispatch<React.SetStateAction<string | null>>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setter(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Form states for manual additions
  const [selectedExtraPreset, setSelectedExtraPreset] = useState<string>('FREE_TEXT');
  const [extraItemName, setExtraItemName] = useState('');
  const [extraItemQty, setExtraItemQty] = useState<number>(1);
  const [extraItemPrice, setExtraItemPrice] = useState<number>(0);

  // Database Tab search, filter and creation states
  const [dbSearchQuery, setDbSearchQuery] = useState('');
  const [dbCategoryFilter, setDbCategoryFilter] = useState('ALL');

  const [newDbId, setNewDbId] = useState('');
  const [newDbName, setNewDbName] = useState('');
  const [newDbCategory, setNewDbCategory] = useState('CCTV');
  const [newDbPrice, setNewDbPrice] = useState<number>(0);
  const [newDbDesc, setNewDbDesc] = useState('');

  const handleAddNewDbMaterial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDbId.trim() || !newDbName.trim()) return;

    if (materialDatabase.some(m => m.id === newDbId)) {
      alert("Un matériel avec cet identifiant existe déjà dans la base.");
      return;
    }

    const newItem: DatabaseMaterial = {
      id: newDbId.trim(),
      name: newDbName.trim(),
      category: newDbCategory,
      price: Math.max(0, newDbPrice),
      description: newDbDesc.trim()
    };

    setMaterialDatabase(prev => [...prev, newItem]);

    // Reset inputs
    setNewDbId('');
    setNewDbName('');
    setNewDbPrice(0);
    setNewDbDesc('');
  };

  const filteredDbMaterials = useMemo(() => {
    return materialDatabase.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(dbSearchQuery.toLowerCase()) || 
                            item.id.toLowerCase().includes(dbSearchQuery.toLowerCase()) ||
                            (item.description && item.description.toLowerCase().includes(dbSearchQuery.toLowerCase()));
      const matchesCategory = dbCategoryFilter === 'ALL' || item.category === dbCategoryFilter;
      return matchesSearch && matchesCategory;
    });
  }, [materialDatabase, dbSearchQuery, dbCategoryFilter]);

  // Automatically update name and price when a preset is chosen
  const handlePresetChange = (presetId: string) => {
    setSelectedExtraPreset(presetId);
    if (presetId === 'FREE_TEXT') {
      setExtraItemName('');
      setExtraItemPrice(0);
    } else {
      const customEquip = customEquipmentTypes.find(t => t.id === presetId);
      if (customEquip) {
        setExtraItemName(customEquip.name);
        setExtraItemPrice(customEquip.price);
      } else {
        const dbItem = materialDatabase.find(t => t.id === presetId);
        const label = dbItem ? dbItem.name : getFrenchLabel(presetId, presetId);
        const price = dbItem ? dbItem.price : 85000;
        setExtraItemName(label);
        setExtraItemPrice(price);
      }
    }
  };

  const handleAddExtraItem = (e: React.FormEvent) => {
    e.preventDefault();
    const finalName = extraItemName.trim() || 'Équipement Supplémentaire';
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      name: finalName,
      quantity: Math.max(1, extraItemQty),
      unitPrice: extraItemPrice
    };
    setExtraItems(prev => [...prev, newItem]);
    
    // Reset form fields
    setExtraItemName('');
    setSelectedExtraPreset('FREE_TEXT');
    setExtraItemQty(1);
    setExtraItemPrice(0);
  };

  const handleRemoveExtraItem = (id: string) => {
    setExtraItems(prev => prev.filter(item => item.id !== id));
  };

  const handleUpdateExtraItemQty = (id: string, q: number) => {
    setExtraItems(prev => prev.map(item => item.id === id ? { ...item, quantity: Math.max(1, q) } : item));
  };

  const handleUpdateExtraItemPrice = (id: string, p: number) => {
    setExtraItems(prev => prev.map(item => item.id === id ? { ...item, unitPrice: Math.max(0, p) } : item));
  };

  const resolveLabel = (type: string, subType: string) => {
    const customEquip = customEquipmentTypes.find(t => t.id === type);
    if (customEquip) return customEquip.name;
    return getFrenchLabel(type, subType);
  };

  // Flatten all equipment across sheets
  const allEquipment = useMemo(() => {
    return sheets.flatMap(sheet => sheet.equipment || []);
  }, [sheets]);

  // Filtered raw list
  const filteredEquipment = useMemo(() => {
    if (filterType === 'ALL') return allEquipment;
    return allEquipment.filter(e => e.type === filterType);
  }, [allEquipment, filterType]);

  const types = useMemo(() => ['ALL', ...Array.from(new Set(allEquipment.map(e => e.type)))], [allEquipment]);

  // Aggregate equipment by Type & Subtype for invoice
  const aggregatedEquipment = useMemo(() => {
    const map = new Map<string, { key: string; type: string; subType: string; quantity: number; unitPrice: number }>();
    
    allEquipment.forEach(e => {
      // Skip non-physical annotations/layouts
      if (e.type === 'TEXT' || e.type === 'RECTANGLE' || e.type === 'CIRCLE') return;
      
      const key = `${e.type}_${e.subType || ''}`;
      if (map.has(key)) {
        map.get(key)!.quantity += 1;
      } else {
        const customEquip = customEquipmentTypes.find(t => t.id === e.type);
        const dbItem = materialDatabase.find(item => item.id === e.type);
        let defaultPrice = customEquip ? customEquip.price : (dbItem ? dbItem.price : 0);
        if (defaultPrice > 0 && defaultPrice < 2000) {
          defaultPrice = Math.round(defaultPrice * 655.957);
        }
        map.set(key, {
          key, // Store the key explicitly
          type: e.type,
          subType: e.subType || (customEquip ? customEquip.name : (dbItem ? dbItem.name : e.type)),
          quantity: 1,
          unitPrice: defaultPrice
        });
      }
    });
    
    return Array.from(map.values());
  }, [allEquipment, customEquipmentTypes, materialDatabase]);

  // Aggregate cables and calculate real physical length in meters
  const aggregatedCables = useMemo(() => {
    const map = new Map<string, { typeId: string; name: string; totalLength: number; costPerMeter: number; color: string }>();
    
    sheets.forEach(sheet => {
      const scale = sheet.scaleRatio || 15; // default scale pixels/meter
      sheet.cables?.forEach(cable => {
        let lengthInPixels = 0;
        for (let i = 0; i < cable.points.length - 2; i += 2) {
          const dx = cable.points[i + 2] - cable.points[i];
          const dy = cable.points[i + 3] - cable.points[i + 1];
          lengthInPixels += Math.sqrt(dx * dx + dy * dy);
        }
        const lengthMeters = lengthInPixels / scale;

        const typeId = cable.cableTypeId || cable.type || 'generic';
        const cableTypeDef = customCableTypes.find(t => t.id === typeId || t.name === typeId);
        const name = cableTypeDef?.name || cable.type || 'Câble standard';
        let defaultCost = cableTypeDef?.costPerMeter ?? 800;
        if (defaultCost < 200) {
          defaultCost = Math.round(defaultCost * 655.957);
        }
        const color = cableTypeDef?.color || cable.color || '#3b82f6';

        if (map.has(typeId)) {
          map.get(typeId)!.totalLength += lengthMeters;
        } else {
          map.set(typeId, {
            typeId,
            name,
            totalLength: lengthMeters,
            costPerMeter: defaultCost,
            color
          });
        }
      });
    });

    return Array.from(map.values());
  }, [sheets, customCableTypes]);

  // Removed State Synchronization Hook


  // Financial summary calculations
  const totals = useMemo(() => {
    let totalHT = 0;
    
    aggregatedEquipment.forEach(item => {
      const key = item.key;
      if (excludedKeys.includes(key)) return; // Skip excluded equipment
      
      const price = customPrices[key] ?? item.unitPrice;
      const qty = customQuantityOffsets[key] !== undefined ? customQuantityOffsets[key] : item.quantity;
      totalHT += price * qty;
    });

    aggregatedCables.forEach(cable => {
      const key = `cable_${cable.typeId}`;
      if (excludedKeys.includes(key)) return; // Skip excluded cable
      
      const price = customCablePrices[cable.typeId] ?? cable.costPerMeter;
      const len = Math.max(0, cable.totalLength + (customQuantityOffsets[key] || 0));
      totalHT += price * len;
    });

    // Add manually added extra items
    extraItems.forEach(item => {
      totalHT += item.unitPrice * item.quantity;
    });

    const totalVAT = totalHT * (vatRate / 100);
    const laborCost = totalHT * (laborRate / 100);
    const finalTotalHT = totalHT + laborCost;
    const finalTotalVAT = finalTotalHT * (vatRate / 100);
    const totalTTC = finalTotalHT + finalTotalVAT;

    return {
      totalHT,
      laborCost,
      finalTotalHT,
      totalVAT: finalTotalVAT,
      totalTTC
    };
  }, [aggregatedEquipment, aggregatedCables, extraItems, customPrices, customCablePrices, vatRate, laborRate, excludedKeys, customQuantityOffsets]);

  useEffect(() => {
    // Generate QR code pointing to the project detail page
    const invoiceId = invoiceRef.replace(/[^a-zA-Z0-9]/g, '-');
    const qrText = `${window.location.origin}/project/${invoiceId}`;
    
    QRCode.toDataURL(qrText, {
      margin: 1,
      width: 150,
      color: {
        dark: '#0f172a', // Deep slate
        light: '#ffffff'
      }
    })
      .then(url => setBankQrCode(url))
      .catch(err => console.error("Error generating QR code:", err));
  }, [totals.totalTTC, currency, invoiceRef]);

  // Quantitative summary of equipment grouped by category for the summary panel
  const categoryCounts = useMemo(() => {
    const counts: Record<string, { label: string; count: number; items: { name: string; qty: number }[]; icon: string }> = {
      CCTV: { label: 'Vidéosurveillance (CCTV)', count: 0, items: [], icon: 'Camera' },
      WIFI: { label: 'Réseau Sans-fil (Wi-Fi)', count: 0, items: [], icon: 'Wifi' },
      NETWORK: { label: 'Réseau Filaire / Baies', count: 0, items: [], icon: 'Network' },
      SECURITY: { label: 'Sécurité & Contrôle d\'accès', count: 0, items: [], icon: 'ShieldAlert' },
      FIRE: { label: 'Incendie & Alarme', count: 0, items: [], icon: 'Flame' },
      MULTIMEDIA: { label: 'Écrans & Multimédia', count: 0, items: [], icon: 'Tv' },
    };

    aggregatedEquipment.forEach(item => {
      const key = item.key;
      if (excludedKeys.includes(key)) return; // Don't count excluded items

      let categoryKey = 'SECURITY';
      const customEquip = customEquipmentTypes.find(t => t.id === item.type);
      if (customEquip) {
        categoryKey = customEquip.type;
      } else {
        const dbItem = materialDatabase.find(t => t.id === item.type);
        if (dbItem) {
          categoryKey = dbItem.category;
        } else {
          if (item.type.startsWith('CCTV')) categoryKey = 'CCTV';
          else if (item.type.startsWith('WIFI')) categoryKey = 'WIFI';
          else if (item.type.startsWith('FIRE')) categoryKey = 'FIRE';
          else if (item.type.startsWith('ALARM')) categoryKey = 'FIRE';
          else if (item.type.startsWith('SWITCH') || item.type.startsWith('SERVER') || item.type.startsWith('UPS') || item.type === 'NETWORK') categoryKey = 'NETWORK';
          else if (item.type === 'TV' || item.type === 'MONITOR') categoryKey = 'MULTIMEDIA';
          else categoryKey = 'SECURITY';
        }
      }

      const qty = customQuantityOffsets[key] !== undefined ? customQuantityOffsets[key] : item.quantity;
      if (qty <= 0) return;

      if (!counts[categoryKey]) {
        counts[categoryKey] = { label: categoryKey, count: 0, items: [], icon: 'Info' };
      }

      const name = resolveLabel(item.type, item.subType);
      counts[categoryKey].count += qty;
      
      const existing = counts[categoryKey].items.find(i => i.name === name);
      if (existing) {
        existing.qty += qty;
      } else {
        counts[categoryKey].items.push({ name, qty });
      }
    });

    extraItems.forEach(item => {
      let categoryKey = 'SECURITY';
      const dbItem = materialDatabase.find(t => t.id === item.id || t.name === item.name);
      if (dbItem) {
        categoryKey = dbItem.category;
      } else {
        const nameUpper = item.name.toUpperCase();
        if (nameUpper.includes('CAMÉRA') || nameUpper.includes('CAMERA') || nameUpper.includes('CCTV') || nameUpper.includes('DÔME') || nameUpper.includes('DOME')) {
          categoryKey = 'CCTV';
        } else if (nameUpper.includes('WIFI') || nameUpper.includes('BORNE') || nameUpper.includes('ROUTEUR')) {
          categoryKey = 'WIFI';
        } else if (nameUpper.includes('INCENDIE') || nameUpper.includes('FUMÉE') || nameUpper.includes('FUMEE') || nameUpper.includes('SIRENE') || nameUpper.includes('SIRÈNE') || nameUpper.includes('DETECTEUR')) {
          categoryKey = 'FIRE';
        } else if (nameUpper.includes('SWITCH') || nameUpper.includes('RACK') || nameUpper.includes('BAIE') || nameUpper.includes('CÂBLE') || nameUpper.includes('CABLING') || nameUpper.includes('ONDELEUR') || nameUpper.includes('BATTERY')) {
          categoryKey = 'NETWORK';
        } else if (nameUpper.includes('TELEVISION') || nameUpper.includes('TÉLÉVISION') || nameUpper.includes('TV') || nameUpper.includes('MONITEUR') || nameUpper.includes('MONITOR') || nameUpper.includes('ÉCRAN') || nameUpper.includes('ECRAN')) {
          categoryKey = 'MULTIMEDIA';
        }
      }

      if (!counts[categoryKey]) {
        counts[categoryKey] = { label: categoryKey, count: 0, items: [], icon: 'Info' };
      }

      counts[categoryKey].count += item.quantity;
      const existing = counts[categoryKey].items.find(i => i.name === item.name);
      if (existing) {
        existing.qty += item.quantity;
      } else {
        counts[categoryKey].items.push({ name: item.name, qty: item.quantity });
      }
    });

    return Object.entries(counts)
      .filter(([_, data]) => data.count > 0)
      .map(([key, data]) => ({ key, ...data }));
  }, [aggregatedEquipment, extraItems, excludedKeys, customQuantityOffsets, customEquipmentTypes, materialDatabase]);

  // Modify equipment price
  const handlePriceChange = (type: string, subType: string, val: number) => {
    const key = `${type}_${subType}`;
    setCustomPrices(prev => ({ ...prev, [key]: val }));
  };

  // Modify cable price
  const handleCablePriceChange = (typeId: string, val: number) => {
    setCustomCablePrices(prev => ({ ...prev, [typeId]: val }));
  };

  // Export invoice to Excel
  const exportInvoiceExcel = () => {
    try {
      // 1. Prepare data
      const data = [
        ['Désignation', 'Qté', 'Prix Unitaire (HT)', 'Total (HT)'],
        ...aggregatedEquipment
          .filter(item => !excludedKeys.includes(`${item.type}_${item.subType}`))
          .map(item => {
              const key = `${item.type}_${item.subType}`;
              const label = customNames[key] || `${resolveLabel(item.type, item.subType)} (${item.type})`;
              const qtyVal = Math.max(0, item.quantity + (customQuantityOffsets[key] || 0));
              const priceVal = customPrices[key] ?? item.unitPrice;
              return [label, qtyVal, priceVal, priceVal * qtyVal];
          }),
        ...extraItems.map(item => [item.name, item.quantity, item.unitPrice, item.unitPrice * item.quantity]),
        ...aggregatedCables
          .filter(cable => !excludedKeys.includes(`cable_${cable.typeId}`))
          .map(cable => {
              const key = `cable_${cable.typeId}`;
              const label = customNames[key] || `Câblage : ${cable.name}`;
              const lenVal = Math.max(0, cable.totalLength + (customQuantityOffsets[key] || 0));
              const priceVal = customCablePrices[cable.typeId] ?? cable.costPerMeter;
              return [label, lenVal, priceVal, priceVal * lenVal];
          }),
        [],
        ['', '', 'Total HT', totals.totalHT],
        ['', '', `Main d'œuvre (${laborRate}%)`, totals.laborCost],
        ['', '', 'Total HT Final', totals.finalTotalHT],
        ['', '', `TVA (${vatRate}%)`, totals.totalVAT],
        ['', '', 'Total TTC', totals.totalTTC],
        [],
        ['CODE CLIENT', accessCode || 'N/A']
      ];

      // 2. Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Facture");

      // 3. Trigger download
      XLSX.writeFile(wb, `${invoiceRef || 'Facture'}_devis_proforma.xlsx`);
      showToast(`Fichier Excel "${invoiceRef || 'Facture'}_devis_proforma.xlsx" exporté avec succès !`, 'success');
    } catch (err: any) {
      console.error(err);
      showToast(`Échec de l'export Excel : ${err.message || String(err)}`, 'error');
    }
  };

  // Export invoice to clean enterprise PDF
  const exportInvoicePDF = async () => {
    try {
      // Ensure access code exists
      let finalAccessCode = accessCode;
      if (!finalAccessCode) {
        finalAccessCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        setAccessCode(finalAccessCode);
        showToast(`Code d'accès généré : ${finalAccessCode}`, 'info');
      }

      // Auto-save to cloud so the QR code scanned link actually exists
      await saveInvoiceToHistory(totals);
      
      const doc = new jsPDF();

    // Sleek top colored accent line (Royal blue)
    doc.setFillColor(37, 99, 235);
    doc.rect(15, 12, 180, 2.5, 'F');

    // 1. Issuer Header (Top-Left)
    let textStartY = 38;
    if (logo) {
      try {
        doc.addImage(logo, 'PNG', 15, 18, 55, 24);
      } catch (e) {
        console.error("Error adding logo to PDF", e);
        // Fallback if logo rendering fails
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(20);
        doc.setTextColor(30, 41, 59);
        doc.text(companyName, 15, 26);
        textStartY = 31;
      }
    } else {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(20);
      doc.setTextColor(30, 41, 59);
      doc.text(companyName, 15, 26);
      textStartY = 31;
    }

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(100, 116, 139); // Slate gray
    doc.text(`N° RCCM : ${companyRccm}`, 15, textStartY);
    doc.text(`NIF : ${companyNif}`, 15, textStartY + 4);
    doc.text(`Régime : ${companyTvaStatus}`, 15, textStartY + 8);
    doc.text(`Tél : ${companyPhone}`, 15, textStartY + 12);
    doc.text(`E-mail : ${companyEmail}`, 15, textStartY + 16);

    // 2. Proforma Header (Top-Right)
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(37, 99, 235); // Royal blue accent
    doc.text('DEVIS PROFORMA', 195, 24, { align: 'right' });

    // Watermark Implementation
    if (showWatermark && watermarkText) {
      doc.saveGraphicsState();
      // Use a very light gray for the watermark
      doc.setTextColor(220, 220, 220);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(60);
      doc.text(watermarkText.toUpperCase(), 105, 150, {
        align: 'center',
        angle: 45
      });
      doc.restoreGraphicsState();
    }
    
    doc.setFontSize(8.5);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(71, 85, 105);
    doc.text(`Référence : ${invoiceRef}`, 195, 30, { align: 'right' });
    doc.text(`Date d'émission : ${invoiceDate}`, 195, 34, { align: 'right' });
    doc.text(`Lieu du projet : ${projectLocation}`, 195, 38, { align: 'right' });
    if (vatRate > 0) {
      doc.text(`Taux TVA : ${vatRate}%`, 195, 42, { align: 'right' });
    } else {
      doc.text(`Régime : Exonéré de TVA (0%)`, 195, 42, { align: 'right' });
    }

    // 3. Client Card (Right column)
    const clientBoxX = 110;
    const clientBoxY = 44;
    const clientBoxW = 85;
    const clientBoxH = 26;
    
    doc.setFillColor(248, 250, 252); // Soft background
    doc.rect(clientBoxX, clientBoxY, clientBoxW, clientBoxH, 'F');
    doc.setDrawColor(226, 232, 240); // Soft borders
    doc.rect(clientBoxX, clientBoxY, clientBoxW, clientBoxH, 'S');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(148, 163, 184); // Gray header text
    doc.text('DESTINATAIRE / CLIENT', clientBoxX + 4, clientBoxY + 5);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(15, 23, 42); // Deep slate
    doc.text(clientName, clientBoxX + 4, clientBoxY + 10);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(71, 85, 105);
    const clientLines = doc.splitTextToSize(clientAddress, clientBoxW - 8);
    doc.text(clientLines, clientBoxX + 4, clientBoxY + 14);

    // 4. Project Callout (Objet / Projet)
    const objBoxY = 74;
    const objText = invoiceDescription || "Systèmes CCTV pour la sécurisation des POPs";
    const objLines = doc.splitTextToSize(objText, 140);
    const objHeight = Math.max(10, objLines.length * 4 + 4);

    doc.setFillColor(239, 246, 255); // Very light blue background
    doc.rect(15, objBoxY, 180, objHeight, 'F');
    
    // Left blue callout border
    doc.setFillColor(37, 99, 235);
    doc.rect(15, objBoxY, 1.5, objHeight, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(37, 99, 235);
    doc.text('OBJET / PROJET :', 18.5, objBoxY + (objHeight / 2) + 1.2);
    
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.setTextColor(30, 41, 59);
    doc.text(objLines, 48, objBoxY + (objHeight / 2) - ((objLines.length - 1) * 2) + 1.2);

    // 5. Data Rows formatting
    const tableRows: any[] = [];

    // Hardware equipment
    aggregatedEquipment.forEach(item => {
      const key = item.key;
      if (excludedKeys.includes(key)) return;

      const label = customNames[key] || `${resolveLabel(item.type, item.subType)} (${item.type})`;
      const qtyVal = customQuantityOffsets[key] !== undefined ? customQuantityOffsets[key] : item.quantity;
      const qty = `${qtyVal}`;
      const priceVal = customPrices[key] ?? item.unitPrice;
      const totalItemHT = priceVal * qtyVal;
      
      tableRows.push([
        label,
        qty,
        formatNumber(priceVal),
        formatNumber(totalItemHT)
      ]);
    });

    // Extra / manual items
    extraItems.forEach(item => {
      const label = `${item.name}`;
      const qty = `${item.quantity}`;
      const priceVal = item.unitPrice;
      const totalItemHT = priceVal * item.quantity;

      tableRows.push([
        label,
        qty,
        formatNumber(priceVal),
        formatNumber(totalItemHT)
      ]);
    });

    // Cable lengths
    aggregatedCables.forEach(cable => {
      const key = `cable_${cable.typeId}`;
      if (excludedKeys.includes(key)) return;

      const label = customNames[key] || `Câblage : ${cable.name}`;
      const lenVal = customQuantityOffsets[key] !== undefined ? customQuantityOffsets[key] : cable.totalLength;
      const qty = `${lenVal.toFixed(1)} m`;
      const priceVal = customCablePrices[cable.typeId] ?? cable.costPerMeter;
      const totalItemHT = priceVal * lenVal;

      tableRows.push([
        label,
        qty,
        formatNumber(priceVal),
        formatNumber(totalItemHT)
      ]);
    });

    // Add Labor row to PDF table if rate > 0
    if (laborRate > 0) {
      tableRows.push([
        "Main d'œuvre et Installation",
        `${laborRate}%`,
        formatNumber(totals.totalHT),
        formatNumber(totals.laborCost)
      ]);
    }

    // 6. Table Rendering with autoTable
    autoTable(doc, {
      head: [['DÉSIGNATION DES ÉQUIPEMENTS & CÂBLES', 'QTÉ', 'PRIX UNITAIRE (HT)', 'TOTAL (HT)']],
      body: tableRows,
      startY: objBoxY + objHeight + 5,
      margin: { top: 62, bottom: 21, left: 15, right: 15 },
      theme: 'striped',
      headStyles: {
        fillColor: [30, 41, 59], // Slate 800
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        fontSize: 8,
        halign: 'left',
        valign: 'middle'
      },
      bodyStyles: {
        fontSize: 7.5,
        textColor: [51, 65, 85], // Slate 700
        valign: 'middle'
      },
      alternateRowStyles: {
        fillColor: [248, 250, 252] // Light slate background for alternate rows
      },
      columnStyles: {
        0: { cellWidth: 75, halign: 'left' },
        1: { cellWidth: 25, halign: 'center' },
        2: { cellWidth: 40, halign: 'right' },
        3: { cellWidth: 40, halign: 'right' }
      },
      styles: {
        cellPadding: 2.5,
        lineColor: [226, 232, 240],
        lineWidth: 0.1
      }
    });

    // Helper to draw Header on pages > 1
    const drawPageHeader = (docInstance: jsPDF) => {
      // Sleek top colored accent line (Royal blue)
      docInstance.setFillColor(37, 99, 235);
      docInstance.rect(15, 12, 180, 2.5, 'F');

      // 1. Issuer Header (Top-Left)
      let textStartY = 38;
      if (logo) {
        try {
          docInstance.addImage(logo, 'PNG', 15, 18, 55, 24);
        } catch (e) {
          console.error("Error adding logo to PDF", e);
          docInstance.setFont('helvetica', 'bold');
          docInstance.setFontSize(20);
          docInstance.setTextColor(30, 41, 59);
          docInstance.text(companyName, 15, 26);
          textStartY = 31;
        }
      } else {
        docInstance.setFont('helvetica', 'bold');
        docInstance.setFontSize(20);
        docInstance.setTextColor(30, 41, 59);
        docInstance.text(companyName, 15, 26);
        textStartY = 31;
      }

      docInstance.setFont('helvetica', 'normal');
      docInstance.setFontSize(8);
      docInstance.setTextColor(100, 116, 139); // Slate gray
      docInstance.text(`N° RCCM : ${companyRccm}`, 15, textStartY);
      docInstance.text(`NIF : ${companyNif}`, 15, textStartY + 4);
      docInstance.text(`Régime : ${companyTvaStatus}`, 15, textStartY + 8);
      docInstance.text(`Tél : ${companyPhone}`, 15, textStartY + 12);
      docInstance.text(`E-mail : ${companyEmail}`, 15, textStartY + 16);

      // 2. Proforma Header (Top-Right)
      docInstance.setFont('helvetica', 'bold');
      docInstance.setFontSize(16);
      docInstance.setTextColor(37, 99, 235); // Royal blue accent
      docInstance.text('DEVIS PROFORMA', 195, 24, { align: 'right' });

      // Watermark Implementation
      if (showWatermark && watermarkText) {
        docInstance.saveGraphicsState();
        docInstance.setTextColor(245, 245, 245); // Extremely faint on pages > 1
        docInstance.setFont('helvetica', 'bold');
        docInstance.setFontSize(60);
        docInstance.text(watermarkText.toUpperCase(), 105, 150, {
          align: 'center',
          angle: 45
        });
        docInstance.restoreGraphicsState();
      }
      
      docInstance.setFontSize(8.5);
      docInstance.setFont('helvetica', 'normal');
      docInstance.setTextColor(71, 85, 105);
      docInstance.text(`Référence : ${invoiceRef}`, 195, 30, { align: 'right' });
      docInstance.text(`Date d'émission : ${invoiceDate}`, 195, 34, { align: 'right' });
      docInstance.text(`Lieu du projet : ${projectLocation}`, 195, 38, { align: 'right' });
      if (vatRate > 0) {
        docInstance.text(`Taux TVA : ${vatRate}%`, 195, 42, { align: 'right' });
      } else {
        docInstance.text(`Régime : Exonéré de TVA (0%)`, 195, 42, { align: 'right' });
      }
    };

    // Helper to draw the elegant Page Footer on ALL pages
    const drawPageFooter = (docInstance: jsPDF, pageNum: number, totalPagesCount: number) => {
      const pHeight = docInstance.internal.pageSize.getHeight();
      const pWidth = docInstance.internal.pageSize.getWidth();
      
      // Colored bottom bar
      docInstance.setFillColor(30, 41, 59); // Dark Slate (Matches table header)
      docInstance.rect(0, pHeight - 18, pWidth, 18, 'F');
      
      // Colored blue accent on top of the footer bar
      docInstance.setFillColor(37, 99, 235); // Royal Blue
      docInstance.rect(0, pHeight - 18.5, pWidth, 0.5, 'F');
      
      docInstance.setFont('helvetica', 'bold');
      docInstance.setFontSize(8.5);
      docInstance.setTextColor(255, 255, 255); // White
      docInstance.text(companyName.toUpperCase(), pWidth / 2, pHeight - 11.5, { align: 'center' });
      
      docInstance.setFont('helvetica', 'normal');
      docInstance.setFontSize(7.5);
      docInstance.setTextColor(226, 232, 240); // Soft Light Gray
      const footerContact = `${companyAddress}  •  Tél : ${companyPhone}  •  E-mail : ${companyEmail}`;
      docInstance.text(footerContact, pWidth / 2, pHeight - 7, { align: 'center' });
      
      docInstance.setFontSize(6.5);
      docInstance.setTextColor(148, 163, 184); // Muted gray for legal info
      const footerLegal = `RCCM : ${companyRccm}  |  NIF : ${companyNif}  |  Document Proforma`;
      docInstance.text(footerLegal, pWidth / 2, pHeight - 3, { align: 'center' });

      // Page numbers inside the bar
      docInstance.setFontSize(7);
      docInstance.setTextColor(226, 232, 240);
      docInstance.text(`CODE CLIENT : ${accessCode || 'NON DÉFINI'}`, 15, pHeight - 7);
      docInstance.text(`Page ${pageNum} / ${totalPagesCount}`, pWidth - 15, pHeight - 7, { align: 'right' });
    };

    // 7. Dynamic Totals & Footer Spacing Calculations
    const finalY = (doc as any).lastAutoTable.finalY + 6;
    const totalsBoxW = 75;
    const totalsBoxH = 34; // Increased height for labor and final HT rows
    const totalsBoxX = 195 - totalsBoxW; // Right-aligned

    let totalsBoxY = finalY;

    // Check if totals box fits on the current page above the pinned footer block (which starts at Y = 235)
    if (totalsBoxY + totalsBoxH > 230) {
      doc.addPage();
      totalsBoxY = 68; // Well below the header (which takes up to Y=54) on the new page
    }
    const footerY = 235; // Pin signature and stamp block to the bottom (Y=235) on the last page

    // 7b. Total in Words Box (Left-aligned, symmetrical to Totals Box on the right)
    const wordsBoxX = 15;
    const wordsBoxY = totalsBoxY;
    const wordsBoxW = totalsBoxX - 15 - 5; // Left-aligned with 5mm gap from totals box
    const wordsBoxH = totalsBoxH;

    // Draw a nice soft grey box with a border for the Total in Words
    doc.setFillColor(248, 250, 252);
    doc.rect(wordsBoxX, wordsBoxY, wordsBoxW, wordsBoxH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(wordsBoxX, wordsBoxY, wordsBoxW, wordsBoxH, 'S');

    doc.setFont('helvetica', 'bolditalic');
    doc.setFontSize(7.5);
    doc.setTextColor(30, 41, 59);
    doc.text("ARRÊTÉ DU PRÉSENT DEVIS PROFORMA", wordsBoxX + 4, wordsBoxY + 5.5);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);

    // Get total in words using French helper
    const totalInWords = getAmountInWordsFR(totals.totalTTC, currency);
    const wordsLines = doc.splitTextToSize(`Arrêté le présent devis proforma à la somme de : ${totalInWords}.`, wordsBoxW - 8);
    doc.text(wordsLines, wordsBoxX + 4, wordsBoxY + 11.5);

    // 7c. Totals Background Box (Right-aligned)
    doc.setFillColor(248, 250, 252);
    doc.rect(totalsBoxX, totalsBoxY, totalsBoxW, totalsBoxH, 'F');
    doc.setDrawColor(226, 232, 240);
    doc.rect(totalsBoxX, totalsBoxY, totalsBoxW, totalsBoxH, 'S');

    // Totals labels
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(100, 116, 139);
    doc.text('Sous-total Matériel HT :', totalsBoxX + 4, totalsBoxY + 5.5);
    doc.text(`Main d'œuvre (${laborRate}%) :`, totalsBoxX + 4, totalsBoxY + 11.5);
    doc.text('Total HT :', totalsBoxX + 4, totalsBoxY + 17.5);
    doc.text(`TVA (${vatRate}%) :`, totalsBoxX + 4, totalsBoxY + 23.5);

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    doc.text('TOTAL TTC :', totalsBoxX + 4, totalsBoxY + 29.5);

    // Totals values (right-aligned)
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(30, 41, 59);
    doc.text(`${formatNumber(totals.totalHT)} ${currency}`, 190, totalsBoxY + 5.5, { align: 'right' });
    doc.text(`${formatNumber(totals.laborCost)} ${currency}`, 190, totalsBoxY + 11.5, { align: 'right' });
    doc.text(`${formatNumber(totals.finalTotalHT)} ${currency}`, 190, totalsBoxY + 17.5, { align: 'right' });
    doc.text(`${formatNumber(totals.totalVAT)} ${currency}`, 190, totalsBoxY + 23.5, { align: 'right' });

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(29, 78, 216); // Professional blue total
    doc.text(`${formatNumber(totals.totalTTC)} ${currency}`, 190, totalsBoxY + 29.5, { align: 'right' });

    // 8. Signature, Stamp & Bank Info Footer Block (Always on the last page, pinned to footerY)
    doc.setDrawColor(226, 232, 240);
    doc.line(15, footerY, 195, footerY);

    // Disclaimer / Note mention (rendered first at top of footer area)
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(footerNote, 15, footerY + 5);

    // A subtle sub-line separator
    doc.setDrawColor(241, 245, 249);
    doc.line(15, footerY + 8, 195, footerY + 8);

    // Payment Info Column
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('MOYENS DE PAIEMENT', 15, footerY + 14);

    doc.setFontSize(7.5);
    doc.setTextColor(71, 85, 105);
    
    let py = footerY + 19;
    paymentMethods.slice(0, 2).forEach((method, idx) => {
      if (idx > 0) py += 4; // Extra spacing between methods
      doc.setFont('helvetica', 'bold');
      doc.text(`${method.provider} ${method.type === 'mobile_money' ? '(Mobile Money)' : ''}`, 15, py);
      py += 4;
      doc.setFont('helvetica', 'normal');
      doc.text(`Titulaire : ${method.accountName}`, 15, py);
      py += 4;
      doc.text(`N° : ${method.accountNumber}`, 15, py);
    });

    if (showQrCode && bankQrCode) {
      try {
        doc.addImage(bankQrCode, 'PNG', 64, footerY + 10, 22, 22);
      } catch (e) {
        console.error("Error adding banking QR code to PDF", e);
      }
    }

    // Company Stamp Column
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('CACHET ET TAMPON', 125, footerY + 14);

    if (stamp) {
      try {
        doc.addImage(stamp, 'PNG', 125, footerY + 16, 24, 24);
      } catch (e) {
        console.error("Error adding stamp to PDF", e);
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('(Aucun cachet configuré)', 125, footerY + 19);
    }

    // Agreement/Signature Column
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.setTextColor(15, 23, 42);
    doc.text('SIGNATURE POUR ACCORD', 165, footerY + 14);

    if (signature) {
      try {
        doc.addImage(signature, 'PNG', 165, footerY + 16, 32, 14);
      } catch (e) {
        console.error("Error adding signature to PDF", e);
      }
    } else {
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(7.5);
      doc.setTextColor(148, 163, 184);
      doc.text('(Aucune signature configurée)', 165, footerY + 19);
    }

    // 9. Post-processing loop to draw Header on pages > 1 and Footer on ALL pages
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= totalPages; i++) {
      doc.setPage(i);
      
      // Draw Header on pages > 1
      if (i > 1) {
        drawPageHeader(doc);
      }
      
      // Draw Footer on ALL pages
      drawPageFooter(doc, i, totalPages);
    }

    const newLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      invoiceRef: invoiceRef,
      clientName: clientName,
      totalTTC: totals.totalTTC,
      currency: currency,
      settings: { showWatermark, watermarkText, isPreviewHighContrast }
    };
    setExportLogs(prev => [newLog, ...prev]);

    const fileName = `${invoiceRef}_devis_proforma.pdf`;

    if (finalAccessCode) {
      showToast("Sécurisation du PDF en cours...", "info");
      // Get PDF as base64
      const pdfBase64 = doc.output('datauristring').split(',')[1];
      
      try {
        const response = await fetch('/api/encrypt-pdf', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ pdfBase64, password: finalAccessCode })
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Erreur serveur lors de l'encryption");
        }
        
        const { encryptedBase64 } = await response.json();
        
        // Download encrypted PDF
        const link = document.createElement('a');
        link.href = `data:application/pdf;base64,${encryptedBase64}`;
        link.download = fileName;
        link.click();
        
        showToast(`Document PDF sécurisé généré avec succès !`, 'success');
      } catch (encryptErr: any) {
        console.error("Encryption error:", encryptErr);
        showToast(`Échec de la sécurisation : ${encryptErr.message}. Téléchargement de la version standard.`, "info");
        doc.save(fileName);
      }
    } else {
      // Trigger download
      doc.save(fileName);
      showToast(`Document PDF "${fileName}" généré avec succès !`, 'success');
    }
    } catch (err: any) {
      console.error(err);
      showToast(`Échec de la génération du PDF : ${err.message || String(err)}`, 'error');
    }
  };

  const exportToJSON = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allEquipment));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "equipment_inventory.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/75 backdrop-blur-md"
      />

      {/* Modal Window */}
      <motion.div
        initial={{ scale: 0.95, opacity: 0, y: 15 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0, y: 15 }}
        transition={{ type: 'spring', damping: 25, stiffness: 350 }}
        className={cn(
          "relative w-full max-w-[96vw] h-[92vh] flex flex-col rounded-xl border shadow-2xl overflow-hidden transition-colors duration-300 z-10",
          theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"
        )}
      >
        
        {/* Header bar */}
        <div className={cn(
          "flex justify-between items-center px-6 py-4 border-b transition-colors duration-300",
          theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-white border-zinc-200"
        )}>
          <div className="flex items-center gap-3">
            <div className="bg-blue-600/10 text-blue-500 p-2 rounded-lg border border-blue-500/20">
              <Receipt size={22} className="animate-pulse" />
            </div>
            <div>
              <h2 className={cn(
                "text-lg font-bold flex items-center gap-2 transition-colors",
                theme === 'dark' ? "text-white" : "text-zinc-900"
              )}>Inventaire & Facturation</h2>
              <p className="text-xs text-zinc-500">Consultez l'inventaire matériel et générez des factures PDF ou devis</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Auth UI */}
            <div className={cn(
              "hidden md:flex items-center gap-3 px-3 py-1.5 border rounded-lg text-[10px] transition-all",
              theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"
            )}>
              {authLoading ? (
                <Loader2 className="animate-spin text-zinc-500" size={12} />
              ) : user ? (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 text-emerald-500 font-bold uppercase tracking-wider">
                    <Cloud size={12} />
                    <span>Connecté</span>
                  </div>
                  <div className="h-3 w-[1px] bg-zinc-800" />
                  <span className="text-zinc-400 max-w-[120px] truncate">{user.email}</span>
                  <button 
                    onClick={async () => {
                      setAuthLoading(true);
                      await logoutUser();
                      setAuthLoading(false);
                    }}
                    className="p-1 hover:bg-zinc-800 text-zinc-500 hover:text-red-400 rounded transition-colors cursor-pointer"
                    title="Déconnexion"
                  >
                    <LogOut size={12} />
                  </button>
                </div>
              ) : (
                <button 
                  onClick={async () => {
                    setAuthLoading(true);
                    try {
                      await loginWithGoogle();
                    } catch (e) {}
                    setAuthLoading(false);
                  }}
                  className="flex items-center gap-1.5 text-blue-400 font-bold hover:text-blue-300 transition-colors cursor-pointer"
                >
                  <LogIn size={12} />
                  CONNEXION CLOUD
                </button>
              )}
            </div>

            <button 
              onClick={onClose} 
              className={cn(
                "p-2 rounded-lg transition-colors cursor-pointer",
                theme === 'dark' ? "text-zinc-400 hover:text-white bg-zinc-800 hover:bg-zinc-700" : "text-zinc-500 hover:text-zinc-900 bg-zinc-100 hover:bg-zinc-200"
              )}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Tab Selection */}
        <div className={cn(
          "flex justify-between items-center px-6 py-2 border-b transition-colors duration-300",
          theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-zinc-100 border-zinc-200"
        )}>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('BILLING_MGMT')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                activeTab === 'BILLING_MGMT'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')
              )}
            >
              <Receipt size={16} />
              Gestion Facturation
            </button>
            <button
              onClick={() => setActiveTab('INVOICE')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                activeTab === 'INVOICE'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')
              )}
            >
              <FilePlus size={16} />
              Générateur de Facture / Devis
            </button>
            <button
              onClick={() => setActiveTab('LIST')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                activeTab === 'LIST'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')
              )}
            >
              <FileText size={16} />
              Liste Détaillée ({allEquipment.length})
            </button>
            <button
              onClick={() => setActiveTab('DATABASE')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                activeTab === 'DATABASE'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')
              )}
            >
              <Database size={16} />
              Base de Données
            </button>
            <button
              onClick={() => setActiveTab('CLIENTS')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                activeTab === 'CLIENTS'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')
              )}
            >
              <User size={16} />
              Base Clients
            </button>
            <button
              onClick={() => setActiveTab('HISTORY')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                activeTab === 'HISTORY'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')
              )}
            >
              <RotateCcw size={16} />
              Historique
            </button>
            <button
              onClick={() => setActiveTab('SETTINGS')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                activeTab === 'SETTINGS'
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20'
                  : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')
              )}
            >
              <Settings2 size={16} />
              Configuration du Projet
            </button>
            <button
              onClick={() => setActiveTab('DASHBOARD')}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all cursor-pointer",
                activeTab === 'DASHBOARD'
                  ? 'bg-purple-600 text-white shadow-lg shadow-purple-500/20'
                  : (theme === 'dark' ? 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800' : 'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-200')
              )}
            >
              <LayoutDashboard size={16} />
              Tableau de bord
            </button>
          </div>

          <div className="flex items-center gap-2">
            {activeTab === 'LIST' && (
              <div className="flex items-center gap-2">
                <Filter size={14} className="text-zinc-500" />
                <select 
                  value={filterType} 
                  onChange={(e) => setFilterType(e.target.value)} 
                  className={cn(
                    "text-xs rounded-lg border px-3 py-1.5 focus:border-blue-500 outline-none transition-colors",
                    theme === 'dark' ? "bg-zinc-950 text-zinc-300 border-zinc-800" : "bg-white text-zinc-700 border-zinc-300"
                  )}
                >
                  {types.map(t => <option key={t} value={t}>{t}</option>)}
                </select>
              </div>
            )}
            
            {(activeTab === 'INVOICE' || activeTab === 'LIST') && (
              <div className="flex items-center gap-2">
                <button 
                  onClick={resetInvoiceData}
                  className="flex items-center gap-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 hover:text-red-400 text-xs font-bold px-3 py-2 rounded-lg cursor-pointer transition-all active:scale-95"
                  title="Réinitialiser la facture actuelle (remettre à zéro)"
                >
                  <Trash2 size={14} /> Vider la facture
                </button>
                {activeTab === 'INVOICE' && (
                  <>
                    <button 
                      onClick={() => saveInvoiceToHistory(totals)}
                      className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-emerald-500/10 cursor-pointer transition-all active:scale-95"
                    >
                      <RotateCcw size={14} /> Sauvegarder
                    </button>
                    <button 
                      onClick={exportInvoicePDF}
                      className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-blue-500/10 cursor-pointer transition-all active:scale-95"
                    >
                      <Download size={14} /> Exporter en PDF (Facture)
                    </button>
                    <button 
                      onClick={exportInvoiceExcel}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-4 py-2 rounded-lg shadow-lg shadow-green-500/10 cursor-pointer transition-all active:scale-95"
                    >
                      <FileSpreadsheet size={14} /> Exporter en Excel
                    </button>
                  </>
                )}
              </div>
            )}

            <button 
              onClick={exportToJSON} 
              className={cn(
                "flex items-center gap-2 text-xs font-semibold px-4 py-2 rounded-lg cursor-pointer transition-colors",
                theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700 hover:text-zinc-900"
              )}
            >
              <Download size={14} /> Exporter JSON
            </button>
          </div>
        </div>

        {/* Tab 1: Detailed List */}
        {activeTab === 'LIST' && (
          <div className={cn(
            "flex-1 overflow-auto p-6 transition-colors duration-300",
            theme === 'dark' ? "bg-zinc-950" : "bg-white"
          )}>
            {filteredEquipment.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-zinc-500 py-12">
                <FileText size={48} className="text-zinc-700 mb-2" />
                <p className="text-sm">Aucun équipement implanté ou correspondant au filtre.</p>
              </div>
            ) : (
              <div className={cn(
                "border rounded-xl overflow-hidden transition-colors duration-300",
                theme === 'dark' ? "border-zinc-800" : "border-zinc-200"
              )}>
                <table className="w-full text-left text-sm border-collapse">
                  <thead className={cn(
                    "uppercase text-[10px] font-bold tracking-wider border-b transition-colors duration-300",
                    theme === 'dark' ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-50 text-zinc-500 border-zinc-200"
                  )}>
                    <tr>
                      <th className="p-4">Identifiant (ID)</th>
                      <th className="p-4">Désignation</th>
                      <th className="p-4">Catégorie</th>
                      <th className="p-4">Calque / Layer</th>
                    </tr>
                  </thead>
                  <tbody className={cn(
                    "divide-y transition-colors duration-300",
                    theme === 'dark' ? "divide-zinc-800 bg-zinc-900/40" : "divide-zinc-200 bg-white"
                  )}>
                    {filteredEquipment.map(e => (
                      <tr key={e.id} className={cn(
                        "transition-colors",
                        theme === 'dark' ? "hover:bg-zinc-800/50" : "hover:bg-zinc-100"
                      )}>
                        <td className="p-4 font-mono text-xs text-blue-400">{e.id.slice(0, 13)}...</td>
                        <td className={cn(
                          "p-4 font-semibold transition-colors",
                          theme === 'dark' ? "text-white" : "text-zinc-900"
                        )}>{resolveLabel(e.type, e.subType)}</td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2 py-1 text-[10px] rounded-md font-bold uppercase tracking-wide border transition-colors",
                            theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-100 border-zinc-300 text-zinc-600"
                          )}>
                            {e.type}
                          </span>
                        </td>
                        <td className="p-4 text-zinc-500 text-xs">{e.layerId}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 1: Billing Management */}
        {activeTab === 'BILLING_MGMT' && (
          <div className={cn(
            "flex-1 overflow-y-auto p-6 transition-colors duration-300",
            theme === 'dark' ? "bg-zinc-950" : "bg-white"
          )}>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-zinc-300">Gestion de la Facturation</h2>
                <p className="text-sm text-zinc-500">Suivi des statuts et validation des documents.</p>
              </div>
            </div>

            {invoiceHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500 border border-dashed border-zinc-800 rounded-xl">
                <Receipt size={48} className="mb-4 opacity-20" />
                <p>Aucune facture enregistrée pour la gestion.</p>
              </div>
            ) : (
              <div className={cn(
                "rounded-xl border overflow-hidden",
                theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-white border-zinc-200"
              )}>
                <table className="w-full text-left text-xs border-collapse">
                  <thead className={theme === 'dark' ? "bg-zinc-800 text-zinc-300" : "bg-zinc-100 text-zinc-600"}>
                    <tr>
                      <th className="p-4 font-bold border-b border-zinc-700/50">N° Facture</th>
                      <th className="p-4 font-bold border-b border-zinc-700/50">Client</th>
                      <th className="p-4 font-bold border-b border-zinc-700/50">Montant</th>
                      <th className="p-4 font-bold border-b border-zinc-700/50">Statut</th>
                      <th className="p-4 font-bold border-b border-zinc-700/50">Actions</th>
                    </tr>
                  </thead>
                  <tbody className={theme === 'dark' ? "text-zinc-400 divide-y divide-zinc-800/50" : "text-zinc-600 divide-y divide-zinc-100"}>
                    {invoiceHistory.map((invoice) => (
                      <tr key={invoice.id} className="hover:bg-black/5 transition-colors">
                        <td className="p-4 font-mono font-bold">{invoice.invoiceRef}</td>
                        <td className="p-4">
                          <div className="font-semibold">{invoice.clientName}</div>
                          <div className="text-[10px] text-zinc-500">{invoice.date}</div>
                        </td>
                        <td className="p-4 font-bold text-zinc-300">
                          {formatNumber(invoice.totalTTC)} {invoice.currency}
                        </td>
                        <td className="p-4">
                          <span className={cn(
                            "px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider",
                            invoice.status === 'VALIDATED' ? "bg-emerald-500/20 text-emerald-400" :
                            invoice.status === 'REFUSED' ? "bg-red-500/20 text-red-400" :
                            "bg-amber-500/20 text-amber-400"
                          )}>
                            {invoice.status === 'VALIDATED' ? 'Validée' : 
                             invoice.status === 'REFUSED' ? 'Rejetée' : 'En attente'}
                          </span>
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <button 
                              onClick={() => loadInvoiceFromHistory(invoice)}
                              className="p-2 hover:bg-blue-500/10 text-blue-400 rounded-lg transition-colors"
                              title="Voir / Charger"
                            >
                              <FileText size={16} />
                            </button>
                            <button 
                              onClick={() => updateInvoiceStatus(invoice.id, 'VALIDATED')}
                              className="p-2 hover:bg-emerald-500/10 text-emerald-400 rounded-lg transition-colors"
                              title="Valider"
                            >
                              <CheckCircle size={16} />
                            </button>
                            <button 
                              onClick={() => updateInvoiceStatus(invoice.id, 'REFUSED')}
                              className="p-2 hover:bg-red-500/10 text-red-400 rounded-lg transition-colors"
                              title="Rejeter"
                            >
                              <XCircle size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Interactive Invoice Creator */}
        {activeTab === 'INVOICE' && (
          <div className={cn(
            "flex-1 flex overflow-hidden transition-colors duration-300",
            theme === 'dark' ? "bg-zinc-950" : "bg-white"
          )}>
            {/* Left side: parameters / edit form */}
            <div className={cn(
              "w-5/12 border-r overflow-y-auto p-6 space-y-6 transition-colors duration-300",
              theme === 'dark' ? "border-zinc-800 bg-zinc-900/20" : "border-zinc-200 bg-zinc-50/50"
            )}>
              
              {/* Box: Mode d'Aperçu */}
              <div className={cn(
                "border rounded-xl p-4 space-y-3 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-amber-500 font-semibold text-xs uppercase tracking-wider">
                    <Search size={14} /> Mode d'Aperçu
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      isPreviewHighContrast ? "text-zinc-500" : "text-blue-500"
                    )}>Standard</span>
                    <button
                      onClick={() => setIsPreviewHighContrast(!isPreviewHighContrast)}
                      className={cn(
                        "relative inline-flex h-5 w-10 items-center rounded-full transition-colors focus:outline-none",
                        isPreviewHighContrast ? "bg-zinc-800 border border-zinc-700" : "bg-blue-600"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                          isPreviewHighContrast ? "translate-x-5.5" : "translate-x-1"
                        )}
                      />
                    </button>
                    <span className={cn(
                      "text-[10px] font-bold uppercase",
                      isPreviewHighContrast ? "text-zinc-900 dark:text-white" : "text-zinc-500"
                    )}>Contraste Élevé</span>
                  </div>
                </div>
                <p className="text-[10px] text-zinc-500 leading-tight">
                  Le mode <b>Contraste Élevé</b> simule un rendu prêt pour l'impression noir & blanc avec des bordures accentuées.
                </p>
              </div>

              {/* Box: Résumé Quantitatif par Catégorie */}
              <div className={cn(
                "border rounded-xl p-4 space-y-3.5 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="flex items-center gap-2 text-indigo-500 dark:text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                  <LayoutGrid size={14} /> Résumé par Catégorie
                </div>
                
                {categoryCounts.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Aucun équipement planifié pour le moment.</p>
                ) : (
                  <div className="space-y-2.5">
                    {categoryCounts.map((cat) => {
                      const IconComponent = 
                        cat.key === 'CCTV' ? Camera :
                        cat.key === 'WIFI' ? Wifi :
                        cat.key === 'FIRE' ? Flame :
                        cat.key === 'NETWORK' ? Server :
                        cat.key === 'SECURITY' ? ShieldAlert :
                        cat.key === 'MULTIMEDIA' ? Tv : Info;

                      return (
                        <div 
                          key={cat.key} 
                          className={cn(
                            "p-2.5 rounded-lg border transition-all flex flex-col gap-1.5 shadow-sm",
                            theme === 'dark' 
                              ? "bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700/60" 
                              : "bg-white border-slate-100 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className={cn(
                                "p-1.5 rounded-md text-xs",
                                cat.key === 'CCTV' ? "bg-blue-500/10 text-blue-400" :
                                cat.key === 'WIFI' ? "bg-emerald-500/10 text-emerald-400" :
                                cat.key === 'FIRE' ? "bg-red-500/10 text-red-400" :
                                cat.key === 'NETWORK' ? "bg-indigo-500/10 text-indigo-400" :
                                cat.key === 'MULTIMEDIA' ? "bg-orange-500/10 text-orange-400" :
                                "bg-purple-500/10 text-purple-400"
                              )}>
                                <IconComponent size={14} />
                              </div>
                              <span className={cn(
                                "text-xs font-bold tracking-tight",
                                theme === 'dark' ? "text-slate-200" : "text-slate-800"
                              )}>
                                {cat.label}
                              </span>
                            </div>
                            <span className={cn(
                              "text-xs font-extrabold px-2 py-0.5 rounded-full font-mono shadow-sm border",
                              theme === 'dark' 
                                ? "bg-zinc-900 border-zinc-800 text-indigo-400" 
                                : "bg-slate-50 border-slate-100 text-indigo-600"
                            )}>
                              {cat.count} u
                            </span>
                          </div>

                          {/* Sub-items list */}
                          <div className="pl-8 space-y-1">
                            {cat.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center text-[10px]">
                                <span className={theme === 'dark' ? "text-zinc-400" : "text-zinc-500"}>
                                  {item.name}
                                </span>
                                <span className={cn(
                                  "font-bold font-mono",
                                  theme === 'dark' ? "text-zinc-300" : "text-zinc-700"
                                )}>
                                  x{item.qty}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Box: Corporate / Issuer */}
              <div className={cn(
                "border rounded-xl p-4 space-y-3 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                  <Building2 size={14} /> Identité de l'émetteur (Vous)
                </div>
                <div className="space-y-2.5 text-xs">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">Entreprise</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-xs px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors mt-0.5",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">Adresse postale</label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-xs px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors mt-0.5",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">Téléphone</label>
                      <input
                        type="text"
                        value={companyPhone}
                        onChange={(e) => setCompanyPhone(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-xs px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors mt-0.5",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">Email</label>
                      <input
                        type="text"
                        value={companyEmail}
                        onChange={(e) => setCompanyEmail(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-xs px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors mt-0.5",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">RCCM</label>
                      <input
                        type="text"
                        value={companyRccm}
                        onChange={(e) => setCompanyRccm(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-xs px-2 py-1.5 outline-none focus:border-blue-500 transition-colors mt-0.5 font-mono text-[11px]",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">NIF</label>
                      <input
                        type="text"
                        value={companyNif}
                        onChange={(e) => setCompanyNif(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-xs px-2 py-1.5 outline-none focus:border-blue-500 transition-colors mt-0.5 font-mono text-[11px]",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-[9px] text-zinc-500 font-bold uppercase">Régime TVA</label>
                      <input
                        type="text"
                        value={companyTvaStatus}
                        onChange={(e) => setCompanyTvaStatus(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-xs px-2 py-1.5 outline-none focus:border-blue-500 transition-colors mt-0.5",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Box: Client / Recipient */}
              <div className={cn(
                "border rounded-xl p-4 space-y-3 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="flex items-center gap-2 text-emerald-400 font-semibold text-xs uppercase tracking-wider">
                  <User size={14} /> Informations du Client
                </div>
                <div className="space-y-2.5">
                  <div>
                    <div className="flex justify-between items-center mt-1">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Nom du client / Société</label>
                      {quickClients.length > 0 && (
                        <select
                          onChange={(e) => {
                            const selected = quickClients.find(c => c.id === e.target.value);
                            if (selected) {
                              setClientName(selected.name);
                              setClientAddress(selected.address);
                            }
                          }}
                          className={cn(
                            "text-[9px] font-semibold border rounded px-1.5 py-0.5 outline-none max-w-[170px] cursor-pointer",
                            theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-600"
                          )}
                          value=""
                        >
                          <option value="" disabled>⚡ Sélectionner un client...</option>
                          {quickClients.map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <input
                      type="text"
                      value={clientName}
                      onChange={(e) => setClientName(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-emerald-500 transition-colors mt-1",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Adresse du client</label>
                    <textarea
                      value={clientAddress}
                      onChange={(e) => setClientAddress(e.target.value)}
                      rows={2}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-emerald-500 transition-colors mt-1 resize-none",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                      <MapPin size={10} /> Lieu du Projet
                    </label>
                    <input
                      type="text"
                      value={projectLocation}
                      onChange={(e) => setProjectLocation(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-emerald-500 transition-colors mt-1",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>
                </div>
              </div>

              {/* Box: Sécurité & Accès */}
              <div className={cn(
                "border rounded-xl p-4 space-y-4 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="flex items-center gap-2 text-red-400 font-semibold text-xs uppercase tracking-wider">
                  <ShieldAlert size={14} /> Sécurité & Accès Client
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-zinc-500 uppercase font-black">Code Client (Sécurité PDF)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={accessCode}
                      onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                      placeholder="EX: VOLT-123"
                      className="bg-zinc-950 border-zinc-800 text-xs text-white p-2 rounded w-full font-mono"
                    />
                    <button 
                      onClick={() => setAccessCode(Math.random().toString(36).substring(2, 8).toUpperCase())}
                      className="p-2 bg-zinc-800 rounded hover:bg-zinc-700 text-zinc-400"
                      title="Générer aléatoirement"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                  <p className="text-[8px] text-zinc-600 italic">Ce code sera requis pour consulter la facture en ligne et déverrouiller le PDF.</p>
                </div>
              </div>

              {/* Box: Chronologie du Projet */}
              <div className={cn(
                "border rounded-xl p-4 space-y-4 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs uppercase tracking-wider">
                    <Calendar size={14} /> Chronologie des Phases
                  </div>
                  <button
                    onClick={generateDefaultPhases}
                    className="text-[10px] font-black bg-blue-600/10 text-blue-400 px-2 py-1 rounded hover:bg-blue-600/20 transition-colors uppercase"
                  >
                    Auto-Générer
                  </button>
                </div>
                
                {projectPhases.length === 0 ? (
                  <p className="text-[10px] text-zinc-500 italic">Aucun planning configuré. Cliquez sur auto-générer pour commencer.</p>
                ) : (
                  <div className="space-y-3">
                    {projectPhases.map((phase, idx) => (
                      <div key={phase.id} className="bg-zinc-950/50 p-2 rounded border border-zinc-800/50 space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <input
                            type="text"
                            value={phase.name}
                            onChange={(e) => {
                              const newPhases = [...projectPhases];
                              newPhases[idx].name = e.target.value;
                              setProjectPhases(newPhases);
                            }}
                            className="bg-transparent border-none text-[11px] font-bold text-white p-0 focus:ring-0 w-full"
                          />
                          <button
                            onClick={() => setProjectPhases(prev => prev.filter(p => p.id !== phase.id))}
                            className="text-zinc-600 hover:text-red-400 transition-colors"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] text-zinc-600 uppercase font-black">Début (J+)</label>
                            <input
                              type="number"
                              value={phase.startDay}
                              onChange={(e) => {
                                const newPhases = [...projectPhases];
                                newPhases[idx].startDay = parseInt(e.target.value) || 0;
                                setProjectPhases(newPhases);
                              }}
                              className="bg-zinc-900 border-zinc-800 text-[10px] text-white p-1 rounded"
                            />
                          </div>
                          <div className="flex flex-col gap-0.5">
                            <label className="text-[8px] text-zinc-600 uppercase font-black">Durée (jours)</label>
                            <input
                              type="number"
                              value={phase.duration}
                              onChange={(e) => {
                                const newPhases = [...projectPhases];
                                newPhases[idx].duration = parseInt(e.target.value) || 0;
                                setProjectPhases(newPhases);
                              }}
                              className="bg-zinc-900 border-zinc-800 text-[10px] text-white p-1 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => setProjectPhases(prev => [...prev, { id: Math.random().toString(36).substr(2, 9), name: 'Nouvelle Phase', startDay: 0, duration: 5, status: 'PENDING' }])}
                      className="w-full py-1.5 border border-dashed border-zinc-800 rounded text-[10px] text-zinc-500 hover:text-zinc-300 hover:border-zinc-600 transition-all"
                    >
                      + Ajouter une phase
                    </button>
                  </div>
                )}
              </div>

              {/* Box: Identité Visuelle */}
              <div className={cn(
                "border rounded-xl p-4 space-y-3 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="flex items-center gap-2 text-violet-400 font-semibold text-xs uppercase tracking-wider">
                  <FileText size={14} /> Identité Visuelle
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Logo</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setLogo)} className={cn(
                      "text-[10px] file:border-0 file:text-[9px] file:px-2 file:py-1 file:rounded cursor-pointer w-full transition-colors",
                      theme === 'dark' ? "text-zinc-400 file:bg-zinc-800 file:text-white" : "text-zinc-600 file:bg-zinc-200 file:text-zinc-700"
                    )} />
                    {logo && <button onClick={() => setLogo(null)} className="text-[8px] text-red-400 hover:underline text-left mt-0.5">Supprimer logo</button>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Signature</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setSignature)} className={cn(
                      "text-[10px] file:border-0 file:text-[9px] file:px-2 file:py-1 file:rounded cursor-pointer w-full transition-colors",
                      theme === 'dark' ? "text-zinc-400 file:bg-zinc-800 file:text-white" : "text-zinc-600 file:bg-zinc-200 file:text-zinc-700"
                    )} />
                    {signature && <button onClick={() => setSignature(null)} className="text-[8px] text-red-400 hover:underline text-left mt-0.5">Supprimer signature</button>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Cachet</label>
                    <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setStamp)} className={cn(
                      "text-[10px] file:border-0 file:text-[9px] file:px-2 file:py-1 file:rounded cursor-pointer w-full transition-colors",
                      theme === 'dark' ? "text-zinc-400 file:bg-zinc-800 file:text-white" : "text-zinc-600 file:bg-zinc-200 file:text-zinc-700"
                    )} />
                    {stamp && <button onClick={() => setStamp(null)} className="text-[8px] text-red-400 hover:underline text-left mt-0.5">Supprimer cachet</button>}
                  </div>
                </div>
              </div>

              {/* Box: Reference & Taxes */}
              <div className={cn(
                "border rounded-xl p-4 space-y-3 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] text-zinc-500 font-bold uppercase">Devise</label>
                    <select
                      value={currency}
                      onChange={(e) => setCurrency(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs px-2.5 py-1.5 outline-none focus:border-blue-500 transition-colors mt-0.5 cursor-pointer",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    >
                      <option value="F CFA">F CFA</option>
                      <option value="EUR">EUR (€)</option>
                      <option value="USD">USD ($)</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                      <Hash size={10} /> Référence N°
                    </label>
                    <input
                      type="text"
                      value={invoiceRef}
                      onChange={(e) => setInvoiceRef(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-blue-500 transition-colors mt-1 font-mono",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                      <Calendar size={10} /> Date d'émission
                    </label>
                    <input
                      type="date"
                      value={invoiceDate}
                      onChange={(e) => setInvoiceDate(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-blue-500 transition-colors mt-1",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <Coins size={10} /> Taux de TVA (%)
                  </label>
                  <select
                    value={vatRate}
                    onChange={(e) => setVatRate(Number(e.target.value))}
                    className={cn(
                      "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-blue-500 transition-colors mt-1 cursor-pointer",
                      theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                    )}
                  >
                    <option value={20}>20% (Standard France)</option>
                    <option value={18}>18% (TVA Standard UEMOA)</option>
                    <option value={10}>10% (Taux intermédiaire)</option>
                    <option value={5.5}>5.5% (Taux réduit)</option>
                    <option value={0}>0% (Exonéré / Franchise)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                    <User size={10} /> Main d'œuvre (% du total HT)
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="number"
                      min="0"
                      max="1000"
                      value={laborRate}
                      onChange={(e) => setLaborRate(Number(e.target.value))}
                      className={cn(
                        "flex-1 border rounded-lg text-xs px-3 py-2 outline-none focus:border-blue-500 transition-colors",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                      placeholder="Ex: 15"
                    />
                    <span className="text-zinc-500 font-bold text-xs">%</span>
                  </div>
                </div>
              </div>

              {/* Box: Description / Projet */}
              <div className={cn(
                "border rounded-xl p-4 space-y-2 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider">Description du Projet / Titre du Devis</label>
                <textarea
                  value={invoiceDescription}
                  onChange={(e) => setInvoiceDescription(e.target.value)}
                  rows={2}
                  className={cn(
                    "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-blue-500 transition-colors font-sans mt-1 resize-none",
                    theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                  )}
                  placeholder="Ex: Systèmes CCTV pour la sécurisation des POPs..."
                />
              </div>

              {/* Box: Multiple Payment Methods */}
              <div className={cn(
                "border rounded-xl p-4 space-y-3 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                    <Coins size={14} /> Informations de Paiement
                  </div>
                  <button
                    onClick={() => {
                      setPaymentMethods([
                        ...paymentMethods,
                        { id: crypto.randomUUID(), type: 'mobile_money', provider: 'TMoney', accountName: '', accountNumber: '' }
                      ]);
                    }}
                    className="text-[10px] bg-indigo-500/10 text-indigo-400 hover:bg-indigo-500/20 px-2 py-1 rounded"
                  >
                    + Ajouter
                  </button>
                </div>
                <div className="space-y-3 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                  {paymentMethods.map((method, index) => (
                    <div key={method.id} className="relative border border-zinc-200 dark:border-zinc-800 rounded p-3 bg-zinc-50 dark:bg-zinc-900/30">
                      <button
                        onClick={() => setPaymentMethods(paymentMethods.filter(m => m.id !== method.id))}
                        className="absolute top-2 right-2 text-red-500 hover:text-red-400"
                        title="Supprimer"
                      >
                        <Trash2 size={12} />
                      </button>
                      <div className="grid grid-cols-2 gap-2 mb-2 pr-4">
                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold uppercase">Type</label>
                          <select
                            value={method.type}
                            onChange={(e) => {
                              const newMethods = [...paymentMethods];
                              newMethods[index].type = e.target.value;
                              setPaymentMethods(newMethods);
                            }}
                            className={cn(
                              "w-full border rounded text-xs px-2 py-1 outline-none focus:border-indigo-500 mt-0.5",
                              theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                            )}
                          >
                            <option value="bank">Banque</option>
                            <option value="mobile_money">Mobile Money</option>
                            <option value="other">Autre</option>
                          </select>
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold uppercase">Fournisseur</label>
                          <input
                            type="text"
                            value={method.provider}
                            onChange={(e) => {
                              const newMethods = [...paymentMethods];
                              newMethods[index].provider = e.target.value;
                              setPaymentMethods(newMethods);
                            }}
                            placeholder="ex: ECOBANK, TMoney"
                            className={cn(
                              "w-full border rounded text-xs px-2 py-1 outline-none focus:border-indigo-500 mt-0.5",
                              theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                            )}
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold uppercase">Titulaire</label>
                          <input
                            type="text"
                            value={method.accountName}
                            onChange={(e) => {
                              const newMethods = [...paymentMethods];
                              newMethods[index].accountName = e.target.value;
                              setPaymentMethods(newMethods);
                            }}
                            className={cn(
                              "w-full border rounded text-xs px-2 py-1 outline-none focus:border-indigo-500 mt-0.5",
                              theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                            )}
                          />
                        </div>
                        <div>
                          <label className="text-[9px] text-zinc-500 font-bold uppercase">Numéro / RIB</label>
                          <input
                            type="text"
                            value={method.accountNumber}
                            onChange={(e) => {
                              const newMethods = [...paymentMethods];
                              newMethods[index].accountNumber = e.target.value;
                              setPaymentMethods(newMethods);
                            }}
                            className={cn(
                              "w-full border rounded text-xs px-2 py-1 outline-none focus:border-indigo-500 mt-0.5 font-mono",
                              theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                            )}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  {paymentMethods.length === 0 && (
                    <div className="text-[10px] text-zinc-500 text-center py-2 italic">
                      Aucun moyen de paiement configuré
                    </div>
                  )}
                  
                  <div className="flex items-center justify-between border-t pt-2 mt-2 border-dashed border-zinc-200">
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">QR Code de Lien Facture</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={showQrCode}
                        onChange={(e) => setShowQrCode(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-indigo-600"></div>
                      <span className="ml-2 text-[10px] font-medium text-zinc-500">Activer</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Box: Edit Pricing of aggregated items */}
              <div className={cn(
                "border rounded-xl p-4 space-y-3 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
              )}>
                <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs uppercase tracking-wider">
                  <Settings2 size={14} /> Ajuster les Tarifs de l'Équipement
                </div>
                
                {aggregatedEquipment.length === 0 && aggregatedCables.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic">Aucun matériel à tarififier.</p>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {/* Equipments */}
                    {aggregatedEquipment.map(item => {
                      const key = item.key;
                      const currentPrice = customPrices[key] ?? item.unitPrice;
                      return (
                        <div key={key} className={cn(
                          "flex justify-between items-center gap-3 p-2 rounded-lg border transition-colors",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800/50" : "bg-white border-zinc-200 shadow-sm"
                        )}>
                          <div className="min-w-0">
                            <p className={cn(
                              "text-xs font-medium truncate",
                              theme === 'dark' ? "text-zinc-200" : "text-zinc-900"
                            )}>{resolveLabel(item.type, item.subType)}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{item.type} • Qté: {item.quantity}</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <input
                              type="number"
                              min="0"
                              step="500"
                              value={currentPrice}
                              onChange={(e) => handlePriceChange(item.type, item.subType, parseFloat(e.target.value) || 0)}
                              className={cn(
                                "w-24 text-right text-xs rounded border px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors",
                                theme === 'dark' ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                              )}
                            />
                            <span className="text-zinc-500 text-[10px] font-bold">{currency}</span>
                          </div>
                        </div>
                      );
                    })}

                    {/* Cables */}
                    {aggregatedCables.map(cable => {
                      const currentPrice = customCablePrices[cable.typeId] ?? cable.costPerMeter;
                      return (
                        <div key={cable.typeId} className={cn(
                          "flex justify-between items-center gap-3 p-2 rounded-lg border transition-colors",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800/50" : "bg-white border-zinc-200 shadow-sm"
                        )}>
                          <div className="min-w-0">
                            <p className={cn(
                              "text-xs font-medium truncate",
                              theme === 'dark' ? "text-zinc-200" : "text-zinc-900"
                            )}>Câble : {cable.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono truncate">{cable.totalLength.toFixed(1)} mètres planifiés</p>
                          </div>
                          <div className="flex items-center gap-1.5 flex-shrink-0">
                            <input
                              type="number"
                              min="0"
                              step="50"
                              value={currentPrice}
                              onChange={(e) => handleCablePriceChange(cable.typeId, parseFloat(e.target.value) || 0)}
                              className={cn(
                                "w-24 text-right text-xs rounded border px-2 py-1 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-colors",
                                theme === 'dark' ? "bg-zinc-900 border-zinc-700 text-white" : "bg-white border-zinc-300 text-zinc-900"
                              )}
                            />
                            <span className="text-zinc-500 text-[10px] font-bold">{currency}/m</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
              
              {/* Box: Excluded items (so they can restore them) */}
              {excludedKeys.length > 0 && (
                <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-zinc-400 font-semibold text-xs uppercase tracking-wider">
                    <span className="flex items-center gap-2"><Trash2 size={14} className="text-zinc-500" /> Lignes retirées ({excludedKeys.length})</span>
                    <button
                      type="button"
                      onClick={() => setExcludedKeys([])}
                      className="text-[10px] text-blue-400 hover:text-blue-300 font-bold uppercase hover:underline cursor-pointer"
                    >
                      Tout restaurer
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                    {excludedKeys.map(key => {
                      let label = '';
                      if (key.startsWith('cable_')) {
                        const cableId = key.replace('cable_', '');
                        const cable = aggregatedCables.find(c => c.typeId === cableId);
                        label = cable ? `Câble : ${cable.name}` : `Câble ${cableId}`;
                      } else {
                        const [type, subType] = key.split('_');
                        label = resolveLabel(type, subType);
                      }
                      return (
                        <div key={key} className="flex justify-between items-center gap-2 bg-zinc-950 p-1.5 px-2 rounded-lg border border-zinc-800/50 text-[11px]">
                          <span className="text-zinc-400 font-medium truncate flex-1">{label}</span>
                          <button
                            type="button"
                            onClick={() => setExcludedKeys(prev => prev.filter(k => k !== key))}
                            className="text-blue-400 hover:text-blue-300 font-semibold text-[10px] hover:underline cursor-pointer px-1.5 py-0.5 rounded bg-blue-500/10"
                          >
                            Réintégrer
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Box: Extra unplaced items manually added to invoice */}
              <div className={cn(
                "border rounded-xl p-4 space-y-4 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-zinc-50 border-zinc-200"
              )}>
                <div className="flex items-center gap-2 text-indigo-400 font-semibold text-xs uppercase tracking-wider">
                  <Plus size={14} /> Ajouter du matériel (Hors-Plan)
                </div>

                <form onSubmit={handleAddExtraItem} className={cn(
                  "space-y-3 p-3 rounded-lg border transition-colors duration-300",
                  theme === 'dark' ? "bg-zinc-950/60 border-zinc-800/50" : "bg-white border-zinc-200"
                )}>
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Sélectionner un modèle</label>
                    <select
                      value={selectedExtraPreset}
                      onChange={(e) => handlePresetChange(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-indigo-500 mt-1 cursor-pointer transition-colors",
                        theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    >
                      <option value="FREE_TEXT">-- Saisie manuelle libre --</option>
                      
                      {customEquipmentTypes.length > 0 && (
                        <optgroup label="Vos équipements personnalisés">
                          {customEquipmentTypes.map(t => (
                            <option key={t.id} value={t.id}>{t.name} (Custom)</option>
                          ))}
                        </optgroup>
                      )}

                      <optgroup label="Modèles de la base de données">
                        {materialDatabase.map(item => (
                          <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                      </optgroup>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Nom / Désignation</label>
                    <input
                      type="text"
                      required
                      placeholder="Ex: Écran de contrôle 24'', Onduleur additionnel..."
                      value={extraItemName}
                      onChange={(e) => setExtraItemName(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-indigo-500 mt-1 transition-colors",
                        theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Prix Unitaire ({currency})</label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        required
                        value={extraItemPrice}
                        onChange={(e) => setExtraItemPrice(parseFloat(e.target.value) || 0)}
                        className={cn(
                          "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-indigo-500 mt-1 font-mono transition-colors",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Quantité</label>
                      <input
                        type="number"
                        min="1"
                        step="1"
                        required
                        value={extraItemQty}
                        onChange={(e) => setExtraItemQty(parseInt(e.target.value) || 1)}
                        className={cn(
                          "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-indigo-500 mt-1 font-mono transition-colors",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                        )}
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.98] transition-all text-white text-xs font-bold py-2 rounded-lg shadow-md cursor-pointer flex items-center justify-center gap-1"
                  >
                    <Plus size={12} /> Ajouter à la facture
                  </button>
                </form>

                {/* List of current extra items with delete button */}
                {extraItems.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-wider">Matériels ajoutés manuellement :</p>
                    <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                      {extraItems.map(item => (
                        <div key={item.id} className={cn(
                          "flex justify-between items-center gap-2 p-2 rounded-lg border transition-colors",
                          theme === 'dark' ? "bg-zinc-950 border-zinc-800/80" : "bg-white border-zinc-200 shadow-sm"
                        )}>
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-indigo-300 font-semibold truncate" title={item.name}>{item.name}</p>
                            <p className="text-[10px] text-zinc-500 font-mono">
                              Total HT: {formatNumber(item.unitPrice * item.quantity)} {currency}
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0 font-mono">
                            {/* Price edit */}
                            <input
                              type="number"
                              min="0"
                              step="100"
                              value={item.unitPrice}
                              onChange={(e) => handleUpdateExtraItemPrice(item.id, parseFloat(e.target.value) || 0)}
                              className={cn(
                                "w-16 text-right text-[11px] rounded border px-1 py-0.5 outline-none transition-colors",
                                theme === 'dark' ? "bg-zinc-900 text-white border-zinc-700" : "bg-white text-zinc-900 border-zinc-300"
                              )}
                              title="Modifier le prix unitaire"
                            />
                            <span className="text-zinc-600 text-[10px] font-sans">{currency}</span>

                            {/* Qty edit */}
                            <input
                              type="number"
                              min="1"
                              step="1"
                              value={item.quantity}
                              onChange={(e) => handleUpdateExtraItemQty(item.id, parseInt(e.target.value) || 1)}
                              className={cn(
                                "w-10 text-center text-[11px] rounded border px-1 py-0.5 outline-none transition-colors",
                                theme === 'dark' ? "bg-zinc-900 text-white border-zinc-700" : "bg-white text-zinc-900 border-zinc-300"
                              )}
                              title="Modifier la quantité"
                            />
                            <span className="text-zinc-600 text-[10px] font-sans">u</span>

                            <button
                              type="button"
                              onClick={() => handleRemoveExtraItem(item.id)}
                              className="p-1 rounded text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                              title="Supprimer cette ligne"
                            >
                              <Trash2 size={12} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

            </div>

            {/* Right side: Realtime PDF Mockup preview */}
            <div className={cn(
              "flex-1 overflow-y-auto p-6 flex flex-col items-center justify-start transition-colors duration-300",
              theme === 'dark' ? "bg-zinc-950/70" : "bg-zinc-200/50"
            )}>
              <div className="text-zinc-500 text-[10px] font-bold uppercase mb-3 tracking-widest flex items-center gap-1.5">
                <span>Aperçu de la facture (Feuille A4)</span>
                <span className="w-1.5 h-1.5 rounded-sm bg-emerald-500 animate-ping" />
              </div>
              
              {/* Hidden file inputs for direct click uploads on the mockup */}
              <input
                type="file"
                ref={logoInputRef}
                onChange={(e) => handleImageUpload(e, setLogo)}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={signatureInputRef}
                onChange={(e) => handleImageUpload(e, setSignature)}
                accept="image/*"
                className="hidden"
              />
              <input
                type="file"
                ref={stampInputRef}
                onChange={(e) => handleImageUpload(e, setStamp)}
                accept="image/*"
                className="hidden"
              />

              {/* Invoice Canvas Sheets */}
              <div className={cn(
                "w-[100%] max-w-[740px] aspect-[1/1.414] rounded-lg shadow-2xl p-8 flex flex-col justify-between border relative select-none transition-all duration-300",
                isPreviewHighContrast 
                  ? "bg-white text-black border-black shadow-[0_0_0_2px_black]" 
                  : "bg-white text-zinc-900 border-zinc-300"
              )}>
                
                {/* A4 Content Wrapper */}
                <div className="space-y-5">
                  {/* Visual Header Banner */}
                  <div className={cn(
                    "flex justify-between items-start border-b-2 pb-3 transition-colors",
                    isPreviewHighContrast ? "border-black" : "border-zinc-900"
                  )}>
                    <div className="space-y-1 max-w-[60%]">
                      {logo ? (
                        <div className="relative group cursor-pointer inline-block mb-1" onClick={() => logoInputRef.current?.click()}>
                          <img src={logo} alt="Logo" className={cn(
                            "h-20 max-w-[240px] object-contain transition-all",
                            isPreviewHighContrast && "grayscale contrast-150"
                          )} />
                          <div className="absolute inset-0 bg-black/40 text-white text-[8px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                            Changer
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={cn(
                            "cursor-pointer border border-dashed rounded px-3 py-2 flex items-center gap-1.5 transition-all w-fit mb-1",
                            isPreviewHighContrast 
                              ? "border-black bg-white text-black" 
                              : "border-zinc-300 hover:border-blue-500 hover:bg-zinc-50 text-zinc-400"
                          )}
                          onClick={() => logoInputRef.current?.click()}
                        >
                          <Plus size={12} className={isPreviewHighContrast ? "text-black" : "text-zinc-400"} />
                          <span className="text-[9px] font-bold uppercase tracking-wider">Logo émetteur</span>
                        </div>
                      )}
                      <p className={cn(
                        "font-black text-sm tracking-tight leading-none transition-colors",
                        isPreviewHighContrast ? "text-black" : "text-zinc-950"
                      )}>{companyName}</p>
                      <div className={cn(
                        "text-[9px] space-y-0.5 leading-normal transition-colors",
                        isPreviewHighContrast ? "text-black font-medium" : "text-zinc-500"
                      )}>
                        <p>{companyAddress}</p>
                        <p>N°RCCM : {companyRccm} | NIF : {companyNif}</p>
                        <p>TVA : {companyTvaStatus}</p>
                        <p>{companyPhone} | {companyEmail}</p>
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <h4 className={cn(
                        "text-sm font-black tracking-wider uppercase transition-colors",
                        isPreviewHighContrast ? "text-black" : "text-blue-600"
                      )}>DEVIS PROFORMA</h4>
                      <div className={cn(
                        "text-[10px] space-y-0.5 transition-colors",
                        isPreviewHighContrast ? "text-black" : "text-zinc-600"
                      )}>
                        <p><span className={cn("font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-400")}>Réf :</span> <span className={cn("font-mono font-bold", isPreviewHighContrast ? "text-black underline" : "text-zinc-900")}>{invoiceRef}</span></p>
                        <p><span className={cn("font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-400")}>Date :</span> <span className={cn("font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-900")}>{invoiceDate}</span></p>
                        <p><span className={cn("font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-400")}>Lieu :</span> <span className={cn("font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-900")}>{projectLocation}</span></p>
                        <p><span className={cn("font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-400")}>TVA :</span> <span className={cn("font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-900")}>{vatRate}%</span></p>
                      </div>
                    </div>
                  </div>

                  {/* Client Column Info */}
                  <div className={cn(
                    "rounded-lg p-3 text-xs flex justify-between border transition-all",
                    isPreviewHighContrast 
                      ? "bg-white border-black border-2" 
                      : "bg-zinc-50 border-zinc-100"
                  )}>
                    <div>
                      <p className={cn(
                        "text-[8px] font-extrabold uppercase tracking-widest mb-0.5 transition-colors",
                        isPreviewHighContrast ? "text-black" : "text-zinc-400"
                      )}>DESTINATAIRE</p>
                      <p className={cn(
                        "font-black text-xs transition-colors",
                        isPreviewHighContrast ? "text-black" : "text-zinc-900"
                      )}>{clientName}</p>
                      <p className={cn(
                        "mt-0.5 whitespace-pre-line text-[10px] leading-tight max-w-[280px] transition-colors",
                        isPreviewHighContrast ? "text-black font-medium" : "text-zinc-600"
                      )}>{clientAddress}</p>
                    </div>
                  </div>

                  {/* Project description banner */}
                  <div className={cn(
                    "border-l-4 px-3 py-2 rounded-r transition-all",
                    isPreviewHighContrast 
                      ? "bg-white border-black border-y border-r" 
                      : "bg-blue-50/50 border-blue-500/80"
                  )}>
                    <p className={cn(
                      "text-[8px] font-extrabold uppercase tracking-widest mb-0.5 transition-colors",
                      isPreviewHighContrast ? "text-black" : "text-blue-500"
                    )}>OBJET / PROJET</p>
                    <p className={cn(
                      "text-xs font-bold leading-snug transition-colors",
                      isPreviewHighContrast ? "text-black underline" : "text-zinc-800"
                    )}>{invoiceDescription || "Systèmes CCTV pour la sécurisation des POPs"}</p>
                  </div>

                  {/* Summary Table */}
                  <div className="overflow-x-auto">
                    <table className={cn(
                      "w-full text-left text-xs border-collapse transition-all",
                      isPreviewHighContrast && "border-2 border-black"
                    )}>
                      <thead>
                        <tr className={cn(
                          "text-[9px] font-bold uppercase tracking-wider transition-colors",
                          isPreviewHighContrast 
                            ? "bg-black text-white" 
                            : "bg-zinc-900 text-white"
                        )}>
                          <th className="p-2 rounded-l">Désignation</th>
                          <th className="p-2 text-center">Quantité / Longueur</th>
                          <th className="p-2 text-right">Prix Unitaire</th>
                          <th className="p-2 text-center">TVA</th>
                          <th className="p-2 text-right">Total HT</th>
                          <th className="p-2 text-center rounded-r w-8 shrink-0"></th>
                        </tr>
                      </thead>
                      <tbody className={cn(
                        "divide-y text-[11px] transition-colors",
                        isPreviewHighContrast ? "divide-black" : "divide-zinc-100"
                      )}>
                        {aggregatedEquipment.map(item => {
                          const key = item.key;
                          if (excludedKeys.includes(key)) return null;

                          const price = customPrices[key] ?? item.unitPrice;
                          const qty = customQuantityOffsets[key] !== undefined ? customQuantityOffsets[key] : item.quantity;
                          const totalItemHT = price * qty;
                          return (
                            <tr key={key} className={cn(
                              "transition-colors group",
                              isPreviewHighContrast ? "hover:bg-zinc-100" : "hover:bg-zinc-50/80"
                            )}>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={customNames[key] !== undefined ? customNames[key] : resolveLabel(item.type, item.subType)}
                                  onChange={(e) => {
                                    const newName = e.target.value;
                                    setCustomNames(prev => ({ ...prev, [key]: newName }));
                                  }}
                                  className={cn(
                                    "w-full bg-transparent border border-transparent hover:border-zinc-300 focus:border-blue-500 font-semibold px-1 py-0.5 rounded outline-none transition-all text-[11px]",
                                    isPreviewHighContrast ? "text-black" : "text-zinc-900"
                                  )}
                                  title="Cliquez pour modifier la désignation"
                                />
                              </td>
                              <td className="p-1 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    value={qty}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setCustomQuantityOffsets(prev => ({ ...prev, [key]: val - item.quantity }));
                                    }}
                                    className={cn(
                                      "w-10 bg-transparent text-center border border-transparent hover:border-zinc-300 focus:border-blue-500 font-semibold rounded outline-none text-[11px]",
                                      isPreviewHighContrast ? "text-black" : "text-zinc-800"
                                    )}
                                    title="Modifier la quantité"
                                  />
                                  <span className={cn("text-[10px]", isPreviewHighContrast ? "text-black font-bold" : "text-zinc-500")}>u</span>
                                </div>
                              </td>
                              <td className="p-1 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={price}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setCustomPrices(prev => ({ ...prev, [key]: val }));
                                    }}
                                    className={cn(
                                      "w-20 bg-transparent text-right border border-transparent hover:border-zinc-300 focus:border-blue-500 font-semibold font-mono rounded outline-none text-[11px]",
                                      isPreviewHighContrast ? "text-black" : "text-zinc-800"
                                    )}
                                    title="Modifier le prix unitaire"
                                  />
                                  <span className={cn("text-[10px] font-sans", isPreviewHighContrast ? "text-black font-bold" : "text-zinc-500")}>{currency}</span>
                                </div>
                              </td>
                              <td className={cn(
                                "p-2 text-center font-sans",
                                isPreviewHighContrast ? "text-black font-bold" : "text-zinc-500"
                              )}>
                                {vatRate}%
                              </td>
                              <td className={cn(
                                "p-2 text-right font-semibold font-mono",
                                isPreviewHighContrast ? "text-black" : "text-zinc-900"
                              )}>
                                {formatNumber(totalItemHT)} {currency}
                              </td>
                              <td className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => setExcludedKeys(prev => [...prev, key])}
                                  className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Retirer cet article du devis"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Extra manual items */}
                        {extraItems.map(item => {
                          const totalItemHT = item.unitPrice * item.quantity;
                          return (
                            <tr key={item.id} className={cn(
                              "transition-colors group",
                              isPreviewHighContrast ? "hover:bg-zinc-100 border-b border-black" : "hover:bg-zinc-50/80 text-indigo-900"
                            )}>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={item.name}
                                  onChange={(e) => {
                                    const newName = e.target.value;
                                    setExtraItems(prev => prev.map(m => m.id === item.id ? { ...m, name: newName } : m));
                                  }}
                                  className={cn(
                                    "w-full bg-transparent border border-transparent hover:border-indigo-300 focus:border-indigo-500 font-semibold px-1 py-0.5 rounded outline-none transition-all text-[11px]",
                                    isPreviewHighContrast ? "text-black" : "text-indigo-950"
                                  )}
                                  title="Modifier la désignation"
                                />
                              </td>
                              <td className="p-1 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <input
                                    type="number"
                                    min="1"
                                    value={item.quantity}
                                    onChange={(e) => {
                                      const val = Math.max(1, parseInt(e.target.value) || 1);
                                      setExtraItems(prev => prev.map(m => m.id === item.id ? { ...m, quantity: val } : m));
                                    }}
                                    className={cn(
                                      "w-10 bg-transparent text-center border border-transparent hover:border-indigo-300 focus:border-indigo-500 font-semibold rounded outline-none text-[11px]",
                                      isPreviewHighContrast ? "text-black" : "text-indigo-950"
                                    )}
                                    title="Modifier la quantité"
                                  />
                                  <span className={cn("text-[10px]", isPreviewHighContrast ? "text-black font-bold" : "text-indigo-500")}>u</span>
                                </div>
                              </td>
                              <td className="p-1 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="500"
                                    value={item.unitPrice}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setExtraItems(prev => prev.map(m => m.id === item.id ? { ...m, unitPrice: val } : m));
                                    }}
                                    className={cn(
                                      "w-20 bg-transparent text-right border border-transparent hover:border-indigo-300 focus:border-indigo-500 font-semibold font-mono rounded outline-none text-[11px]",
                                      isPreviewHighContrast ? "text-black" : "text-indigo-950"
                                    )}
                                    title="Modifier le prix unitaire"
                                  />
                                  <span className={cn("text-[10px] font-sans", isPreviewHighContrast ? "text-black font-bold" : "text-indigo-500")}>{currency}</span>
                                </div>
                              </td>
                              <td className={cn(
                                "p-2 text-center font-sans",
                                isPreviewHighContrast ? "text-black font-bold" : "text-indigo-500"
                              )}>
                                {vatRate}%
                              </td>
                              <td className={cn(
                                "p-2 text-right font-semibold font-mono",
                                isPreviewHighContrast ? "text-black" : "text-indigo-950"
                              )}>
                                {formatNumber(totalItemHT)} {currency}
                              </td>
                              <td className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => handleRemoveExtraItem(item.id)}
                                  className="text-indigo-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Supprimer définitivement"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Cables */}
                        {aggregatedCables.map(cable => {
                          const key = `cable_${cable.typeId}`;
                          if (excludedKeys.includes(key)) return null;

                          const price = customCablePrices[cable.typeId] ?? cable.costPerMeter;
                          const length = customQuantityOffsets[key] !== undefined ? customQuantityOffsets[key] : cable.totalLength;
                          const totalCableHT = price * length;
                          return (
                            <tr key={cable.typeId} className={cn(
                              "transition-colors group",
                              isPreviewHighContrast ? "hover:bg-zinc-100 border-b border-black" : "hover:bg-zinc-50/80"
                            )}>
                              <td className="p-1">
                                <input
                                  type="text"
                                  value={customNames[key] !== undefined ? customNames[key] : `Câble : ${cable.name}`}
                                  onChange={(e) => {
                                    const newName = e.target.value;
                                    setCustomNames(prev => ({ ...prev, [key]: newName }));
                                  }}
                                  className={cn(
                                    "w-full bg-transparent border border-transparent hover:border-zinc-300 focus:border-blue-500 font-semibold px-1 py-0.5 rounded outline-none transition-all text-[11px]",
                                    isPreviewHighContrast ? "text-black" : "text-zinc-900"
                                  )}
                                  title="Cliquez pour modifier la désignation du câble"
                                />
                              </td>
                              <td className="p-1 text-center">
                                <div className="flex items-center justify-center gap-0.5">
                                  <input
                                    type="number"
                                    min="0"
                                    step="0.1"
                                    value={length.toFixed(1)}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseFloat(e.target.value) || 0);
                                      setCustomQuantityOffsets(prev => ({ ...prev, [key]: val - cable.totalLength }));
                                    }}
                                    className={cn(
                                      "w-14 bg-transparent text-center border border-transparent hover:border-zinc-300 focus:border-blue-500 font-semibold rounded outline-none text-[11px]",
                                      isPreviewHighContrast ? "text-black" : "text-zinc-800"
                                    )}
                                    title="Modifier la longueur du câble"
                                  />
                                  <span className={cn("text-[10px]", isPreviewHighContrast ? "text-black font-bold" : "text-zinc-500")}>m</span>
                                </div>
                              </td>
                              <td className="p-1 text-right">
                                <div className="flex items-center justify-end gap-1">
                                  <input
                                    type="number"
                                    min="0"
                                    step="50"
                                    value={price}
                                    onChange={(e) => {
                                      const val = Math.max(0, parseInt(e.target.value) || 0);
                                      setCustomCablePrices(prev => ({ ...prev, [cable.typeId]: val }));
                                    }}
                                    className={cn(
                                      "w-20 bg-transparent text-right border border-transparent hover:border-zinc-300 focus:border-blue-500 font-semibold font-mono rounded outline-none text-[11px]",
                                      isPreviewHighContrast ? "text-black" : "text-zinc-800"
                                    )}
                                    title="Modifier le prix au mètre"
                                  />
                                  <span className={cn("text-[10px] font-sans", isPreviewHighContrast ? "text-black font-bold" : "text-zinc-500")}>{currency}/m</span>
                                </div>
                              </td>
                              <td className={cn(
                                "p-2 text-center",
                                isPreviewHighContrast ? "text-black font-bold" : "text-zinc-500"
                              )}>
                                {vatRate}%
                              </td>
                              <td className={cn(
                                "p-2 text-right font-semibold font-mono",
                                isPreviewHighContrast ? "text-black" : "text-zinc-900"
                              )}>
                                {formatNumber(totalCableHT)} {currency}
                              </td>
                              <td className="p-1 text-center">
                                <button
                                  type="button"
                                  onClick={() => setExcludedKeys(prev => [...prev, key])}
                                  className="text-zinc-400 hover:text-red-500 hover:bg-red-50 p-1 rounded transition-colors cursor-pointer opacity-0 group-hover:opacity-100 focus:opacity-100"
                                  title="Retirer cette ligne du devis"
                                >
                                  <Trash2 size={12} />
                                </button>
                              </td>
                            </tr>
                          );
                        })}

                        {/* Labor Row */}
                        {laborRate > 0 && (
                          <tr className={cn(
                            "border-t-2 transition-all",
                            isPreviewHighContrast 
                              ? "bg-zinc-100 text-black border-black" 
                              : "bg-blue-50/30 text-blue-900 border-blue-100"
                          )}>
                            <td className="p-2 font-bold italic">
                              Main d'œuvre et Installation
                            </td>
                            <td className="p-2 text-center font-bold">
                              {laborRate}%
                            </td>
                            <td className={cn(
                              "p-2 text-right font-mono",
                              isPreviewHighContrast ? "text-black" : "text-blue-800"
                            )}>
                              {formatNumber(totals.totalHT)} {currency}
                            </td>
                            <td className={cn(
                              "p-2 text-center",
                              isPreviewHighContrast ? "text-black" : "text-blue-600"
                            )}>
                              {vatRate}%
                            </td>
                            <td className={cn(
                              "p-2 text-right font-bold font-mono",
                              isPreviewHighContrast ? "text-black underline decoration-black" : "text-blue-900"
                            )}>
                              {formatNumber(totals.laborCost)} {currency}
                            </td>
                            <td className="p-2"></td>
                          </tr>
                        )}

                        {aggregatedEquipment.filter(item => !excludedKeys.includes(item.key)).length === 0 && 
                         aggregatedCables.filter(cable => !excludedKeys.includes(`cable_${cable.typeId}`)).length === 0 && 
                         extraItems.length === 0 && (
                          <tr>
                            <td colSpan={6} className="p-4 text-center text-zinc-400 italic">
                              Aucun matériel ou câble sur le plan ou en supplément.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                 {/* Bottom Total Block & Footer */}
                <div className="space-y-4">
                  {/* Totals Box aligned right */}
                  <div className="flex justify-end">
                    <div className={cn(
                      "w-72 rounded-lg p-3 text-xs space-y-1.5 transition-all",
                      isPreviewHighContrast 
                        ? "bg-white border-2 border-black text-black" 
                        : "bg-zinc-50 border border-zinc-200/60"
                    )}>
                      <div className={cn("flex justify-between font-medium", isPreviewHighContrast ? "text-black" : "text-zinc-500")}>
                        <span>Matériel HT :</span>
                        <span className={cn("font-mono font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-800")}>{formatNumber(totals.totalHT)} {currency}</span>
                      </div>
                      <div className={cn("flex justify-between font-medium", isPreviewHighContrast ? "text-black" : "text-zinc-500")}>
                        <span>Main d'œuvre ({laborRate}%) :</span>
                        <span className={cn("font-mono font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-800")}>{formatNumber(totals.laborCost)} {currency}</span>
                      </div>
                      <div className={cn(
                        "flex justify-between font-bold border-t pt-1.5 transition-all",
                        isPreviewHighContrast ? "text-black border-black" : "text-zinc-800 border-zinc-200"
                      )}>
                        <span>Total HT :</span>
                        <span className="font-mono">{formatNumber(totals.finalTotalHT)} {currency}</span>
                      </div>
                      <div className={cn(
                        "flex justify-between font-medium pb-1.5 border-b transition-all",
                        isPreviewHighContrast ? "text-black border-black" : "text-zinc-500 border-zinc-200"
                      )}>
                        <span>TVA ({vatRate}%) :</span>
                        <span className={cn("font-mono font-bold", isPreviewHighContrast ? "text-black" : "text-zinc-800")}>{formatNumber(totals.totalVAT)} {currency}</span>
                      </div>
                      <div className={cn(
                        "flex justify-between font-black text-[13px] pt-1 transition-colors",
                        isPreviewHighContrast ? "text-black" : "text-zinc-900"
                      )}>
                        <span>TOTAL TTC :</span>
                        <span className={cn("font-mono", isPreviewHighContrast ? "text-black" : "text-blue-600")}>{formatNumber(totals.totalTTC)} {currency}</span>
                      </div>
                    </div>
                  </div>

                  {/* Disclaimer / Note mention */}
                  {footerNote && (
                    <div className={cn(
                      "text-[9px] leading-relaxed italic border-t pt-2 transition-colors",
                      isPreviewHighContrast ? "text-black border-black" : "text-zinc-500 border-zinc-150"
                    )}>
                      {footerNote}
                    </div>
                  )}

                  {/* Dynamic interactive payment info, stamp, and signature footer block */}
                  <div className={cn(
                    "grid grid-cols-3 gap-3 border-t pt-2.5 text-left transition-colors",
                    isPreviewHighContrast ? "border-black" : "border-zinc-150"
                  )}>
                    {/* Bank payment info */}
                    <div className={cn(
                      "text-[9px] space-y-1.5 transition-colors",
                      isPreviewHighContrast ? "text-black" : "text-zinc-600"
                    )}>
                      <p className={cn(
                        "font-bold uppercase text-[8px] tracking-wider transition-colors",
                        isPreviewHighContrast ? "text-black" : "text-zinc-900"
                      )}>Moyens de paiement</p>
                      <div className="flex gap-2 items-start">
                        <div className="space-y-1.5 leading-normal flex-1">
                          {paymentMethods.slice(0, 2).map((method, idx) => (
                            <div key={method.id} className="space-y-0.5">
                              <p className="font-bold text-[8.5px] uppercase">{method.provider} {method.type === 'mobile_money' ? '(Mobile Money)' : ''}</p>
                              <p><span className={cn("font-semibold", isPreviewHighContrast ? "text-black" : "text-zinc-400")}>Titulaire:</span> {method.accountName}</p>
                              <p className="font-mono"><span className={cn("font-semibold", isPreviewHighContrast ? "text-black" : "text-zinc-400")}>N°:</span> {method.accountNumber}</p>
                            </div>
                          ))}
                        </div>
                        {showQrCode && bankQrCode && (
                          <div className={cn(
                            "w-11 h-11 p-0.5 rounded border shrink-0 bg-white flex items-center justify-center shadow-xs",
                            isPreviewHighContrast ? "border-black" : "border-zinc-200"
                          )} title="Scanner pour le lien de la facture">
                            <img src={bankQrCode} alt="QR Code" className="w-full h-full object-contain" referrerPolicy="no-referrer" />
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Stamp slot */}
                    <div className="flex flex-col items-center justify-center">
                      <p className={cn(
                        "font-bold uppercase text-[8px] tracking-wider mb-1 transition-colors",
                        isPreviewHighContrast ? "text-black" : "text-zinc-400"
                      )}>Cachet / Tampon</p>
                      {stamp ? (
                        <div className={cn(
                          "relative group cursor-pointer w-20 h-16 border rounded p-1 flex items-center justify-center transition-all",
                          isPreviewHighContrast ? "bg-white border-black border-2" : "bg-zinc-50 border-zinc-200"
                        )} onClick={() => stampInputRef.current?.click()}>
                          <img src={stamp} alt="Cachet" className={cn(
                            "max-w-full max-h-full object-contain transition-all",
                            isPreviewHighContrast ? "opacity-100 grayscale contrast-150" : "opacity-80"
                          )} />
                          <div className="absolute inset-0 bg-black/40 text-white text-[8px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                            Changer
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={cn(
                            "cursor-pointer w-20 h-16 border border-dashed rounded hover:bg-zinc-50 flex flex-col items-center justify-center transition-all",
                            isPreviewHighContrast ? "border-black bg-white" : "border-zinc-200 hover:border-indigo-400 text-zinc-400"
                          )}
                          onClick={() => stampInputRef.current?.click()}
                        >
                          <Plus size={12} className={isPreviewHighContrast ? "text-black" : "text-zinc-400"} />
                          <span className={cn("text-[8px] font-bold uppercase tracking-wider mt-0.5", isPreviewHighContrast ? "text-black" : "text-zinc-400")}>Ajouter</span>
                        </div>
                      )}
                    </div>

                    {/* Signature slot */}
                    <div className="flex flex-col items-center justify-center">
                      <p className={cn(
                        "font-bold uppercase text-[8px] tracking-wider mb-1 transition-colors",
                        isPreviewHighContrast ? "text-black" : "text-zinc-400"
                      )}>Signature</p>
                      {signature ? (
                        <div className={cn(
                          "relative group cursor-pointer w-24 h-16 border rounded p-1 flex items-center justify-center transition-all",
                          isPreviewHighContrast ? "bg-white border-black border-2" : "bg-zinc-50 border-zinc-200"
                        )} onClick={() => signatureInputRef.current?.click()}>
                          <img src={signature} alt="Signature" className={cn(
                            "max-w-full max-h-full object-contain transition-all",
                            isPreviewHighContrast ? "opacity-100 grayscale contrast-150" : "opacity-80"
                          )} />
                          <div className="absolute inset-0 bg-black/40 text-white text-[8px] font-bold opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity rounded">
                            Changer
                          </div>
                        </div>
                      ) : (
                        <div 
                          className={cn(
                            "cursor-pointer w-24 h-16 border border-dashed rounded hover:bg-zinc-50 flex flex-col items-center justify-center transition-all",
                            isPreviewHighContrast ? "border-black bg-white" : "border-zinc-200 hover:border-violet-400 text-zinc-400"
                          )}
                          onClick={() => signatureInputRef.current?.click()}
                        >
                          <Plus size={12} className={isPreviewHighContrast ? "text-black" : "text-zinc-400"} />
                          <span className={cn("text-[8px] font-bold uppercase tracking-wider mt-0.5", isPreviewHighContrast ? "text-black" : "text-zinc-400")}>Ajouter</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Tiny disclaimer */}
                  <div className="border-t border-zinc-200 pt-2 text-[8px] text-zinc-400 leading-normal flex justify-between items-center">
                    <span>VoltPlan Solutions — Logiciel de modélisation électrique</span>
                    <span>Page 1 sur 1</span>
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Local Material Database manager ({currency}) */}
        {activeTab === 'DATABASE' && (
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden p-6 space-y-6 transition-colors duration-300",
            theme === 'dark' ? "bg-zinc-950" : "bg-white"
          )}>
            <div className={cn(
              "flex flex-col md:flex-row gap-4 items-center justify-between border-b pb-4 shrink-0 transition-colors duration-300",
              theme === 'dark' ? "border-zinc-800" : "border-zinc-200"
            )}>
              <div>
                <h3 className={cn(
                  "text-base font-bold flex items-center gap-2 transition-colors duration-300",
                  theme === 'dark' ? "text-white" : "text-zinc-900"
                )}>
                  <Database className="text-blue-500" size={18} />
                  Base de Données Matérielle locale ({currency})
                </h3>
                <p className="text-xs text-zinc-400 mt-1">
                  Gérez ici les prix unitaires par défaut et ajoutez de nouveaux équipements à votre bibliothèque de planification.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setMaterialDatabase(DEFAULT_MATERIAL_DB);
                  }}
                  className={cn(
                    "flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg cursor-pointer transition-colors",
                    theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700 hover:text-zinc-900"
                  )}
                >
                  <RotateCcw size={14} />
                  Réinitialiser d'origine
                </button>
              </div>
            </div>

            {/* Grid for Database Layout: Left side is list/editor, Right side is "Add new article" */}
            <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
              
              {/* Left Side: Materials List & Editor */}
              <div className={cn(
                "flex-1 flex flex-col overflow-hidden border rounded-xl p-4 space-y-4 transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/20 border-zinc-800/80" : "bg-zinc-50 border-zinc-200"
              )}>
                <div className="flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
                  <div className="relative w-full sm:w-72">
                    <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                    <input
                      type="text"
                      placeholder="Rechercher par nom, ID ou description..."
                      value={dbSearchQuery}
                      onChange={(e) => setDbSearchQuery(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs pl-9 pr-3 py-2 outline-none focus:border-blue-500 transition-colors",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <select
                      value={dbCategoryFilter}
                      onChange={(e) => setDbCategoryFilter(e.target.value)}
                      className={cn(
                        "text-xs rounded-lg border px-3 py-2 outline-none focus:border-blue-500 w-full sm:w-auto cursor-pointer transition-colors",
                        theme === 'dark' ? "bg-zinc-950 text-zinc-300 border-zinc-800" : "bg-white text-zinc-700 border-zinc-300"
                      )}
                    >
                      <option value="ALL">Toutes les catégories</option>
                      <option value="CCTV">CCTV (Surveillance)</option>
                      <option value="WIFI">WIFI (Réseau Sans-fil)</option>
                      <option value="NETWORK">NETWORK (Réseau Filaire)</option>
                      <option value="FIRE">FIRE (Sécurité Incendie)</option>
                      <option value="SECURITY">SECURITY (Sécurité & Accès)</option>
                      <option value="MULTIMEDIA">MULTIMÉDIA (Écrans & Affichage)</option>
                    </select>
                  </div>
                </div>

                {/* Database Table */}
                <div className="flex-1 overflow-y-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className={cn(
                        "font-bold uppercase tracking-wider text-[9px] border-b transition-colors duration-300",
                        theme === 'dark' ? "bg-zinc-900 text-zinc-400 border-zinc-800" : "bg-zinc-100 text-zinc-500 border-zinc-200"
                      )}>
                        <th className="p-3">Désignation</th>
                        <th className="p-3">Identifiant ID</th>
                        <th className="p-3">Catégorie</th>
                        <th className="p-3">Description</th>
                        <th className="p-3 text-right">Prix Unitaire par défaut</th>
                        <th className="p-3 text-center">Actions</th>
                      </tr>
                    </thead>
                    <tbody className={cn(
                      "divide-y transition-colors duration-300",
                      theme === 'dark' ? "divide-zinc-800" : "divide-zinc-200"
                    )}>
                      {filteredDbMaterials.map((item) => (
                        <tr key={item.id} className={cn(
                          "transition-colors",
                          theme === 'dark' ? "hover:bg-zinc-800/20" : "hover:bg-zinc-50"
                        )}>
                          <td className={cn(
                            "p-3 font-semibold transition-colors",
                            theme === 'dark' ? "text-white" : "text-zinc-900"
                          )}>
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => {
                                const newName = e.target.value;
                                setMaterialDatabase(prev => prev.map(m => m.id === item.id ? { ...m, name: newName } : m));
                              }}
                              className={cn(
                                "border-b border-transparent hover:border-zinc-700 outline-none w-full font-semibold rounded transition-all",
                                theme === 'dark' ? "bg-transparent text-white focus:bg-zinc-950 focus:px-1.5 focus:py-0.5" : "bg-transparent text-zinc-900 focus:bg-zinc-100 focus:px-1.5 focus:py-0.5"
                              )}
                            />
                          </td>
                          <td className="p-3 font-mono text-[11px] text-zinc-500">
                            {item.id}
                          </td>
                          <td className="p-3">
                            <span className={cn(
                              "px-2 py-0.5 text-[9px] rounded font-bold uppercase border transition-colors",
                              theme === 'dark' ? "bg-zinc-800 border-zinc-700 text-zinc-300" : "bg-zinc-100 border-zinc-300 text-zinc-600"
                            )}>
                              {item.category}
                            </span>
                          </td>
                          <td className="p-3 text-zinc-400">
                            <input
                              type="text"
                              value={item.description || ''}
                              onChange={(e) => {
                                const newDesc = e.target.value;
                                setMaterialDatabase(prev => prev.map(m => m.id === item.id ? { ...m, description: newDesc } : m));
                              }}
                              className={cn(
                                "text-xs border-b border-transparent hover:border-zinc-700 outline-none w-full rounded transition-all",
                                theme === 'dark' ? "bg-transparent text-zinc-400 focus:bg-zinc-950 focus:px-1.5 focus:py-0.5" : "bg-transparent text-zinc-600 focus:bg-zinc-100 focus:px-1.5 focus:py-0.5"
                              )}
                            />
                          </td>
                          <td className="p-3 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <input
                                type="number"
                                min="0"
                                step="100"
                                value={item.price}
                                onChange={(e) => {
                                  const newPrice = Math.max(0, parseInt(e.target.value) || 0);
                                  setMaterialDatabase(prev => prev.map(m => m.id === item.id ? { ...m, price: newPrice } : m));
                                }}
                                className={cn(
                                  "w-28 text-right font-mono text-xs rounded border px-2 py-1 outline-none focus:border-blue-500 transition-colors",
                                  theme === 'dark' ? "bg-zinc-950 text-white border-zinc-800" : "bg-white text-zinc-900 border-zinc-300"
                                )}
                              />
                              <span className="text-zinc-500 text-[10px] font-bold">{currency}</span>
                            </div>
                          </td>
                          <td className="p-3 text-center">
                            {/* Standard items shouldn't be deleted so we prevent it for default types, but let users delete custom ones */}
                            {!DEFAULT_MATERIAL_DB.some(d => d.id === item.id) ? (
                              <button
                                type="button"
                                onClick={() => {
                                  setMaterialDatabase(prev => prev.filter(m => m.id !== item.id));
                                }}
                                className="text-zinc-500 hover:text-red-500 p-1 rounded hover:bg-red-500/10 transition-all cursor-pointer"
                                title="Supprimer cet article"
                              >
                                <Trash2 size={14} />
                              </button>
                            ) : (
                              <span className="text-zinc-600 text-[10px] italic">Système</span>
                            )}
                          </td>
                        </tr>
                      ))}
                      {filteredDbMaterials.length === 0 && (
                        <tr>
                          <td colSpan={6} className="p-6 text-center text-zinc-500 italic">
                            Aucun matériel trouvé dans la base de données.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Right Side: Add New Article Form */}
              <div className={cn(
                "w-full lg:w-80 border rounded-xl p-4 space-y-4 shrink-0 h-fit transition-colors duration-300",
                theme === 'dark' ? "bg-zinc-900/60 border-zinc-800/80" : "bg-zinc-100 border-zinc-200"
              )}>
                <div className="flex items-center gap-2 text-blue-400 font-semibold text-xs uppercase tracking-wider">
                  <Plus size={14} /> Nouvel Article de Base
                </div>
                
                <form onSubmit={handleAddNewDbMaterial} className="space-y-3">
                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Identifiant Unique (ID)</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: CCTV_4K_VARIFOCAL"
                      value={newDbId}
                      onChange={(e) => setNewDbId(e.target.value.toUpperCase().replace(/\s+/g, '_'))}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-blue-500 font-mono mt-1 transition-colors",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Nom du Matériel</label>
                    <input
                      type="text"
                      required
                      placeholder="ex: Caméra Bullet 4K Extérieure"
                      value={newDbName}
                      onChange={(e) => setNewDbName(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-blue-500 mt-1 transition-colors",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Catégorie</label>
                    <select
                      value={newDbCategory}
                      onChange={(e) => setNewDbCategory(e.target.value)}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-blue-500 mt-1 cursor-pointer transition-colors",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    >
                      <option value="CCTV">CCTV (Surveillance)</option>
                      <option value="WIFI">WIFI (Réseau Sans-fil)</option>
                      <option value="NETWORK">NETWORK (Réseau Filaire)</option>
                      <option value="FIRE">FIRE (Sécurité Incendie)</option>
                      <option value="SECURITY">SECURITY (Sécurité & Accès)</option>
                      <option value="MULTIMEDIA">MULTIMÉDIA (Écrans & Affichage)</option>
                      <option value="OTHER">AUTRE (Fournitures divers)</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Prix Unitaire ({currency})</label>
                    <input
                      type="number"
                      required
                      min="0"
                      placeholder="ex: 125000"
                      value={newDbPrice || ''}
                      onChange={(e) => setNewDbPrice(parseInt(e.target.value) || 0)}
                      className={cn(
                        "w-full border rounded-lg font-mono text-xs px-3 py-2 outline-none focus:border-blue-500 mt-1 transition-colors",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>

                  <div>
                    <label className="text-[10px] text-zinc-500 font-bold uppercase">Description</label>
                    <textarea
                      placeholder="ex: Capteur Sony 8MP, IR 50m..."
                      value={newDbDesc}
                      onChange={(e) => setNewDbDesc(e.target.value)}
                      rows={2}
                      className={cn(
                        "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-blue-500 mt-1 resize-none transition-colors",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                      )}
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold py-2 px-4 rounded-lg shadow-lg shadow-blue-500/10 cursor-pointer transition-all active:scale-95"
                  >
                    <Plus size={14} /> Ajouter à la Base
                  </button>
                </form>
              </div>

            </div>
          </div>
        )}

        {/* Tab 6: Dashboard */}
        {activeTab === 'DASHBOARD' && (
          <div className={cn(
            "flex-1 overflow-y-auto transition-colors duration-300 p-6",
            theme === 'dark' ? "bg-zinc-950" : "bg-white"
          )}>
            <AdminDashboard />
          </div>
        )}

        {/* Tab 5: History */}
        {activeTab === 'HISTORY' && (
          <div className={cn(
            "flex-1 overflow-y-auto p-6 space-y-6 transition-colors duration-300",
            theme === 'dark' ? "bg-zinc-950" : "bg-white"
          )}>
            <div className={cn(
              "flex items-center gap-3 border-b pb-4 transition-colors duration-300",
              theme === 'dark' ? "border-zinc-800" : "border-zinc-200"
            )}>
              <div className="w-10 h-10 rounded-xl bg-blue-500/20 flex items-center justify-center">
                <RotateCcw size={20} className="text-blue-500" />
              </div>
              <div>
                <h2 className={cn(
                  "text-xl font-bold transition-colors",
                  theme === 'dark' ? "text-white" : "text-zinc-900"
                )}>Historique des Factures</h2>
                <p className="text-sm text-zinc-500">Retrouvez et restaurez vos factures précédemment générées.</p>
              </div>
            </div>

            {invoiceHistory.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                <FileText size={48} className="mb-4 opacity-20" />
                <p>Aucune facture sauvegardée dans l'historique.</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Search and Filters panel */}
                <div className={cn(
                  "p-4 rounded-xl border flex flex-col md:flex-row gap-4 items-end transition-all duration-300",
                  theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                )}>
                  {/* Search */}
                  <div className="flex-1 w-full space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Recherche</label>
                    <div className="relative">
                      <Search className="absolute left-3 top-2.5 text-zinc-500" size={16} />
                      <input
                        type="text"
                        placeholder="N° Facture, Nom du client..."
                        value={historySearch}
                        onChange={(e) => setHistorySearch(e.target.value)}
                        className={cn(
                          "w-full pl-9 pr-4 py-2 text-xs font-medium border rounded-lg outline-none transition-colors",
                          theme === 'dark' 
                            ? "bg-zinc-950 border-zinc-800 text-white focus:border-blue-500" 
                            : "bg-white border-zinc-300 text-zinc-950 focus:border-blue-500"
                        )}
                      />
                    </div>
                  </div>

                  {/* Client filter */}
                  <div className="w-full md:w-48 space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Client</label>
                    <select
                      value={historyClient}
                      onChange={(e) => setHistoryClient(e.target.value)}
                      className={cn(
                        "w-full px-3 py-2 text-xs font-semibold border rounded-lg outline-none cursor-pointer transition-colors",
                        theme === 'dark'
                          ? "bg-zinc-950 border-zinc-800 text-zinc-300 focus:border-blue-500"
                          : "bg-white border-zinc-300 text-zinc-700 focus:border-blue-500"
                      )}
                    >
                      <option value="ALL">Tous les clients</option>
                      {uniqueClientsInHistory.map((c, idx) => (
                        <option key={idx} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  {/* Date Start */}
                  <div className="w-full md:w-36 space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Du (Date)</label>
                    <input
                      type="date"
                      value={historyStartDate}
                      onChange={(e) => setHistoryStartDate(e.target.value)}
                      className={cn(
                        "w-full px-3 py-1.5 text-xs font-medium border rounded-lg outline-none transition-colors",
                        theme === 'dark'
                          ? "bg-zinc-950 border-zinc-800 text-white focus:border-blue-500"
                          : "bg-white border-zinc-300 text-zinc-950 focus:border-blue-500"
                      )}
                    />
                  </div>

                  {/* Date End */}
                  <div className="w-full md:w-36 space-y-1.5">
                    <label className="text-[10px] text-zinc-500 font-bold uppercase tracking-wide">Au (Date)</label>
                    <input
                      type="date"
                      value={historyEndDate}
                      onChange={(e) => setHistoryEndDate(e.target.value)}
                      className={cn(
                        "w-full px-3 py-1.5 text-xs font-medium border rounded-lg outline-none transition-colors",
                        theme === 'dark'
                          ? "bg-zinc-950 border-zinc-800 text-white focus:border-blue-500"
                          : "bg-white border-zinc-300 text-zinc-950 focus:border-blue-500"
                      )}
                    />
                  </div>

                  {/* Reset button */}
                  {(historySearch || historyClient !== 'ALL' || historyStartDate || historyEndDate) && (
                    <button
                      onClick={() => {
                        setHistorySearch('');
                        setHistoryClient('ALL');
                        setHistoryStartDate('');
                        setHistoryEndDate('');
                        showToast('Filtres de recherche réinitialisés', 'info');
                      }}
                      className="w-full md:w-auto px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg transition-colors flex items-center justify-center gap-1 cursor-pointer shrink-0"
                      title="Réinitialiser les filtres"
                    >
                      <X size={14} /> Effacer
                    </button>
                  )}
                </div>

                {filteredInvoiceHistory.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-20 text-zinc-500">
                    <Search size={48} className="mb-4 opacity-20" />
                    <p>Aucun document ne correspond à vos filtres de recherche.</p>
                    <button
                      onClick={() => {
                        setHistorySearch('');
                        setHistoryClient('ALL');
                        setHistoryStartDate('');
                        setHistoryEndDate('');
                      }}
                      className="mt-4 text-xs font-bold text-blue-500 hover:underline cursor-pointer"
                    >
                      Réinitialiser les filtres
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredInvoiceHistory.map((invoice) => (
                      <div key={invoice.id} className={cn(
                        "border rounded-xl p-4 flex flex-col gap-3 transition-all",
                        theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200 hover:shadow-md"
                      )}>
                        <div className="flex justify-between items-start">
                          <div>
                            <div className={cn(
                              "font-bold text-lg transition-colors",
                              theme === 'dark' ? "text-white" : "text-zinc-900"
                            )}>{invoice.invoiceRef}</div>
                            <div className="text-xs text-zinc-500 mt-1">{invoice.clientName}</div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <div className="text-xs font-mono text-zinc-400 bg-black/5 px-2 py-1 rounded">
                              {invoice.date}
                            </div>
                            <span className={cn(
                              "px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-wider",
                              invoice.status === 'VALIDATED' ? "bg-emerald-500/20 text-emerald-400" :
                              invoice.status === 'REFUSED' ? "bg-red-500/20 text-red-400" :
                              "bg-amber-500/20 text-amber-400"
                            )}>
                              {invoice.status === 'VALIDATED' ? 'Validée' : 
                               invoice.status === 'REFUSED' ? 'Rejetée' : 'En attente'}
                            </span>
                          </div>
                        </div>
                        
                        <div className="flex-1 mt-2">
                          <div className={cn(
                            "text-xl font-black transition-colors",
                            theme === 'dark' ? "text-blue-400" : "text-blue-600"
                          )}>
                            {formatNumber(invoice.totalTTC)} {invoice.currency}
                          </div>
                        </div>

                        <div className="flex gap-2 mt-2 pt-3 border-t border-black/5">
                          <button 
                            onClick={() => loadInvoiceFromHistory(invoice)}
                            className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-2 rounded-lg transition-colors"
                          >
                            Restaurer
                          </button>
                          <button 
                            onClick={() => deleteInvoiceFromHistory(invoice.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500/20 text-red-500 rounded-lg transition-colors"
                            title="Supprimer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Tab 4: Project Settings */}
        {activeTab === 'SETTINGS' && (
          <div className={cn(
            "flex-1 flex flex-col overflow-hidden p-6 space-y-6 transition-colors duration-300",
            theme === 'dark' ? "bg-zinc-950" : "bg-white"
          )}>
            <div className={cn(
              "flex items-center gap-3 border-b pb-4 shrink-0 transition-colors duration-300",
              theme === 'dark' ? "border-zinc-800" : "border-zinc-200"
            )}>
              <div className="p-2 bg-blue-500/10 rounded-lg">
                <Settings2 className="text-blue-500" size={24} />
              </div>
              <div className="flex-1">
                <h3 className={cn(
                  "text-lg font-bold transition-colors",
                  theme === 'dark' ? "text-white" : "text-zinc-900"
                )}>Paramètres du Projet & En-têtes</h3>
                <p className="text-xs text-zinc-400">Configurez les informations qui apparaîtront sur vos factures et devis PDF.</p>
              </div>

              <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-lg">
                <button
                  onClick={() => setSettingsTab('GENERAL')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer",
                    settingsTab === 'GENERAL' 
                      ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  Général
                </button>
                <button
                  onClick={() => setSettingsTab('LOGS')}
                  className={cn(
                    "px-4 py-1.5 rounded-md text-sm font-semibold transition-all cursor-pointer",
                    settingsTab === 'LOGS' 
                      ? "bg-white dark:bg-zinc-800 text-blue-600 dark:text-blue-400 shadow-sm" 
                      : "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300"
                  )}
                >
                  Historique d'Export
                </button>
              </div>
            </div>

            {settingsTab === 'GENERAL' ? (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                
                {/* Company Section */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center gap-2 font-bold text-sm uppercase tracking-wider pb-2 border-b transition-colors",
                    theme === 'dark' ? "text-zinc-300 border-zinc-800" : "text-zinc-700 border-zinc-200"
                  )}>
                    <Building2 size={16} className="text-blue-500" />
                    Informations de l'Entreprise (Émetteur)
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Nom de l'Entreprise</label>
                      <input
                        type="text"
                        value={companyName}
                        onChange={(e) => setCompanyName(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        )}
                        placeholder="ex: SOCIETE MURASH"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Adresse du Siège</label>
                      <input
                        type="text"
                        value={companyAddress}
                        onChange={(e) => setCompanyAddress(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        )}
                        placeholder="Adresse complète..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Téléphone</label>
                        <input
                          type="text"
                          value={companyPhone}
                          onChange={(e) => setCompanyPhone(e.target.value)}
                          className={cn(
                            "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                            theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">E-mail</label>
                        <input
                          type="email"
                          value={companyEmail}
                          onChange={(e) => setCompanyEmail(e.target.value)}
                          className={cn(
                            "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                            theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                          )}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">N° RCCM</label>
                        <input
                          type="text"
                          value={companyRccm}
                          onChange={(e) => setCompanyRccm(e.target.value)}
                          className={cn(
                            "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                            theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                          )}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">NIF</label>
                        <input
                          type="text"
                          value={companyNif}
                          onChange={(e) => setCompanyNif(e.target.value)}
                          className={cn(
                            "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                            theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                          )}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Client & Project Section */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center gap-2 font-bold text-sm uppercase tracking-wider pb-2 border-b transition-colors",
                    theme === 'dark' ? "text-zinc-300 border-zinc-800" : "text-zinc-700 border-zinc-200"
                  )}>
                    <User size={16} className="text-blue-500" />
                    Informations du Client & Projet
                  </div>
                  
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-1.5">
                      <div className="flex justify-between items-center">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Nom du Client</label>
                        {quickClients.length > 0 && (
                          <select
                            onChange={(e) => {
                              const selected = quickClients.find(c => c.id === e.target.value);
                              if (selected) {
                                setClientName(selected.name);
                                setClientAddress(selected.address);
                              }
                            }}
                            className={cn(
                              "text-[10px] font-semibold border rounded px-1.5 py-0.5 outline-none max-w-[200px] cursor-pointer",
                              theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-zinc-300" : "bg-white border-zinc-200 text-zinc-600"
                            )}
                            value=""
                          >
                            <option value="" disabled>⚡ Sélectionner un client...</option>
                            {quickClients.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        )}
                      </div>
                      <input
                        type="text"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        )}
                        placeholder="ex: GVA - CANALBOX TOGO"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Adresse / Contact Client</label>
                      <textarea
                        value={clientAddress}
                        onChange={(e) => setClientAddress(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors resize-none",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        )}
                        rows={3}
                        placeholder="E-mail, téléphone, adresse..."
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase flex items-center gap-1">
                        <MapPin size={10} /> Lieu d'exécution du Projet
                      </label>
                      <input
                        type="text"
                        value={projectLocation}
                        onChange={(e) => setProjectLocation(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        )}
                        placeholder="ex: Lomé, Togo"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Objet / Description du Projet</label>
                      <input
                        type="text"
                        value={invoiceDescription}
                        onChange={(e) => setInvoiceDescription(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        )}
                        placeholder="ex: Installation de systèmes CCTV..."
                      />
                    </div>
                  </div>
                </div>

                {/* Assets / Branding Section */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center gap-2 font-bold text-sm uppercase tracking-wider pb-2 border-b transition-colors",
                    theme === 'dark' ? "text-zinc-300 border-zinc-800" : "text-zinc-700 border-zinc-200"
                  )}>
                    <Search size={16} className="text-blue-500" />
                    Identité Visuelle & Cachets
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block text-center">Logo Entreprise</label>
                      <div 
                        onClick={() => logoInputRef.current?.click()}
                        className={cn(
                          "aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden p-2",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50" : "bg-zinc-50 border-zinc-300 hover:bg-zinc-100"
                        )}
                      >
                        {logo ? <img src={logo} className="w-full h-full object-contain" alt="Logo" /> : <Building2 className="text-zinc-700" size={32} />}
                      </div>
                      <input type="file" ref={logoInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setLogo)} />
                      {logo && <button onClick={() => setLogo(null)} className="w-full text-[9px] text-red-500 hover:underline">Supprimer</button>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block text-center">Tampon / Cachet</label>
                      <div 
                        onClick={() => stampInputRef.current?.click()}
                        className={cn(
                          "aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden p-2",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50" : "bg-zinc-50 border-zinc-300 hover:bg-zinc-100"
                        )}
                      >
                        {stamp ? <img src={stamp} className="w-full h-full object-contain" alt="Stamp" /> : <div className="w-12 h-12 rounded-full border-4 border-zinc-700 flex items-center justify-center text-zinc-700 font-bold">STAMP</div>}
                      </div>
                      <input type="file" ref={stampInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setStamp)} />
                      {stamp && <button onClick={() => setStamp(null)} className="w-full text-[9px] text-red-500 hover:underline">Supprimer</button>}
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase block text-center">Signature</label>
                      <div 
                        onClick={() => signatureInputRef.current?.click()}
                        className={cn(
                          "aspect-square border-2 border-dashed rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-blue-500/50 transition-all overflow-hidden p-2",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 hover:bg-zinc-800/50" : "bg-zinc-50 border-zinc-300 hover:bg-zinc-100"
                        )}
                      >
                        {signature ? <img src={signature} className="w-full h-full object-contain" alt="Signature" /> : <div className="text-zinc-700 italic font-serif text-xl select-none">Signature</div>}
                      </div>
                      <input type="file" ref={signatureInputRef} className="hidden" accept="image/*" onChange={(e) => handleImageUpload(e, setSignature)} />
                      {signature && <button onClick={() => setSignature(null)} className="w-full text-[9px] text-red-500 hover:underline">Supprimer</button>}
                    </div>
                  </div>
                </div>

                {/* Bank Details Section */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center justify-between font-bold text-sm uppercase tracking-wider pb-2 border-b transition-colors",
                    theme === 'dark' ? "text-zinc-300 border-zinc-800" : "text-zinc-700 border-zinc-200"
                  )}>
                    <div className="flex items-center gap-2">
                      <Coins size={16} className="text-blue-500" />
                      Moyens de Paiement Par Défaut
                    </div>
                    <button
                      onClick={() => {
                        setPaymentMethods([
                          ...paymentMethods,
                          { id: crypto.randomUUID(), type: 'mobile_money', provider: '', accountName: '', accountNumber: '' }
                        ]);
                      }}
                      className="text-xs bg-indigo-500/10 text-indigo-500 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      + Ajouter
                    </button>
                  </div>
                  <div className="space-y-4">
                    {paymentMethods.map((method, index) => (
                      <div key={method.id} className={cn(
                        "relative border rounded-xl p-4 transition-colors",
                        theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                      )}>
                        <button
                          onClick={() => setPaymentMethods(paymentMethods.filter(m => m.id !== method.id))}
                          className="absolute top-3 right-3 text-red-500 hover:text-red-600 transition-colors"
                          title="Supprimer ce moyen"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-2 gap-4 mb-3 pr-8">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Type</label>
                            <select
                              value={method.type}
                              onChange={(e) => {
                                const newMethods = [...paymentMethods];
                                newMethods[index].type = e.target.value;
                                setPaymentMethods(newMethods);
                              }}
                              className={cn(
                                "w-full border rounded-lg text-sm px-4 py-2 outline-none focus:border-blue-500 transition-colors",
                                theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                              )}
                            >
                              <option value="bank">Banque</option>
                              <option value="mobile_money">Mobile Money</option>
                              <option value="other">Autre</option>
                            </select>
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Fournisseur</label>
                            <input
                              type="text"
                              value={method.provider}
                              onChange={(e) => {
                                const newMethods = [...paymentMethods];
                                newMethods[index].provider = e.target.value;
                                setPaymentMethods(newMethods);
                              }}
                              placeholder="ex: TMoney, ECOBANK"
                              className={cn(
                                "w-full border rounded-lg text-sm px-4 py-2 outline-none focus:border-blue-500 transition-colors",
                                theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                              )}
                            />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Titulaire du Compte</label>
                            <input
                              type="text"
                              value={method.accountName}
                              onChange={(e) => {
                                const newMethods = [...paymentMethods];
                                newMethods[index].accountName = e.target.value;
                                setPaymentMethods(newMethods);
                              }}
                              className={cn(
                                "w-full border rounded-lg text-sm px-4 py-2 outline-none focus:border-blue-500 transition-colors",
                                theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                              )}
                            />
                          </div>
                          <div className="space-y-1.5">
                            <label className="text-[10px] text-zinc-500 font-bold uppercase">Numéro / RIB</label>
                            <input
                              type="text"
                              value={method.accountNumber}
                              onChange={(e) => {
                                const newMethods = [...paymentMethods];
                                newMethods[index].accountNumber = e.target.value;
                                setPaymentMethods(newMethods);
                              }}
                              className={cn(
                                "w-full border rounded-lg text-sm px-4 py-2 outline-none focus:border-blue-500 transition-colors font-mono",
                                theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                              )}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                    {paymentMethods.length === 0 && (
                      <div className="text-sm text-zinc-500 italic py-4 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
                        Aucun moyen de paiement configuré.
                      </div>
                    )}
                    
                    <div className="flex items-center justify-between border-t pt-3 mt-1 border-dashed border-zinc-200">
                      <span className="text-[10px] text-zinc-500 font-bold uppercase">QR Code de Lien Facture</span>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={showQrCode}
                          onChange={(e) => setShowQrCode(e.target.checked)}
                          className="sr-only peer"
                        />
                        <div className="w-9 h-5 bg-zinc-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-zinc-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
                        <span className="ml-2 text-xs font-medium text-zinc-500">Activer</span>
                      </label>
                    </div>
                    {showQrCode && bankQrCode && (
                      <div className={cn(
                        "flex flex-col items-center gap-2 p-3 rounded-lg border border-dashed text-center mt-2",
                        theme === 'dark' ? "bg-zinc-950 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                      )}>
                        <div className="bg-white p-2 rounded-lg shadow-xs border border-zinc-100 flex items-center justify-center">
                          <img src={bankQrCode} alt="Aperçu QR Code" className="w-24 h-24 object-contain" referrerPolicy="no-referrer" />
                        </div>
                        <p className={cn(
                          "text-[10px] leading-relaxed max-w-[240px]",
                          theme === 'dark' ? "text-zinc-400" : "text-zinc-500"
                        )}>
                          Généré automatiquement : Ce QR code intègre votre RIB, le titulaire et le montant total ({formatNumber(totals.totalTTC)} {currency}) pour un paiement instantané par votre client.
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Footer Configuration Section */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center gap-2 font-bold text-sm uppercase tracking-wider pb-2 border-b transition-colors",
                    theme === 'dark' ? "text-zinc-300 border-zinc-800" : "text-zinc-700 border-zinc-200"
                  )}>
                    <Info size={16} className="text-blue-500" />
                    Pied de Page de la Facture
                  </div>
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] text-zinc-500 font-bold uppercase">Note / Mention de bas de page</label>
                      <textarea
                        value={footerNote}
                        onChange={(e) => setFooterNote(e.target.value)}
                        className={cn(
                          "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors resize-none",
                          theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                        )}
                        rows={3}
                        placeholder="ex: Conditions de paiement, validité de l'offre..."
                      />
                      <p className="text-[10px] text-zinc-500 italic leading-tight">
                        Cette note apparaîtra juste au-dessus des coordonnées légales de l'entreprise en bas de page du PDF.
                      </p>
                    </div>
                  </div>
                </div>

                {/* PDF Protection & Watermark Section */}
                <div className="space-y-4">
                  <div className={cn(
                    "flex items-center gap-2 font-bold text-sm uppercase tracking-wider pb-2 border-b transition-colors",
                    theme === 'dark' ? "text-zinc-300 border-zinc-800" : "text-zinc-700 border-zinc-200"
                  )}>
                    <FileText size={16} className="text-blue-500" />
                    Protection & Filigrane PDF
                  </div>
                  <div className="space-y-4">
                    {/* High Contrast Preview Toggle */}
                    <div className={cn(
                      "flex items-center justify-between p-3 border rounded-lg transition-colors",
                      theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                    )}>
                      <div className="space-y-0.5">
                        <label className={cn(
                          "text-sm font-semibold transition-colors",
                          theme === 'dark' ? "text-white" : "text-zinc-900"
                        )}>Mode Aperçu Haute Contraste</label>
                        <p className="text-[10px] text-zinc-500">Simule un rendu d'impression noir et blanc (Aperçu uniquement).</p>
                      </div>
                      <button
                        onClick={() => setIsPreviewHighContrast(!isPreviewHighContrast)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          isPreviewHighContrast ? 'bg-amber-600' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            isPreviewHighContrast ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className={cn(
                      "flex items-center justify-between p-3 border rounded-lg transition-colors",
                      theme === 'dark' ? "bg-zinc-900/50 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                    )}>
                      <div className="space-y-0.5">
                        <label className={cn(
                          "text-sm font-semibold transition-colors",
                          theme === 'dark' ? "text-white" : "text-zinc-900"
                        )}>Activer le Filigrane</label>
                        <p className="text-[10px] text-zinc-500">Ajoute un texte en arrière-plan du document PDF.</p>
                      </div>
                      <button
                        onClick={() => setShowWatermark(!showWatermark)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${
                          showWatermark ? 'bg-blue-600' : 'bg-zinc-700'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            showWatermark ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    {showWatermark && (
                      <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2 duration-300">
                        <label className="text-[10px] text-zinc-500 font-bold uppercase">Texte du Filigrane</label>
                        <input
                          type="text"
                          value={watermarkText}
                          onChange={(e) => setWatermarkText(e.target.value)}
                          className={cn(
                            "w-full border rounded-lg text-sm px-4 py-2.5 outline-none focus:border-blue-500 transition-colors",
                            theme === 'dark' ? "bg-zinc-900 border-zinc-800 text-white" : "bg-white border-zinc-200 text-zinc-900"
                          )}
                          placeholder="ex: BROUILLON, CONFIDENTIEL..."
                        />
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
            ) : (
              <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h4 className={cn("font-bold", theme === 'dark' ? "text-white" : "text-zinc-900")}>Historique des Exports PDF</h4>
                  <p className="text-xs text-zinc-500">{exportLogs.length} export(s)</p>
                </div>
                
                {exportLogs.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-zinc-500">
                    <Download size={40} className="opacity-20 mb-3" />
                    <p>Aucun export PDF n'a été généré.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {exportLogs.map(log => (
                      <div key={log.id} className={cn(
                        "p-4 rounded-xl border flex items-center justify-between transition-colors",
                        theme === 'dark' ? "bg-zinc-900 border-zinc-800" : "bg-zinc-50 border-zinc-200"
                      )}>
                        <div>
                          <div className={cn("font-bold", theme === 'dark' ? "text-white" : "text-zinc-900")}>
                            {log.invoiceRef} - {log.clientName}
                          </div>
                          <div className="text-xs text-zinc-500 mt-1 flex items-center gap-2">
                            <span className="font-mono bg-black/5 px-1.5 py-0.5 rounded">{new Date(log.timestamp).toLocaleString('fr-FR')}</span>
                            <span>•</span>
                            <span className="font-mono font-medium">{formatNumber(log.totalTTC)} {log.currency}</span>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          {log.settings?.showWatermark && (
                            <span className="text-[10px] uppercase font-bold px-2 py-1 bg-amber-500/10 text-amber-600 rounded">
                              Filigrane: {log.settings.watermarkText}
                            </span>
                          )}
                          {log.settings?.isPreviewHighContrast && (
                            <span className="text-[10px] uppercase font-bold px-2 py-1 bg-blue-500/10 text-blue-600 rounded">
                              Haut Contraste
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {activeTab === 'CLIENTS' && (
          <ClientDatabaseTab
            theme={theme || 'dark'}
            onSelectClient={(client) => {
              setClientName(client.name);
              setClientAddress(client.address);
            }}
            currentClientName={clientName}
            currentClientAddress={clientAddress}
          />
        )}

        {/* Toast notifications container */}
        <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
          <AnimatePresence>
            {toasts.map((toast) => (
              <motion.div
                key={toast.id}
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.15 } }}
                className={cn(
                  "pointer-events-auto p-4 rounded-xl shadow-xl border flex items-start gap-3 backdrop-blur-md",
                  toast.type === 'success' && (theme === 'dark' ? "bg-emerald-950/90 border-emerald-500/30 text-emerald-100" : "bg-emerald-50/95 border-emerald-200 text-emerald-900"),
                  toast.type === 'error' && (theme === 'dark' ? "bg-red-950/90 border-red-500/30 text-red-100" : "bg-red-50/95 border-red-200 text-red-900"),
                  toast.type === 'info' && (theme === 'dark' ? "bg-blue-950/90 border-blue-500/30 text-blue-100" : "bg-blue-50/95 border-blue-200 text-blue-900")
                )}
              >
                <div className="mt-0.5 shrink-0">
                  {toast.type === 'success' && <CheckCircle className="text-emerald-500" size={16} />}
                  {toast.type === 'error' && <XCircle className="text-red-500" size={16} />}
                  {toast.type === 'info' && <Info className="text-blue-500" size={16} />}
                </div>
                <div className="flex-1 text-xs font-semibold leading-relaxed">
                  {toast.message}
                </div>
                <button
                  onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                  className="text-zinc-400 hover:text-zinc-200 transition-colors cursor-pointer shrink-0"
                >
                  <X size={12} />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

      </motion.div>
    </div>
  );
}
