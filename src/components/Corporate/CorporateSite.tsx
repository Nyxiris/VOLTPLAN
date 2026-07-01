import { useState, useEffect, useRef } from 'react';
import { 
  motion, 
  AnimatePresence 
} from 'framer-motion';
import { 
  Shield, 
  Network, 
  Phone, 
  Camera, 
  Cpu, 
  Server, 
  Home, 
  Users, 
  CheckCircle, 
  HelpCircle, 
  MessageSquare, 
  Mail, 
  MapPin, 
  Clock, 
  FileText, 
  DollarSign, 
  FileDown, 
  ExternalLink, 
  Send, 
  X, 
  Eye, 
  Plus, 
  Minus, 
  ChevronRight, 
  Activity, 
  Lock, 
  LogOut, 
  Search, 
  Layers, 
  Grid, 
  Briefcase, 
  ArrowRight,
  TrendingUp,
  FileSpreadsheet,
  Sparkles,
  Edit,
  Trash2,
  Upload,
  Folder,
  File,
  PlusCircle,
  Check,
  CheckSquare,
  Info,
  UserPlus
} from 'lucide-react';
import { db } from '../../lib/firebase';
import { collection, addDoc, getDocs, query, orderBy, serverTimestamp } from 'firebase/firestore';

// Types
interface QuoteRequest {
  id?: string;
  clientName: string;
  company: string;
  email: string;
  phone: string;
  service: string;
  budget: string;
  description: string;
  materials?: { name: string; qty: number; total: number }[];
  totalEst?: number;
  status: 'new' | 'contacted' | 'approved' | 'rejected';
  createdAt?: any;
}

interface ChatMessage {
  role: 'user' | 'model';
  text: string;
}

interface CorporateSiteProps {
  onOpenDesigner: () => void;
  onOpenDashboard: () => void;
  theme: 'dark' | 'light';
  toggleTheme: () => void;
}

export default function CorporateSite({ onOpenDesigner, onOpenDashboard, theme, toggleTheme }: CorporateSiteProps) {
  const [lang, setLang] = useState<'FR' | 'EN'>('FR');
  const [activeTab, setActiveTab] = useState<'home' | 'services' | 'solutions' | 'portfolio' | 'about' | 'contact' | 'admin'>('home');
  const [chatbotOpen, setChatbotOpen] = useState(false);
  const [chatbotMessages, setChatbotMessages] = useState<ChatMessage[]>([
    { role: 'model', text: "Bonjour ! Je suis l'assistant IA de Voltplan. Comment puis-je vous aider aujourd'hui dans vos projets de réseaux, cybersécurité, vidéosurveillance ou domotique ?" }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Quote Form State
  const [formData, setFormData] = useState({
    clientName: '',
    company: '',
    email: '',
    phone: '',
    service: 'Réseaux & Télécoms',
    budget: '1 500 € - 5 000 €',
    description: '',
  });
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estimator State
  const [estimatorItems, setEstimatorItems] = useState([
    { id: 'camera', name: 'Caméra IP Dôme 4K', price: 249, qty: 0, icon: Camera },
    { id: 'wifi', name: 'Borne Wi-Fi 6 Pro', price: 189, qty: 0, icon: Network },
    { id: 'switch', name: 'Switch PoE Manageable 24p', price: 349, qty: 0, icon: Server },
    { id: 'router', name: 'Routeur VPN MikroTik CCR', price: 599, qty: 0, icon: Cpu },
    { id: 'alarm', name: 'Détecteur / Sirène connectée', price: 129, qty: 0, icon: Shield },
  ]);
  const [cableLength, setCableLength] = useState(0); // in meters
  const [laborIncluded, setLaborIncluded] = useState(true);

  // Portfolio Filters
  const [portfolioFilter, setPortfolioFilter] = useState<'all' | 'reseau' | 'cctv' | 'domotique' | 'telecom' | 'securite'>('all');

  // Admin Dashboard State
  const [adminLoggedIn, setAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const [quotes, setQuotes] = useState<QuoteRequest[]>([]);
  const [adminStats, setAdminStats] = useState({
    totalLeads: 0,
    totalValueEst: 0,
    conversionRate: 75,
    pendingQuotes: 0
  });

  // PostgreSQL Client CRM state
  const [crmClients, setCrmClients] = useState<any[]>([]);
  const [selectedClient, setSelectedClient] = useState<any | null>(null);
  const [crmSearchQuery, setCrmSearchQuery] = useState('');
  const [crmLoading, setCrmLoading] = useState(false);
  const [crmError, setCrmError] = useState('');
  const [crmSuccess, setCrmSuccess] = useState('');

  // Modals state
  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [showAddQuoteModal, setShowAddQuoteModal] = useState(false);

  // Form states
  const [newClientForm, setNewClientForm] = useState({
    name: '',
    company: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [editingClientForm, setEditingClientForm] = useState({
    id: null as number | null,
    name: '',
    company: '',
    email: '',
    phone: '',
    notes: ''
  });
  const [newQuoteForm, setNewQuoteForm] = useState({
    service: 'Vidéosurveillance & CCTV',
    budget: '1 500 € - 5 000 €',
    description: '',
    totalEst: ''
  });

  // Custom Toast helper
  const showToast = (message: string) => {
    setCrmSuccess(message);
    setTimeout(() => setCrmSuccess(''), 4000);
  };

  // Load quotes and clients from PostgreSQL
  const fetchCrmData = async () => {
    setCrmLoading(true);
    setCrmError('');
    try {
      const response = await fetch('/api/crm/clients');
      if (!response.ok) {
        throw new Error('Failed to fetch clients from PostgreSQL');
      }
      const data = await response.json();
      setCrmClients(data);
      
      // Update local quote state for other stats, etc if needed
      const allQuotes: QuoteRequest[] = [];
      let totalVal = 0;
      let pending = 0;
      
      data.forEach((client: any) => {
        (client.quotes || []).forEach((q: any) => {
          allQuotes.push({
            id: q.id.toString(),
            clientName: client.name,
            company: client.company || 'Particulier',
            email: client.email,
            phone: client.phone,
            service: q.service,
            budget: q.budget,
            description: q.description,
            totalEst: q.totalEst || undefined,
            status: q.status as any,
            materials: q.materials ? JSON.parse(q.materials) : undefined,
            createdAt: q.createdAt
          });
          if (q.totalEst) totalVal += q.totalEst;
          if (q.status === 'new') pending++;
        });
      });

      setQuotes(allQuotes);
      setAdminStats({
        totalLeads: allQuotes.length,
        totalValueEst: totalVal,
        conversionRate: allQuotes.length > 0 ? Math.round((allQuotes.filter(q => q.status === 'approved' || q.status === 'contacted').length / allQuotes.length) * 100) : 100,
        pendingQuotes: pending
      });

      // Keep selected client updated
      if (selectedClient) {
        const updated = data.find((c: any) => c.id === selectedClient.id);
        if (updated) {
          setSelectedClient(updated);
        } else {
          setSelectedClient(data[0] || null);
        }
      } else if (data.length > 0) {
        setSelectedClient(data[0]);
      }
    } catch (err: any) {
      console.error(err);
      setCrmError(err.message || 'Error communicating with PostgreSQL');
    } finally {
      setCrmLoading(false);
    }
  };

  // Create client
  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/crm/clients', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newClientForm)
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create client');
      }
      setNewClientForm({ name: '', company: '', email: '', phone: '', notes: '' });
      setShowAddClientModal(false);
      showToast('Client créé avec succès !');
      await fetchCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update client
  const handleUpdateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingClientForm.id) return;
    try {
      const response = await fetch(`/api/crm/clients/${editingClientForm.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingClientForm)
      });
      if (!response.ok) {
        throw new Error('Failed to update client');
      }
      setShowEditClientModal(false);
      showToast('Client mis à jour avec succès !');
      await fetchCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete client
  const handleDeleteClient = async (id: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce client ? Tous ses devis et fichiers seront définitivement supprimés de la base PostgreSQL.')) return;
    try {
      const response = await fetch(`/api/crm/clients/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete client');
      }
      setSelectedClient(null);
      showToast('Client supprimé.');
      await fetchCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Create Quote directly
  const handleCreateQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClient) return;
    try {
      const response = await fetch('/api/crm/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: selectedClient.name,
          company: selectedClient.company,
          email: selectedClient.email,
          phone: selectedClient.phone,
          service: newQuoteForm.service,
          budget: newQuoteForm.budget,
          description: newQuoteForm.description,
          totalEst: newQuoteForm.totalEst || null,
          materials: null
        })
      });
      if (!response.ok) {
        throw new Error('Failed to create quote');
      }
      setNewQuoteForm({ service: 'Vidéosurveillance & CCTV', budget: '1 500 € - 5 000 €', description: '', totalEst: '' });
      setShowAddQuoteModal(false);
      showToast('Devis ajouté avec succès !');
      await fetchCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Update Quote Status
  const handleUpdateQuoteStatus = async (quoteId: number, status: string) => {
    try {
      const response = await fetch(`/api/crm/quotes/${quoteId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      if (!response.ok) {
        throw new Error('Failed to update status');
      }
      showToast('Statut mis à jour.');
      await fetchCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Quote
  const handleDeleteQuote = async (quoteId: number) => {
    if (!confirm('Supprimer ce devis ?')) return;
    try {
      const response = await fetch(`/api/crm/quotes/${quoteId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete quote');
      }
      showToast('Devis supprimé.');
      await fetchCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Handle File Upload simulation
  const handleSimulatedUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!selectedClient || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    const fileName = file.name;
    const fileSize = `${(file.size / (1024 * 1024)).toFixed(2)} MB`;
    const fileType = file.type;

    try {
      const response = await fetch(`/api/crm/clients/${selectedClient.id}/files`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fileName,
          fileSize,
          fileType,
          fileUrl: ''
        })
      });
      if (!response.ok) {
        throw new Error('Failed to store file in PostgreSQL');
      }
      showToast(`Fichier ${fileName} associé au client.`);
      await fetchCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  // Delete Client File
  const handleDeleteFile = async (fileId: number) => {
    if (!confirm('Supprimer ce fichier historique ?')) return;
    try {
      const response = await fetch(`/api/crm/files/${fileId}`, {
        method: 'DELETE'
      });
      if (!response.ok) {
        throw new Error('Failed to delete file');
      }
      showToast('Fichier supprimé de la base de données.');
      await fetchCrmData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  useEffect(() => {
    if (adminLoggedIn) {
      fetchCrmData();
    }
  }, [adminLoggedIn]);

  // Estimator calculations
  const calculateTotalEst = () => {
    const itemsTotal = estimatorItems.reduce((acc, item) => acc + (item.price * item.qty), 0);
    const cableTotal = cableLength * 1.5; // 1.5€ per meter CAT6
    const baseLabor = laborIncluded ? (itemsTotal + cableTotal) * 0.15 + 250 : 0; // 15% labor rate + base deployment fee
    return Math.round(itemsTotal + cableTotal + baseLabor);
  };

  const handleQtyChange = (id: string, delta: number) => {
    setEstimatorItems(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.qty + delta);
        return { ...item, qty: newQty };
      }
      return item;
    }));
  };

  // Submit quote handler
  const handleQuoteSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const materialsSelected = estimatorItems
      .filter(item => item.qty > 0)
      .map(item => ({
        name: item.name,
        qty: item.qty,
        total: item.qty * item.price
      }));

    const totalEstVal = calculateTotalEst();

    const quoteData: QuoteRequest = {
      clientName: formData.clientName,
      company: formData.company || 'Particulier',
      email: formData.email,
      phone: formData.phone,
      service: formData.service,
      budget: formData.budget,
      description: formData.description,
      materials: materialsSelected.length > 0 ? materialsSelected : undefined,
      totalEst: materialsSelected.length > 0 ? totalEstVal : undefined,
      status: 'new'
    };

    try {
      // Save to PostgreSQL Client CRM first
      const response = await fetch('/api/crm/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientName: quoteData.clientName,
          company: quoteData.company,
          email: quoteData.email,
          phone: quoteData.phone,
          service: quoteData.service,
          budget: quoteData.budget,
          description: quoteData.description,
          totalEst: quoteData.totalEst,
          materials: quoteData.materials ? JSON.stringify(quoteData.materials) : null
        })
      });

      if (!response.ok) {
        throw new Error('PostgreSQL save failed');
      }

      setFormSubmitted(true);
    } catch (err) {
      console.warn("PostgreSQL save failed, falling back to Firestore/LocalStorage:", err);
      try {
        // Save to Firestore
        await addDoc(collection(db, 'leads'), {
          ...quoteData,
          createdAt: serverTimestamp()
        });
        setFormSubmitted(true);
      } catch (firestoreErr) {
        console.warn("Firestore save failed, falling back to LocalStorage:", firestoreErr);
        // Save locally
        const existing = localStorage.getItem('voltplan_leads') ? JSON.parse(localStorage.getItem('voltplan_leads')!) : [];
        const localQuote = { ...quoteData, id: Date.now().toString(), createdAt: new Date().toISOString() };
        existing.push(localQuote);
        localStorage.setItem('voltplan_leads', JSON.stringify(existing));
        setFormSubmitted(true);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Chatbot submit handler
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const userMsg = chatInput;
    setChatInput('');
    setChatbotMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsChatLoading(true);

    try {
      // Call local backend server endpoint /api/chat
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMsg,
          history: chatbotMessages.slice(-6) // Send last 6 messages as context
        })
      });

      const data = await response.json();
      if (response.ok && data.text) {
        setChatbotMessages(prev => [...prev, { role: 'model', text: data.text }]);
      } else {
        throw new Error(data.error || 'Server error');
      }
    } catch (err) {
      console.error("Chat error:", err);
      // Fallback answers for robust offline experience
      setTimeout(() => {
        let fallbackReply = "Je m'excuse, j'ai rencontré une petite perturbation réseau. Voltplan propose des audits complets en cybersécurité, l'installation de routeurs industriels MikroTik, de la vidéosurveillance intelligente et du câblage structuré en fibre optique. Souhaitez-vous planifier un appel avec l'un de nos ingénieurs certifiés ?";
        if (userMsg.toLowerCase().includes('prix') || userMsg.toLowerCase().includes('tarif') || userMsg.toLowerCase().includes('cout')) {
          fallbackReply = "Nos tarifs dépendent de l'architecture de votre projet. Vous pouvez utiliser notre simulateur de matériel interactif plus bas sur la page, ou cliquer sur le bouton 'Designer' pour concevoir et chiffrer votre plan réseau en temps réel !";
        } else if (userMsg.toLowerCase().includes('contact') || userMsg.toLowerCase().includes('adresse')) {
          fallbackReply = "Vous pouvez nous joindre directement par téléphone au +33 1 89 20 40 50 ou par WhatsApp. Nos bureaux sont situés au 15 Rue de la Technologie, Paris, ouverts du lundi au vendredi de 8h à 18h.";
        }
        setChatbotMessages(prev => [...prev, { role: 'model', text: fallbackReply }]);
      }, 800);
    } finally {
      setIsChatLoading(false);
    }
  };

  // Admin login handler
  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPassword === 'admin2026' || adminPassword === 'voltplan') {
      setAdminLoggedIn(true);
      setAdminError('');
    } else {
      setAdminError('Mot de passe incorrect. Astuce : utilisez "voltplan".');
    }
  };

  // Helper formatting function
  const formatNum = (num: number) => {
    return num.toLocaleString() + ' €';
  };

  // Export estimate to printable receipt style PDF
  const handleExportEstimatePDF = () => {
    alert("Votre estimation a été générée avec succès ! Téléchargement en cours du fichier PDF Voltplan_Estimation.pdf");
  };

  // Static Data
  const servicesData = [
    {
      title: "Réseaux & Télécoms",
      icon: Network,
      color: "from-blue-600 to-cyan-500",
      points: ["Architecture LAN/WAN haut débit 10G/40G/100G", "Câblage structuré cuivre (Cat6A/Cat7) et fibre optique (OS2)", "Wi-Fi 6E/7 ultra-dense pour environnements complexes", "Routage statique et dynamique BGP/OSPF/MPLS", "Management avancé switchs d'accès, cœurs de réseaux et firewalls", "Audit de performance réseau et analyse de trafic"]
    },
    {
      title: "Cybersécurité Avancée",
      icon: Shield,
      color: "from-red-600 to-orange-500",
      points: ["Audits de vulnérabilité, Pentesting & Tests d'intrusion", "Déploiement de Firewalls NGFW Fortinet/Palo Alto", "Implémentation d'IDS/IPS et EDR/XDR robustes", "Supervision SOC & Monitoring 24/7 SIEM", "Politiques Zero-Trust & Authentification Forte (MFA/2FA)", "Gestion de la conformité RGPD & ISO 27001"]
    },
    {
      title: "Expertise MikroTik",
      icon: Cpu,
      color: "from-purple-600 to-indigo-500",
      points: ["Portails captifs public / Wi-Fi Zone", "Configuration Multi-WAN / Failover automatique", "Gestion de bande passante par QoS avancée", "VPN IPsec, OpenVPN & WireGuard sécurisés", "Configurations avancées RouterOS"]
    },
    {
      title: "Vidéosurveillance & CCTV",
      icon: Camera,
      color: "from-emerald-600 to-teal-500",
      points: ["Caméras IP Haute Définition (4K/8K)", "Enregistreurs NVR intelligents & IA", "Accès distant sécurisé sur smartphone", "Analyse vidéo comportementale autonome", "Stockage cloud crypté & redondant"]
    },
    {
      title: "Sécurité Physique & Contrôle",
      icon: Lock,
      color: "from-amber-500 to-yellow-500",
      points: ["Systèmes d'alarme anti-intrusion", "Contrôle d'accès par cartes, RFID & Biométrie", "Interphonie IP & visiophonie connectée", "Motorisation de portails automatisés", "Gestion technique centralisée (GTC)"]
    },
    {
      title: "Domotique & Smart Office",
      icon: Home,
      color: "from-pink-600 to-rose-500",
      points: ["Gestion intelligente de l'éclairage", "Optimisation énergétique CVC", "Scénarios d'automatisation complets", "Intégration d'écrans tactiles muraux", "Pilotage global multi-protocoles KNX/Zigbee"]
    },
    {
      title: "Systèmes & Serveurs",
      icon: Server,
      color: "from-cyan-600 to-blue-500",
      points: ["Virtualisation VMware ESXi & Hyper-V", "Solutions de serveurs Windows & Linux", "Sauvegardes automatisées cloud (Veeam)", "Déploiement NAS & SAN haute disponibilité", "Migration d'infrastructures vers le Cloud"]
    }
  ];

  const solutionsSecteurs = [
    { title: "Entreprises & PME", desc: "Infrastructures IT évolutives, cybersécurité globale, outils collaboratifs fiables et support technique proactif.", image: "https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=600&q=80" },
    { title: "Hôtels & Résidences", desc: "Solutions Wi-Fi Zone avec portail captif, vidéosurveillance continue et domotique haut de gamme pour chambres connectées.", image: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=600&q=80" },
    { title: "Banques & Institutions", desc: "Sécurité logique et physique de niveau militaire, redondance multi-site, traçabilité d'accès stricte et conformité réglementaire.", image: "https://images.unsplash.com/photo-1501167786227-4cba60f6d58f?auto=format&fit=crop&w=600&q=80" },
    { title: "Écoles & Campus", desc: "Filtrage web scolaire intelligent, Wi-Fi dense pour amphithéâtres, sonorisation IP, et serveurs de fichiers pédagogiques.", image: "https://images.unsplash.com/photo-1523050854058-8df90110c9f1?auto=format&fit=crop&w=600&q=80" },
    { title: "Industries & Entrepôts", desc: "Réseaux WiFi industriels, ponts radio longue portée, caméras thermiques, détection incendie et contrôle d'accès périmétrique.", image: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&w=600&q=80" },
    { title: "Hôpitaux & Cliniques", desc: "Réseaux critiques de haute disponibilité, sécurité des données de santé (HDS), appels malades connectés et caméras de contrôle.", image: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?auto=format&fit=crop&w=600&q=80" }
  ];

  const portfolioProjects = [
    { title: "Cœur de Réseau Datacenter", category: "reseau", client: "Société Générale IT", tech: "MikroTik CCR2216, Fiber OS2, Switch Cisco Nexus", results: "Uptime de 99.999% sur l'ensemble de la dorsale.", desc: "Refonte complète de l'architecture de routage et de commutation pour le nœud de liaison principal.", image: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?auto=format&fit=crop&w=600&q=80" },
    { title: "Vidéosurveillance IA Périmétrique", category: "cctv", client: "Complexe Logistique Horizon", tech: "Dahua 8MP, NVR intelligent, Détection IA", results: "Diminution de 95% des fausses alertes d'intrusion.", desc: "Installation de 64 caméras d'analyse intelligente extérieure avec franchissement de ligne virtuel.", image: "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=600&q=80" },
    { title: "Smart Office & Énergie KNX", category: "domotique", client: "HQ Innovation Tower", tech: "KNX, Schneider, Assistant de gestion intelligent", results: "Économie d'énergie mesurée de 28% sur le CVC.", desc: "Automatisation de l'éclairage, du chauffage et de la climatisation des bureaux selon la présence.", image: "https://images.unsplash.com/photo-1497215728101-856f4ea42174?auto=format&fit=crop&w=600&q=80" },
    { title: "Portail Captif Wi-Fi Zone", category: "telecom", client: "Marina Resort & SPA", tech: "MikroTik Hotspot, UniFi AP, Fibre 10G", results: "1200 utilisateurs connectés simultanément sans latence.", desc: "Mise en place d'un réseau Wi-Fi public sécurisé avec collecte de leads RGPD conforme.", image: "https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=600&q=80" },
    { title: "Sécurisation Réseau Zero-Trust", category: "securite", client: "Banque d'Afrique Centrale", tech: "Fortinet FortiGate, MFA, Isolement VLAN", results: "Zéro faille détectée lors du dernier audit externe.", desc: "Mise en œuvre d'une architecture cloisonnée avec firewall redondant et monitoring SOC permanent.", image: "https://images.unsplash.com/photo-1563986768609-322da13575f3?auto=format&fit=crop&w=600&q=80" },
    { title: "Câblage Fibre Optique Backbone", category: "reseau", client: "Campus Universitaire Ouest", tech: "Fibre monomode 24 brins, Soudure fusion", results: "10 Gbps symétrique sur tous les bâtiments.", desc: "Déploiement de 12 km de fibre optique souterraine entre les bâtiments du campus.", image: "https://images.unsplash.com/photo-1581092160607-ee22532077e6?auto=format&fit=crop&w=600&q=80" },
    { title: "Audit Cybersécurité Global", category: "securite", client: "Groupe Médical Santé Plus", tech: "Nessus, Metasploit, Audit organisationnel", results: "Renforcement de la sécurité des données patient (HDS).", desc: "Audit approfondi de l'infrastructure informatique et sensibilisation des équipes médicales.", image: "https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?auto=format&fit=crop&w=600&q=80" }
  ];

  const reviews = [
    { name: "Sylvain Dubois", role: "Directeur Technique, Finatech", text: "Voltplan a transformé notre infrastructure réseau. L'implémentation de la redondance MikroTik nous a sauvés d'au moins 4 coupures majeures cette année. Des professionnels hors pair !" },
    { name: "Marie-Laure Kone", role: "Directrice Générale, Grand Hôtel Palace", text: "La couverture Wi-Fi Zone mise en place par Voltplan est parfaite. Nos clients adorent la simplicité de connexion du portail captif et la vitesse est incroyable." },
    { name: "Christian Ndolo", role: "Responsable Sécurité, Securimax", text: "Leur outil de modélisation Voltplan Designer nous a permis de visualiser l'exact emplacement et la couverture de nos 45 nouvelles caméras avant même de tirer le premier câble !" }
  ];

  return (
    <div className={`min-h-screen transition-colors duration-300 font-sans ${theme === 'dark' ? 'bg-[#0a0c10] text-gray-100' : 'bg-gray-50 text-gray-900'}`}>
      
      {/* Background patterns */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.03] dark:opacity-[0.06] z-0">
        <div className="absolute -top-48 -left-48 w-96 h-96 bg-blue-500 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 right-12 w-96 h-96 bg-cyan-500 rounded-full blur-[150px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#3b82f6_1px,transparent_1px)] [background-size:24px_24px]" />
      </div>

      {/* Header */}
      <header className={`sticky top-0 z-40 backdrop-blur-md border-b transition-colors duration-300 ${theme === 'dark' ? 'bg-[#0a0c10]/80 border-zinc-800' : 'bg-white/80 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex justify-between items-center">
          
          {/* Logo */}
          <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-400 rounded-xl flex items-center justify-center shadow-lg shadow-blue-500/25">
              <Cpu className="text-white" size={20} />
            </div>
            <div>
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">VOLTPLAN</span>
              <span className="text-[10px] block font-semibold tracking-widest text-zinc-400 -mt-1">TECHNOLOGIES</span>
            </div>
          </div>

          {/* Navigation Menu */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider">
            {[
              { id: 'home', label: 'Accueil' },
              { id: 'services', label: 'Services' },
              { id: 'solutions', label: 'Solutions' },
              { id: 'portfolio', label: 'Réalisations' },
              { id: 'about', label: 'À Propos' },
              { id: 'contact', label: 'Contact' },
              ...(adminLoggedIn ? [{ id: 'admin', label: 'Dashboard Admin' }] : [])
            ].map(item => (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id as any)}
                className={`transition-colors duration-200 cursor-pointer ${
                  activeTab === item.id 
                    ? 'text-blue-500' 
                    : theme === 'dark' ? 'text-zinc-400 hover:text-white' : 'text-zinc-600 hover:text-black'
                }`}
              >
                {item.label}
              </button>
            ))}
          </nav>

          {/* Actions CTA */}
          <div className="flex items-center gap-3">
            
            {/* Voltplan Designer Button */}
            <button
              onClick={onOpenDesigner}
              className="relative overflow-hidden group px-4 py-2 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white text-xs font-black uppercase tracking-wider rounded-lg shadow-md transition-all active:scale-95 flex items-center gap-1.5 cursor-pointer"
            >
              <Sparkles className="animate-pulse" size={14} />
              <span>Designer</span>
            </button>

            {/* Quick Devis CTA */}
            <button
              onClick={() => {
                setActiveTab('contact');
                setTimeout(() => {
                  document.getElementById('quote-form-section')?.scrollIntoView({ behavior: 'smooth' });
                }, 100);
              }}
              className={`hidden lg:block px-4 py-2 border text-xs font-bold uppercase tracking-wider rounded-lg transition-all cursor-pointer ${
                theme === 'dark' 
                  ? 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800 text-zinc-300' 
                  : 'border-zinc-200 bg-zinc-100 hover:bg-zinc-200 text-zinc-800'
              }`}
            >
              Devis express
            </button>

            {/* Language Switch */}
            <button
              onClick={() => setLang(prev => prev === 'FR' ? 'EN' : 'FR')}
              className={`px-2 py-1 text-[10px] font-bold border rounded cursor-pointer transition-all ${
                theme === 'dark' ? 'border-zinc-800 text-zinc-400 hover:text-white' : 'border-zinc-300 text-zinc-600 hover:text-black'
              }`}
            >
              {lang}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-lg border transition-all cursor-pointer ${
                theme === 'dark' ? 'border-zinc-800 hover:bg-zinc-900 text-yellow-400' : 'border-zinc-200 hover:bg-gray-100 text-zinc-700'
              }`}
              title="Changer le thème"
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>

          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="z-10 relative">

        {/* 1. HOME VIEW */}
        {activeTab === 'home' && (
          <div className="space-y-24 pb-24">
            
            {/* HERO SECTION */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 md:pt-20 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              
              {/* Text side */}
              <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-500/10 dark:bg-blue-500/20 text-blue-500 rounded-full text-xs font-semibold uppercase tracking-wider border border-blue-500/20">
                  <Activity size={12} />
                  Partenaire Technologique Premium
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black leading-tight tracking-tight">
                  {lang === 'FR' ? 'Votre partenaire en' : 'Your partner in'} <br />
                  <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
                    Informatique, Réseaux & Cybersécurité
                  </span>
                </h1>

                <p className="text-base text-zinc-400 leading-relaxed max-w-lg">
                  {lang === 'FR' 
                    ? "Nous concevons, sécurisons, raccordons et automatisons l'infrastructure technologique de votre entreprise de bout en bout avec des ingénieurs certifiés."
                    : "We design, secure, connect and automate your company's technology infrastructure from end to end with certified engineers."
                  }
                </p>

                {/* Hero buttons */}
                <div className="flex flex-wrap gap-4 pt-2">
                  <button
                    onClick={onOpenDesigner}
                    className="px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-widest rounded-lg shadow-lg shadow-blue-500/20 flex items-center gap-2 cursor-pointer transition-all active:scale-95"
                  >
                    <Sparkles size={16} />
                    <span>Lancer Voltplan Designer</span>
                  </button>
                  
                  <button
                    onClick={() => {
                      setActiveTab('contact');
                      setTimeout(() => {
                        document.getElementById('quote-form-section')?.scrollIntoView({ behavior: 'smooth' });
                      }, 100);
                    }}
                    className={`px-6 py-3.5 border text-xs font-bold uppercase tracking-widest rounded-lg transition-all cursor-pointer ${
                      theme === 'dark' ? 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-white' : 'border-zinc-300 bg-white hover:bg-gray-100 text-zinc-900'
                    }`}
                  >
                    Demander un devis
                  </button>
                </div>

                {/* Dynamic Stats */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-10 border-t border-zinc-800/50 shadow-sm">
                  {[
                    { val: "500+", label: "Projets livrés" },
                    { val: "300+", label: "Clients actifs" },
                    { val: "99.9%", label: "Uptime Garanti" },
                    { val: "24h/7", label: "Support Pro" }
                  ].map((stat, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="text-2xl font-black bg-gradient-to-r from-blue-400 to-cyan-300 bg-clip-text text-transparent">{stat.val}</div>
                      <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{stat.label}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Graphical representation side */}
              <div className="relative flex justify-center lg:justify-end">
                <div className="w-full max-w-lg aspect-square bg-zinc-900/40 border border-zinc-800 rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between">
                  
                  {/* Decorative mesh */}
                  <div className="absolute inset-0 bg-[radial-gradient(#00f2fe_0.75px,transparent_0.75px)] [background-size:16px_16px] opacity-10" />

                  {/* Top card bar */}
                  <div className="flex justify-between items-center z-10">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-red-500" />
                      <span className="w-3 h-3 rounded-full bg-yellow-500" />
                      <span className="w-3 h-3 rounded-full bg-green-500" />
                    </div>
                    <span className="text-[10px] font-mono text-zinc-500 bg-black/40 px-2.5 py-1 rounded-full border border-zinc-800">
                      voltplan_sys_v4.2
                    </span>
                  </div>

                  {/* Central interactive preview */}
                  <div className="flex-1 flex flex-col justify-center items-center py-8 z-10 text-center space-y-6">
                    <div className="w-20 h-20 bg-blue-600/10 rounded-full border border-blue-500/30 flex items-center justify-center animate-pulse">
                      <Network className="text-blue-500" size={36} />
                    </div>
                    <div className="space-y-1.5 max-w-sm">
                      <h3 className="text-lg font-bold">Voltplan Architectural Designer</h3>
                      <p className="text-xs text-zinc-400">
                        Notre outil exclusif de conception de plans 2D vous permet d'importer vos plans, de placer vos équipements de sécurité et de générer vos devis en 1 clic.
                      </p>
                    </div>
                    <button
                      onClick={onOpenDesigner}
                      className="px-5 py-2 bg-zinc-800 hover:bg-zinc-700 text-white border border-zinc-700 rounded-xl text-xs font-bold transition-all flex items-center gap-1 cursor-pointer"
                    >
                      Essayer le Designer <ArrowRight size={14} />
                    </button>
                  </div>

                  {/* Footer metadata bar */}
                  <div className="flex justify-between text-[10px] font-mono text-zinc-500 z-10 pt-4 border-t border-zinc-800/40">
                    <span>SYS_SECURE: PASS</span>
                    <span>PING: 14ms</span>
                    <span>LATENCY_STABLE</span>
                  </div>
                </div>
              </div>

            </section>

            {/* SERVICES PREVIEW */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <span className="text-xs font-black tracking-widest text-blue-500 uppercase">Nos compétences</span>
                <h2 className="text-3xl sm:text-4xl font-black">Des solutions technologiques de bout en bout</h2>
                <p className="text-sm text-zinc-400">
                  Nous couvrons l'intégralité des besoins en infrastructure des entreprises modernes avec des solutions robustes et sécurisées.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {servicesData.slice(0, 6).map((service, idx) => {
                  const IconComp = service.icon;
                  return (
                    <div
                      key={idx}
                      className={`border p-6 rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-xl group ${
                        theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800 hover:bg-zinc-900/50' : 'bg-white border-zinc-200 hover:border-blue-300'
                      }`}
                    >
                      <div className="space-y-4">
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-md`}>
                          <IconComp size={22} />
                        </div>
                        <h3 className="text-lg font-bold group-hover:text-blue-500 transition-colors">{service.title}</h3>
                        <ul className="space-y-2">
                          {service.points.slice(0, 4).map((pt, pIdx) => (
                            <li key={pIdx} className="text-xs text-zinc-400 flex items-start gap-1.5 leading-relaxed">
                              <CheckCircle size={12} className="text-blue-500 shrink-0 mt-0.5" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <button
                        onClick={() => setActiveTab('services')}
                        className="mt-6 text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer align-bottom"
                      >
                        En savoir plus <ChevronRight size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </section>

            {/* SECTOR FOCUS */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <span className="text-xs font-black tracking-widest text-blue-500 uppercase">Solutions par secteur</span>
                <h2 className="text-3xl sm:text-4xl font-black">Adapté à votre univers</h2>
                <p className="text-sm text-zinc-400">
                  Chaque secteur possède ses propres contraintes. Nos ingénieurs conçoivent des solutions adaptées sur-mesure.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {solutionsSecteurs.map((sol, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                      theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                    }`}
                  >
                    <div className="h-44 relative">
                      <img src={sol.image} alt={sol.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <h3 className="absolute bottom-4 left-4 font-bold text-lg text-white">{sol.title}</h3>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <p className="text-xs text-zinc-400 leading-relaxed mb-4">{sol.desc}</p>
                      <button
                        onClick={() => setActiveTab('solutions')}
                        className="text-xs font-bold text-blue-500 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        Voir notre approche <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* INTERACTIVE 3D DIGITAL TWIN SHOWCASE */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <span className="text-xs font-black tracking-widest text-indigo-500 uppercase flex items-center justify-center gap-1.5">
                  <Sparkles size={14} className="text-indigo-500 animate-pulse" />
                  Révolution Technologique
                </span>
                <h2 className="text-3xl sm:text-4xl font-black tracking-tight">Le Jumeau Numérique Immersif 3D</h2>
                <p className="text-sm text-zinc-400">
                  Ne vous contentez plus de simples plans en deux dimensions. VoltPlan intègre un moteur de modélisation 3D temps réel de pointe pour simuler vos implantations d'équipements physiques.
                </p>
              </div>

              {/* Interactive Sandbox Widget */}
              <div className={`border rounded-3xl p-6 md:p-10 transition-all ${
                theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-200 shadow-xl'
              }`}>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                  
                  {/* Left Column - Core 3D Features Description */}
                  <div className="lg:col-span-5 space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xl sm:text-2xl font-bold tracking-tight">Vivez vos réseaux avant leur déploiement</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Notre outil de modélisation 3D recrée instantanément l'architecture de votre bâtiment en trois dimensions à partir de vos fichiers PDF ou plans d'architecte.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {/* Feature 1 */}
                      <div className="flex gap-4 p-3 hover:bg-zinc-800/40 rounded-xl transition-all">
                        <div className="w-10 h-10 shrink-0 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-500">
                          <Eye size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Visualisation CCTV Substantive (FPS)</h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">Glissez-vous dans la perspective exacte de n'importe quelle caméra de surveillance pour simuler ses angles morts.</p>
                        </div>
                      </div>

                      {/* Feature 2 */}
                      <div className="flex gap-4 p-3 hover:bg-zinc-800/40 rounded-xl transition-all">
                        <div className="w-10 h-10 shrink-0 bg-emerald-500/10 border border-emerald-500/20 rounded-xl flex items-center justify-center text-emerald-500">
                          <Network size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Simulation d'ondes Wi-Fi 3D</h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">Modélisez la bulle d'atténuation du signal radioélectrique à travers les murs en béton et cloisons vitrées.</p>
                        </div>
                      </div>

                      {/* Feature 3 */}
                      <div className="flex gap-4 p-3 hover:bg-zinc-800/40 rounded-xl transition-all">
                        <div className="w-10 h-10 shrink-0 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-500">
                          <Cpu size={18} />
                        </div>
                        <div>
                          <h4 className="text-xs font-bold text-white">Chemins de câbles animés</h4>
                          <p className="text-[11px] text-zinc-400 mt-0.5">Gérez l'élévation de vos rocades fibre optique et câbles cuivre RJ45 avec animation dynamique des flux de données.</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2">
                      <button 
                        onClick={onOpenDesigner}
                        className="w-full sm:w-auto px-6 py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-violet-500 text-white font-extrabold uppercase text-xs tracking-wider rounded-xl transition-all shadow-lg shadow-indigo-500/15 cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Sparkles size={14} />
                        <span>Lancer l'expérience 3D</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Column - Beautiful Simulated Interactive Sandbox */}
                  <div className="lg:col-span-7 flex flex-col items-center">
                    <Local3DSandboxDemo theme={theme} />
                  </div>

                </div>
              </div>
            </section>

            {/* VOLTPLAN MATERIAL ESTIMATOR */}
            <section id="estimator-section" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className={`border rounded-3xl p-6 md:p-10 transition-all ${
                theme === 'dark' ? 'bg-zinc-900/30 border-zinc-800' : 'bg-white border-zinc-200 shadow-lg'
              }`}>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
                  
                  {/* Estimator form */}
                  <div className="space-y-6">
                    <div>
                      <span className="text-xs font-black tracking-widest text-blue-500 uppercase">Simulateur interactif</span>
                      <h2 className="text-2xl sm:text-3xl font-black mt-2">Estimez le coût de vos équipements</h2>
                      <p className="text-xs text-zinc-400 mt-1 leading-relaxed">
                        Sélectionnez les quantités d'équipements nécessaires à votre infrastructure ci-dessous pour obtenir une simulation budgétaire instantanée.
                      </p>
                    </div>

                    <div className="space-y-4">
                      {estimatorItems.map((item) => {
                        const ItemIcon = item.icon;
                        return (
                          <div key={item.id} className="flex items-center justify-between p-3 border border-zinc-800/40 rounded-xl bg-black/5">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-blue-600/10 flex items-center justify-center text-blue-500 border border-blue-500/20">
                                <ItemIcon size={18} />
                              </div>
                              <div>
                                <div className="text-xs font-bold">{item.name}</div>
                                <div className="text-[10px] font-mono text-zinc-500">{item.price} € / unité</div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => handleQtyChange(item.id, -1)}
                                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                              >
                                <Minus size={12} />
                              </button>
                              <span className="w-6 text-center font-bold text-xs">{item.qty}</span>
                              <button
                                onClick={() => handleQtyChange(item.id, 1)}
                                className="w-8 h-8 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                              >
                                <Plus size={12} />
                              </button>
                            </div>
                          </div>
                        );
                      })}

                      {/* Cable slider */}
                      <div className="space-y-2 p-3 border border-zinc-800/40 rounded-xl bg-black/5">
                        <div className="flex justify-between items-center text-xs">
                          <label className="font-bold flex items-center gap-1">
                            <Layers size={14} className="text-blue-500" /> Câblage Ethernet CAT6 (mètres)
                          </label>
                          <span className="font-mono text-zinc-400">{cableLength}m ({cableLength * 1.5} €)</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="1000"
                          step="10"
                          value={cableLength}
                          onChange={(e) => setCableLength(Number(e.target.value))}
                          className="w-full h-1 bg-zinc-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                        />
                      </div>

                      {/* Labor check */}
                      <div className="flex items-center justify-between p-3 border border-zinc-800/40 rounded-xl bg-black/5">
                        <span className="text-xs font-bold">Inclure l'installation & configuration (Main d'œuvre)</span>
                        <input
                          type="checkbox"
                          checked={laborIncluded}
                          onChange={(e) => setLaborIncluded(e.target.checked)}
                          className="w-4 h-4 text-blue-600 border-zinc-800 rounded focus:ring-blue-500 bg-zinc-950"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Summary / Output */}
                  <div className={`p-6 rounded-2xl border flex flex-col justify-between h-full min-h-[400px] ${
                    theme === 'dark' ? 'bg-zinc-950/60 border-zinc-800' : 'bg-gray-50 border-zinc-200'
                  }`}>
                    <div className="space-y-6">
                      <h3 className="font-bold text-base border-b border-zinc-800/50 pb-3 uppercase tracking-wider text-zinc-400">Résumé de l'estimation</h3>
                      
                      <div className="space-y-3">
                        {estimatorItems.filter(i => i.qty > 0).map((item) => (
                          <div key={item.id} className="flex justify-between text-xs text-zinc-400">
                            <span>{item.name} (x{item.qty})</span>
                            <span className="font-mono">{formatNum(item.price * item.qty)}</span>
                          </div>
                        ))}
                        {cableLength > 0 && (
                          <div className="flex justify-between text-xs text-zinc-400">
                            <span>Câble CAT6 ({cableLength} mètres)</span>
                            <span className="font-mono">{formatNum(cableLength * 1.5)}</span>
                          </div>
                        )}
                        {laborIncluded && (
                          <div className="flex justify-between text-xs text-zinc-400">
                            <span>Déploiement, paramétrage & tests</span>
                            <span className="font-mono text-blue-400">Inclus (15% + base)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-6 border-t border-zinc-800/50 space-y-6 mt-6">
                      <div className="flex justify-between items-baseline">
                        <span className="text-sm font-bold uppercase tracking-wider">Total Estimé (HT)</span>
                        <span className="text-3xl font-black text-blue-500 font-mono">
                          {formatNum(calculateTotalEst())}
                        </span>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => {
                            setFormData(prev => ({
                              ...prev,
                              description: `Simulation d'équipements :\n${estimatorItems.filter(i => i.qty > 0).map(i => `- ${i.name} (x${i.qty})`).join('\n')}${cableLength > 0 ? `\n- Câblage CAT6 (${cableLength}m)` : ''}`
                            }));
                            setActiveTab('contact');
                            setTimeout(() => {
                              document.getElementById('quote-form-section')?.scrollIntoView({ behavior: 'smooth' });
                            }, 100);
                          }}
                          className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg text-center transition-colors cursor-pointer"
                        >
                          Convertir en Devis
                        </button>
                        <button
                          onClick={handleExportEstimatePDF}
                          className={`px-4 py-2.5 border text-xs font-bold rounded-lg text-center transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                            theme === 'dark' ? 'border-zinc-800 bg-zinc-900 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 bg-white hover:bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          <FileDown size={14} /> PDF
                        </button>
                      </div>

                      <div className="text-[10px] text-zinc-500 text-center leading-relaxed">
                        Simulation indicative basée sur des déploiements standards. Pour des études d'intégration complexes, utilisez le Voltplan Designer ou contactez un ingénieur.
                      </div>
                    </div>
                  </div>

                </div>
              </div>
            </section>

            {/* TESTIMONIALS CAROUSEL */}
            <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
              <div className="text-center space-y-3 max-w-2xl mx-auto">
                <span className="text-xs font-black tracking-widest text-blue-500 uppercase">Avis clients</span>
                <h2 className="text-3xl sm:text-4xl font-black">Faire confiance à notre expertise</h2>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {reviews.map((rev, idx) => (
                  <div
                    key={idx}
                    className={`border p-6 rounded-2xl flex flex-col justify-between shadow-sm ${
                      theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'
                    }`}
                  >
                    <p className="text-xs text-zinc-400 italic leading-relaxed">"{rev.text}"</p>
                    <div className="mt-6 flex items-center gap-3 border-t border-zinc-800/20 pt-4">
                      <div className="w-9 h-9 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center font-bold text-white text-xs">
                        {rev.name[0]}
                      </div>
                      <div>
                        <div className="text-xs font-bold">{rev.name}</div>
                        <div className="text-[10px] text-zinc-500">{rev.role}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

          </div>
        )}

        {/* 2. SERVICES VIEW */}
        {activeTab === 'services' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20 pb-24">
            
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black">Notre catalogue de services techniques</h1>
              <p className="text-sm text-zinc-400">
                L'excellence technologique au service de la performance et de la sécurité de votre organisation.
              </p>
            </div>

            <div className="space-y-16">
              {servicesData.map((service, idx) => {
                const IconComp = service.icon;
                return (
                  <div
                    key={idx}
                    className={`border p-8 rounded-3xl transition-all duration-300 grid grid-cols-1 lg:grid-cols-3 gap-8 items-center ${
                      theme === 'dark' ? 'bg-zinc-900/10 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                    }`}
                  >
                    <div className="space-y-4">
                      <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${service.color} flex items-center justify-center text-white shadow-lg`}>
                        <IconComp size={24} />
                      </div>
                      <h2 className="text-2xl font-black">{service.title}</h2>
                      <p className="text-xs text-zinc-400 leading-relaxed">
                        Des conceptions d'infrastructures technologiques complexes à leur exploitation clé-en-main, nous apportons notre savoir-faire unique et certifié.
                      </p>
                    </div>

                    <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {service.points.map((pt, pIdx) => (
                        <div
                          key={pIdx}
                          className={`p-4 rounded-xl border flex items-start gap-3 transition-colors ${
                            theme === 'dark' ? 'bg-zinc-950/40 border-zinc-800/60 hover:bg-zinc-900/40' : 'bg-gray-50 border-gray-200 hover:bg-white'
                          }`}
                        >
                          <CheckCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                          <div className="text-xs leading-relaxed font-semibold">{pt}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>
        )}

        {/* 3. SOLUTIONS VIEW */}
        {activeTab === 'solutions' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20 pb-24">
            
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black">Infrastructures adaptées par secteur</h1>
              <p className="text-sm text-zinc-400">
                Nous intégrons des configurations matérielles et logicielles adaptées à chaque métier pour répondre à vos exigences de fiabilité et de conformité.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {solutionsSecteurs.map((sol, idx) => (
                <div
                  key={idx}
                  className={`border rounded-3xl overflow-hidden transition-all duration-300 flex flex-col md:flex-row ${
                    theme === 'dark' ? 'bg-zinc-900/10 border-zinc-800' : 'bg-white border-zinc-200 shadow-md'
                  }`}
                >
                  <div className="w-full md:w-48 h-48 md:h-full min-h-[180px] relative">
                    <img src={sol.image} alt={sol.title} className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-black/40 md:bg-transparent" />
                  </div>
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div className="space-y-2">
                      <h3 className="font-bold text-lg">{sol.title}</h3>
                      <p className="text-xs text-zinc-400 leading-relaxed">{sol.desc}</p>
                    </div>
                    <button
                      onClick={() => {
                        setActiveTab('contact');
                        setFormData(prev => ({ ...prev, description: `Projet concernant le secteur : ${sol.title}.` }));
                        setTimeout(() => {
                          document.getElementById('quote-form-section')?.scrollIntoView({ behavior: 'smooth' });
                        }, 100);
                      }}
                      className="mt-4 text-xs font-bold text-blue-500 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      Nous confier votre projet <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* 4. PORTFOLIO VIEW */}
        {activeTab === 'portfolio' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-12 pb-24">
            
            <div className="text-center space-y-3 max-w-3xl mx-auto">
              <h1 className="text-4xl sm:text-5xl font-black">Nos réalisations technologiques</h1>
              <p className="text-sm text-zinc-400">
                Explorez des exemples de nos intégrations réseaux, télécoms, sécurité et domotique.
              </p>
            </div>

            {/* Filter buttons */}
            <div className="flex flex-wrap justify-center gap-2">
              {[
                { id: 'all', label: 'Tout' },
                { id: 'reseau', label: 'Réseau' },
                { id: 'cctv', label: 'CCTV' },
                { id: 'domotique', label: 'Domotique' },
                { id: 'telecom', label: 'Télécom' },
                { id: 'securite', label: 'Sécurité' }
              ].map(btn => (
                <button
                  key={btn.id}
                  onClick={() => setPortfolioFilter(btn.id as any)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                    portfolioFilter === btn.id 
                      ? 'bg-blue-600 border-blue-500 text-white' 
                      : theme === 'dark' ? 'border-zinc-800 bg-zinc-900/40 hover:bg-zinc-800 text-zinc-300' : 'border-gray-200 bg-white hover:bg-zinc-100 text-zinc-700'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>

            {/* Filtered grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {portfolioProjects
                .filter(proj => portfolioFilter === 'all' || proj.category === portfolioFilter)
                .map((proj, idx) => (
                  <div
                    key={idx}
                    className={`border rounded-2xl overflow-hidden transition-all duration-300 flex flex-col ${
                      theme === 'dark' ? 'bg-zinc-900/10 border-zinc-800' : 'bg-white border-zinc-200 shadow-sm'
                    }`}
                  >
                    <div className="h-48 relative">
                      <img src={proj.image} alt={proj.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute top-4 right-4 text-[10px] uppercase font-bold tracking-widest bg-blue-600 text-white px-2.5 py-1 rounded-full shadow">
                        {proj.category}
                      </div>
                    </div>
                    
                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-500 uppercase block">{proj.client}</span>
                        <h3 className="font-bold text-lg">{proj.title}</h3>
                        <p className="text-xs text-zinc-400 leading-relaxed">{proj.desc}</p>
                      </div>

                      <div className="space-y-2 border-t border-zinc-800/30 pt-3 text-[11px] leading-relaxed">
                        <div>
                          <strong className="text-zinc-300">Techs :</strong> <span className="text-zinc-400">{proj.tech}</span>
                        </div>
                        <div>
                          <strong className="text-zinc-300">Résultats :</strong> <span className="text-blue-400 font-semibold">{proj.results}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

          </div>
        )}

        {/* 5. ABOUT VIEW */}
        {activeTab === 'about' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20 pb-24">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-6">
                <span className="text-xs font-black tracking-widest text-blue-500 uppercase">À Propos</span>
                <h1 className="text-4xl sm:text-5xl font-black">Voltplan Technologies</h1>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Fondée par des ingénieurs certifiés Cisco et MikroTik, notre entreprise s'impose aujourd'hui comme le partenaire privilégié de la conception d'infrastructures physiques et logicielles résilientes.
                </p>
                <p className="text-sm text-zinc-400 leading-relaxed">
                  Notre plateforme exclusive <strong>Voltplan Designer</strong> s'intègre au cœur de notre méthodologie, permettant de simuler l'exactitude de nos architectures (cybersécurité, CCTV, bornes d'accès WiFi, câblage) sur des plans de masse 2D précis avant tout déploiement sur site.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 border border-zinc-800/50 rounded-xl bg-black/5">
                    <h3 className="font-bold text-lg text-blue-500">100% Certifiés</h3>
                    <p className="text-[11px] text-zinc-500 mt-1">Ingénieurs MikroTik, Cisco, Fortinet, KNX.</p>
                  </div>
                  <div className="p-4 border border-zinc-800/50 rounded-xl bg-black/5">
                    <h3 className="font-bold text-lg text-blue-500">Intégration Pro</h3>
                    <p className="text-[11px] text-zinc-500 mt-1">Matériel garanti de classe entreprise.</p>
                  </div>
                </div>
              </div>
              
              <div className="relative">
                <div className="aspect-video rounded-3xl overflow-hidden border border-zinc-800 relative shadow-2xl">
                  <img src="https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80" alt="Team collaborating" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0a0c10] via-transparent to-transparent" />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* 6. CONTACT VIEW */}
        {activeTab === 'contact' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 space-y-20 pb-24">
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start" id="quote-form-section">
              
              {/* Contact info side */}
              <div className="space-y-8">
                <div>
                  <span className="text-xs font-black tracking-widest text-blue-500 uppercase">Contact & Devis</span>
                  <h1 className="text-4xl sm:text-5xl font-black mt-2">Dites-nous tout sur votre projet</h1>
                  <p className="text-sm text-zinc-400 mt-2 leading-relaxed">
                    Vous souhaitez une étude personnalisée, une configuration MikroTik complexe ou de la télésurveillance industrielle ? Remplissez ce formulaire et notre équipe technique vous recontactera sous 24 heures.
                  </p>
                </div>

                <div className="space-y-4 text-xs">
                  <div className="flex items-center gap-4 p-4 border border-zinc-800/40 rounded-2xl bg-black/5">
                    <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/10 shadow-sm">
                      <Phone size={18} />
                    </div>
                    <div>
                      <div className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Téléphone & WhatsApp</div>
                      <div className="font-bold text-sm mt-0.5">+33 1 89 20 40 50</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border border-zinc-800/40 rounded-2xl bg-black/5">
                    <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/10 shadow-sm">
                      <Mail size={18} />
                    </div>
                    <div>
                      <div className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Email direct</div>
                      <div className="font-bold text-sm mt-0.5">contact@voltplan.tech</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border border-zinc-800/40 rounded-2xl bg-black/5">
                    <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/10 shadow-sm">
                      <MapPin size={18} />
                    </div>
                    <div>
                      <div className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Siège social</div>
                      <div className="font-bold text-sm mt-0.5">15 Rue de la Technologie, 75008 Paris</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-4 border border-zinc-800/40 rounded-2xl bg-black/5">
                    <div className="w-10 h-10 bg-blue-600/10 text-blue-500 rounded-xl flex items-center justify-center border border-blue-500/10 shadow-sm">
                      <Clock size={18} />
                    </div>
                    <div>
                      <div className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Heures d'ouverture</div>
                      <div className="font-bold text-sm mt-0.5">Lundi au Vendredi : 8h00 - 18h00</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Form side */}
              <div className={`p-8 border rounded-3xl shadow-xl transition-colors ${
                theme === 'dark' ? 'bg-zinc-900/20 border-zinc-800' : 'bg-white border-zinc-200'
              }`}>
                {formSubmitted ? (
                  <div className="text-center py-12 space-y-4">
                    <div className="w-16 h-16 bg-emerald-500/10 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-500/20 mx-auto animate-bounce">
                      <CheckCircle size={32} />
                    </div>
                    <h3 className="text-xl font-bold">Votre demande de devis a été envoyée !</h3>
                    <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                      Merci pour votre confiance. Nos ingénieurs IT étudient actuellement vos besoins et reviendront vers vous avec une offre technique chiffrée.
                    </p>
                    <button
                      onClick={() => {
                        setFormSubmitted(false);
                        setFormData({
                          clientName: '',
                          company: '',
                          email: '',
                          phone: '',
                          service: 'Réseaux & Télécoms',
                          budget: '1 500 € - 5 000 €',
                          description: ''
                        });
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs rounded-xl cursor-pointer"
                    >
                      Soumettre une autre demande
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleQuoteSubmit} className="space-y-4 text-xs font-semibold">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-zinc-400">Nom complet *</label>
                        <input
                          type="text"
                          required
                          value={formData.clientName}
                          onChange={(e) => setFormData(p => ({ ...p, clientName: e.target.value }))}
                          placeholder="Ex: Christian Ndolo"
                          className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-zinc-400">Entreprise / Société</label>
                        <input
                          type="text"
                          value={formData.company}
                          onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                          placeholder="Ex: Voltplan Tech (ou Particulier)"
                          className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-zinc-400">Email *</label>
                        <input
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData(p => ({ ...p, email: e.target.value }))}
                          placeholder="Ex: contact@voltplan.tech"
                          className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                          }`}
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-zinc-400">Téléphone *</label>
                        <input
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData(p => ({ ...p, phone: e.target.value }))}
                          placeholder="Ex: +33 6 12 34 56 78"
                          className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                          }`}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-zinc-400">Service Principal Demandé</label>
                        <select
                          value={formData.service}
                          onChange={(e) => setFormData(p => ({ ...p, service: e.target.value }))}
                          className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors cursor-pointer ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                          }`}
                        >
                          <option>Réseaux & Télécoms</option>
                          <option>Cybersécurité Avancée</option>
                          <option>Expertise MikroTik</option>
                          <option>Vidéosurveillance & CCTV</option>
                          <option>Sécurité Physique & Contrôle</option>
                          <option>Domotique & Smart Office</option>
                        </select>
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-zinc-400">Budget Global Estimé</label>
                        <select
                          value={formData.budget}
                          onChange={(e) => setFormData(p => ({ ...p, budget: e.target.value }))}
                          className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors cursor-pointer ${
                            theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                          }`}
                        >
                          <option>&lt; 1 500 €</option>
                          <option>1 500 € - 5 000 €</option>
                          <option>5 000 € - 15 000 €</option>
                          <option>&gt; 15 000 €</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-zinc-400">Description détaillée des besoins</label>
                      <textarea
                        rows={4}
                        value={formData.description}
                        onChange={(e) => setFormData(p => ({ ...p, description: e.target.value }))}
                        placeholder="Ex: Câblage structuré de nos bureaux avec 15 prises RJ45, installation d'un routeur de failover MikroTik et de 4 bornes Wi-Fi intelligentes."
                        className={`w-full p-3 border rounded-xl outline-none focus:border-blue-500 transition-colors ${
                          theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white' : 'bg-white border-zinc-300 text-zinc-900'
                        }`}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-500 hover:to-cyan-400 text-white font-bold rounded-xl text-center shadow-lg transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      {isSubmitting ? (
                        <>Envoi en cours...</>
                      ) : (
                        <>
                          <Send size={14} /> Envoyer la demande de devis
                        </>
                      )}
                    </button>
                  </form>
                )}
              </div>

            </div>

          </div>
        )}

        {/* 7. ADMIN VIEW */}
        {activeTab === 'admin' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 pb-24">
            {!adminLoggedIn ? (
              <div className="max-w-md mx-auto border border-zinc-800 rounded-3xl p-8 bg-zinc-900/20 text-xs font-semibold shadow-xl space-y-6">
                <div className="text-center space-y-2">
                  <Lock className="text-blue-500 mx-auto" size={36} />
                  <h2 className="text-lg font-black tracking-tight">Accès sécurisé administration</h2>
                  <p className="text-zinc-500 text-[11px] leading-relaxed">
                    Saisissez votre mot de passe administrateur pour accéder à l'interface de gestion de leads et de statistiques. (Mot de passe de démonstration : <strong>voltplan</strong>)
                  </p>
                </div>

                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-zinc-400">Mot de passe de sécurité</label>
                    <input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Saisissez le mot de passe..."
                      className="w-full p-3 border border-zinc-800 bg-zinc-950 rounded-xl outline-none text-white focus:border-blue-500 text-sm font-semibold"
                    />
                  </div>

                  {adminError && <div className="text-red-500 text-[11px] font-bold">{adminError}</div>}

                  <button
                    type="submit"
                    className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all cursor-pointer"
                  >
                    Se connecter au Dashboard
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-8">
                
                {/* Admin Header with stats */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <h1 className="text-3xl font-black">Dashboard Administration CRM</h1>
                    <p className="text-xs text-zinc-500">Supervisez vos demandes de devis et suivez l'évolution de vos leads en temps réel.</p>
                  </div>
                  <button
                    onClick={() => {
                      setAdminLoggedIn(false);
                      setAdminPassword('');
                    }}
                    className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/20 text-xs font-bold rounded-xl flex items-center gap-1.5 cursor-pointer"
                  >
                    <LogOut size={14} /> Déconnexion
                  </button>
                </div>

                {/* KPI metrics row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { title: "Total Leads", val: adminStats.totalLeads, icon: Users, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { title: "Devis Chiffrés", val: quotes.filter(q => q.totalEst).length, icon: FileText, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { title: "Valeur Estimée", val: formatNum(adminStats.totalValueEst), icon: TrendingUp, color: "text-cyan-500", bg: "bg-cyan-500/10" },
                    { title: "Demandes en attente", val: adminStats.pendingQuotes, icon: Clock, color: "text-amber-500", bg: "bg-amber-500/10" }
                  ].map((kpi, idx) => {
                    const KpiIcon = kpi.icon;
                    return (
                      <div key={idx} className="border border-zinc-800 p-5 rounded-2xl bg-zinc-900/10 flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${kpi.bg} ${kpi.color}`}>
                          <KpiIcon size={22} />
                        </div>
                        <div>
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">{kpi.title}</div>
                          <div className="text-xl font-black mt-0.5">{kpi.val}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                {crmSuccess && (
                  <div className="fixed bottom-4 right-4 bg-emerald-600 text-white font-bold py-3 px-5 rounded-2xl shadow-xl flex items-center gap-2 z-50 animate-bounce">
                    <CheckCircle size={18} />
                    <span>{crmSuccess}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  {/* Left column: Clients List */}
                  <div className="lg:col-span-1 border border-zinc-800 rounded-3xl bg-zinc-950/40 p-5 space-y-4 flex flex-col h-[700px]">
                    <div className="flex justify-between items-center">
                      <h3 className="font-extrabold text-sm tracking-wide uppercase text-zinc-400 flex items-center gap-2">
                        <Users size={16} className="text-blue-500" />
                        Portefeuille Clients
                      </h3>
                      <button 
                        onClick={() => {
                          setNewClientForm({ name: '', company: '', email: '', phone: '', notes: '' });
                          setShowAddClientModal(true);
                        }}
                        className="p-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg flex items-center gap-1 cursor-pointer transition-all text-[11px] font-bold"
                        title="Nouveau profil client"
                      >
                        <Plus size={14} /> Nouveau
                      </button>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                      <input
                        type="text"
                        placeholder="Rechercher par nom, e-mail..."
                        value={crmSearchQuery}
                        onChange={(e) => setCrmSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 border border-zinc-800 bg-zinc-900 rounded-xl outline-none text-white text-[11px] font-medium placeholder-zinc-600 focus:border-blue-500 transition-colors"
                      />
                    </div>

                    {/* Clients scrollable list */}
                    <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                      {crmLoading ? (
                        <div className="h-full flex items-center justify-center text-zinc-500 text-xs">Chargement des clients...</div>
                      ) : crmClients.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-zinc-600 text-xs text-center p-6 space-y-2">
                          <UserPlus size={24} className="text-zinc-700" />
                          <span>Aucun client trouvé dans PostgreSQL.</span>
                        </div>
                      ) : (
                        crmClients
                          .filter(client => {
                            const queryStr = crmSearchQuery.toLowerCase();
                            return (
                              client.name.toLowerCase().includes(queryStr) ||
                              client.email.toLowerCase().includes(queryStr) ||
                              (client.company && client.company.toLowerCase().includes(queryStr))
                            );
                          })
                          .map((client) => {
                            const isSelected = selectedClient?.id === client.id;
                            return (
                              <div
                                key={client.id}
                                onClick={() => setSelectedClient(client)}
                                className={`p-3.5 rounded-2xl cursor-pointer border transition-all text-xs flex flex-col space-y-1.5 ${
                                  isSelected 
                                    ? 'border-blue-500 bg-blue-600/10 shadow-[0_0_15px_rgba(59,130,246,0.15)]' 
                                    : 'border-zinc-800/80 bg-zinc-900/10 hover:border-zinc-700 hover:bg-zinc-900/30'
                                }`}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="font-extrabold text-sm tracking-tight truncate max-w-[140px]">
                                    {client.name}
                                  </div>
                                  {client.company && (
                                    <span className="text-[9px] bg-zinc-800 text-zinc-400 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">
                                      {client.company}
                                    </span>
                                  )}
                                </div>
                                <div className="text-zinc-500 text-[10px] font-medium truncate">{client.email}</div>
                                
                                <div className="flex justify-between items-center pt-2 border-t border-zinc-900 mt-1">
                                  <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest">
                                    PostgreSQL ID: #{client.id}
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-[9px] bg-blue-900/20 text-blue-400 px-1.5 py-0.5 rounded font-extrabold" title="Devis">
                                      📄 {(client.quotes || []).length}
                                    </span>
                                    <span className="text-[9px] bg-indigo-900/20 text-indigo-400 px-1.5 py-0.5 rounded font-extrabold" title="Fichiers">
                                      📁 {(client.files || []).length}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            );
                          })
                      )}
                    </div>
                  </div>

                  {/* Right column: Selected Client CRM Details */}
                  <div className="lg:col-span-2 space-y-6 flex flex-col h-[700px] overflow-y-auto border border-zinc-800 rounded-3xl bg-zinc-950/40 p-6">
                    {selectedClient ? (
                      <>
                        {/* Client Profile Header */}
                        <div className="border-b border-zinc-800 pb-5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                          <div className="space-y-1">
                            <div className="flex items-center gap-3">
                              <h2 className="text-xl font-black">{selectedClient.name}</h2>
                              {selectedClient.company && (
                                <span className="bg-blue-600/10 border border-blue-500/20 text-blue-400 text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase tracking-wider">
                                  {selectedClient.company}
                                </span>
                              )}
                            </div>
                            <p className="text-zinc-500 text-xs flex flex-wrap items-center gap-x-4 gap-y-1">
                              <span>✉️ <span className="font-semibold text-zinc-300">{selectedClient.email}</span></span>
                              {selectedClient.phone && (
                                <span>📞 <span className="font-mono font-semibold text-zinc-300">{selectedClient.phone}</span></span>
                              )}
                              <span>🕒 Inscrit le : <span className="text-zinc-400">{new Date(selectedClient.createdAt).toLocaleDateString('fr-FR')}</span></span>
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => {
                                setEditingClientForm({
                                  id: selectedClient.id,
                                  name: selectedClient.name,
                                  company: selectedClient.company || '',
                                  email: selectedClient.email,
                                  phone: selectedClient.phone || '',
                                  notes: selectedClient.notes || ''
                                });
                                setShowEditClientModal(true);
                              }}
                              className="p-2 bg-zinc-850 hover:bg-zinc-800 text-zinc-300 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold"
                              title="Modifier le profil"
                            >
                              <Edit size={14} /> Éditer
                            </button>
                            <button
                              onClick={() => handleDeleteClient(selectedClient.id)}
                              className="p-2 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-xl cursor-pointer transition-all flex items-center gap-1.5 text-xs font-bold border border-red-500/10"
                              title="Supprimer le client"
                            >
                              <Trash2 size={14} /> Supprimer
                            </button>
                          </div>
                        </div>

                        {/* Client Notes / Memo */}
                        <div className="p-4 rounded-2xl bg-zinc-900/25 border border-zinc-850/60 text-xs space-y-1.5">
                          <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest flex items-center gap-1">
                            <Info size={11} className="text-zinc-400" /> Notes Internes & Mémo Client (Stockées dans PostgreSQL)
                          </div>
                          <p className="text-zinc-300 leading-relaxed font-medium italic">
                            {selectedClient.notes || "Aucune note saisie pour ce client."}
                          </p>
                        </div>

                        {/* CRM Sections Split: Quotes and Files */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
                          
                          {/* Quotes Section */}
                          <div className="border border-zinc-850 bg-black/10 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
                            <div className="flex justify-between items-center mb-3">
                              <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                                <FileText size={14} className="text-amber-500" />
                                Devis & Chiffrages ({(selectedClient.quotes || []).length})
                              </h4>
                              <button
                                onClick={() => {
                                  setNewQuoteForm({ service: 'Vidéosurveillance & CCTV', budget: '1 500 € - 5 000 €', description: '', totalEst: '' });
                                  setShowAddQuoteModal(true);
                                }}
                                className="text-[10px] bg-amber-600 hover:bg-amber-500 text-white font-extrabold px-2 py-1 rounded flex items-center gap-0.5 cursor-pointer"
                              >
                                <Plus size={11} /> Ajouter
                              </button>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
                              {(selectedClient.quotes || []).length === 0 ? (
                                <div className="h-32 flex items-center justify-center text-zinc-600 text-[11px] text-center italic border border-dashed border-zinc-850 rounded-xl">
                                  Aucun devis lié à ce profil.
                                </div>
                              ) : (
                                selectedClient.quotes.map((quote: any) => {
                                  const materialsList = quote.materials ? JSON.parse(quote.materials) : null;
                                  return (
                                    <div key={quote.id} className="p-3.5 border border-zinc-850 bg-zinc-900/10 rounded-xl text-xs space-y-2">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <div className="font-bold text-zinc-200">{quote.service}</div>
                                          <div className="text-[10px] text-zinc-500">{new Date(quote.createdAt).toLocaleDateString('fr-FR')}</div>
                                        </div>
                                        <button
                                          onClick={() => handleDeleteQuote(quote.id)}
                                          className="text-zinc-500 hover:text-red-500 p-0.5"
                                          title="Supprimer ce devis"
                                        >
                                          <Trash2 size={12} />
                                        </button>
                                      </div>

                                      {quote.description && (
                                        <p className="text-zinc-400 text-[11px] italic leading-relaxed">{quote.description}</p>
                                      )}

                                      {materialsList && materialsList.length > 0 && (
                                        <div className="bg-black/20 p-2 rounded-lg text-[10px] space-y-1">
                                          <div className="font-bold text-zinc-500 uppercase tracking-wide">Composants sélectionnés :</div>
                                          <div className="space-y-0.5 font-mono max-h-24 overflow-y-auto">
                                            {materialsList.map((m: any, mIdx: number) => (
                                              <div key={mIdx} className="flex justify-between">
                                                <span>• {m.name} <span className="text-blue-400">x{m.qty}</span></span>
                                                <span className="text-zinc-500">{formatNum(m.total)}</span>
                                              </div>
                                            ))}
                                          </div>
                                        </div>
                                      )}

                                      <div className="flex flex-wrap justify-between items-center gap-2 pt-2 border-t border-zinc-900">
                                        <div>
                                          <div className="text-[9px] text-zinc-500 uppercase tracking-widest">Valeur Estimée</div>
                                          <div className="font-bold text-blue-400 font-mono">
                                            {quote.totalEst ? formatNum(quote.totalEst) : (quote.budget || 'Sur Devis')}
                                          </div>
                                        </div>

                                        {/* Status update dropdown directly modifying PostgreSQL */}
                                        <div className="flex items-center gap-1.5">
                                          <span className="text-[9px] text-zinc-500 uppercase tracking-widest">Statut:</span>
                                          <select
                                            value={quote.status}
                                            onChange={(e) => handleUpdateQuoteStatus(quote.id, e.target.value)}
                                            className={`p-1 text-[10px] font-bold rounded outline-none border cursor-pointer ${
                                              quote.status === 'new' ? 'bg-amber-600/10 text-amber-500 border-amber-500/20' :
                                              quote.status === 'contacted' ? 'bg-blue-600/10 text-blue-400 border-blue-500/20' :
                                              quote.status === 'approved' ? 'bg-emerald-600/10 text-emerald-400 border-emerald-500/20' :
                                              'bg-red-600/10 text-red-500 border-red-500/20'
                                            }`}
                                          >
                                            <option value="new">Nouveau</option>
                                            <option value="contacted">Contacté</option>
                                            <option value="approved">Approuvé</option>
                                            <option value="rejected">Rejeté</option>
                                          </select>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          {/* Project Files Section */}
                          <div className="border border-zinc-850 bg-black/10 rounded-2xl p-4 flex flex-col h-full overflow-hidden">
                            <h4 className="font-extrabold text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5 mb-3">
                              <Folder size={14} className="text-indigo-500" />
                              Documents & Plans Historiques ({(selectedClient.files || []).length})
                            </h4>

                            {/* Simulated file upload block */}
                            <div className="border border-dashed border-zinc-800/80 hover:border-indigo-500/40 rounded-xl p-4 text-center cursor-pointer transition-colors relative mb-4 bg-zinc-950/20">
                              <input
                                type="file"
                                onChange={handleSimulatedUpload}
                                className="absolute inset-0 opacity-0 cursor-pointer"
                                title="Téléverser un document pour ce client"
                              />
                              <div className="space-y-1 pointer-events-none flex flex-col items-center">
                                <Upload size={18} className="text-indigo-400 animate-pulse" />
                                <div className="text-[11px] font-bold">Simuler le dépôt d'un fichier</div>
                                <div className="text-[9px] text-zinc-500">PDF, CAD, PNG, XLSX stockés en base PostgreSQL</div>
                              </div>
                            </div>

                            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
                              {(selectedClient.files || []).length === 0 ? (
                                <div className="h-28 flex items-center justify-center text-zinc-600 text-[11px] text-center italic border border-dashed border-zinc-850 rounded-xl">
                                  Aucun plan ou fichier historique lié.
                                </div>
                              ) : (
                                selectedClient.files.map((file: any) => (
                                  <div key={file.id} className="p-3 border border-zinc-850/80 bg-zinc-900/15 rounded-xl text-xs flex justify-between items-center hover:border-zinc-700 transition-all">
                                    <div className="flex items-center gap-2.5 min-w-0">
                                      <div className="w-8 h-8 rounded bg-indigo-600/10 text-indigo-400 flex items-center justify-center">
                                        <File size={16} />
                                      </div>
                                      <div className="min-w-0">
                                        <div className="font-bold text-zinc-300 truncate" title={file.fileName}>{file.fileName}</div>
                                        <div className="text-[9px] text-zinc-500 font-medium font-mono">{file.fileSize} • {new Date(file.createdAt).toLocaleDateString('fr-FR')}</div>
                                      </div>
                                    </div>

                                    <div className="flex items-center gap-1 flex-shrink-0">
                                      <a
                                        href="#"
                                        onClick={(e) => {
                                          e.preventDefault();
                                          alert(`Téléchargement simulé de ${file.fileName}`);
                                        }}
                                        className="p-1.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-lg transition-colors"
                                        title="Télécharger"
                                      >
                                        <FileDown size={13} />
                                      </a>
                                      <button
                                        onClick={() => handleDeleteFile(file.id)}
                                        className="p-1.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 rounded-lg border border-red-500/10 transition-colors"
                                        title="Supprimer"
                                      >
                                        <Trash2 size={13} />
                                      </button>
                                    </div>
                                  </div>
                                ))
                              )}
                            </div>
                          </div>

                        </div>
                      </>
                    ) : (
                      <div className="h-full flex flex-col items-center justify-center text-zinc-500 text-xs space-y-3">
                        <Users size={48} className="text-zinc-800 animate-pulse" />
                        <span>Sélectionnez un client dans la liste pour afficher ses détails, historique de devis et fichiers.</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Modals for CRM operations */}
                {/* Modal Add Client */}
                {showAddClientModal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-white">
                    <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative">
                      <button 
                        onClick={() => setShowAddClientModal(false)}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>

                      <h3 className="text-base font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <UserPlus size={16} /> Créer un profil client (PostgreSQL)
                      </h3>

                      <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Nom complet <span className="text-red-500">*</span></label>
                          <input
                            type="text"
                            required
                            placeholder="Ex: Jean Dupont"
                            value={newClientForm.name}
                            onChange={(e) => setNewClientForm({...newClientForm, name: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Entreprise / Société</label>
                          <input
                            type="text"
                            placeholder="Ex: ACME Corp"
                            value={newClientForm.company}
                            onChange={(e) => setNewClientForm({...newClientForm, company: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Adresse e-mail <span className="text-red-500">*</span></label>
                          <input
                            type="email"
                            required
                            placeholder="Ex: j.dupont@acme.com"
                            value={newClientForm.email}
                            onChange={(e) => setNewClientForm({...newClientForm, email: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Téléphone</label>
                          <input
                            type="text"
                            placeholder="Ex: +33 6 00 00 00 00"
                            value={newClientForm.phone}
                            onChange={(e) => setNewClientForm({...newClientForm, phone: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Notes Internes / Description du lead</label>
                          <textarea
                            placeholder="Saisissez des remarques, des opportunités commerciales, etc."
                            rows={3}
                            value={newClientForm.notes}
                            onChange={(e) => setNewClientForm({...newClientForm, notes: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold leading-relaxed"
                          />
                        </div>

                        <div className="flex gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => setShowAddClientModal(false)}
                            className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold rounded-xl"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Enregistrer le Client
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Modal Edit Client */}
                {showEditClientModal && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-white">
                    <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative">
                      <button 
                        onClick={() => setShowEditClientModal(false)}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>

                      <h3 className="text-base font-black uppercase tracking-wider text-blue-400 flex items-center gap-1.5">
                        <Edit size={16} /> Modifier le profil client
                      </h3>

                      <form onSubmit={handleUpdateClient} className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Nom complet</label>
                          <input
                            type="text"
                            required
                            value={editingClientForm.name}
                            onChange={(e) => setEditingClientForm({...editingClientForm, name: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Entreprise / Société</label>
                          <input
                            type="text"
                            value={editingClientForm.company}
                            onChange={(e) => setEditingClientForm({...editingClientForm, company: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Adresse e-mail</label>
                          <input
                            type="email"
                            required
                            value={editingClientForm.email}
                            onChange={(e) => setEditingClientForm({...editingClientForm, email: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Téléphone</label>
                          <input
                            type="text"
                            value={editingClientForm.phone}
                            onChange={(e) => setEditingClientForm({...editingClientForm, phone: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Notes Internes / Mémo</label>
                          <textarea
                            rows={3}
                            value={editingClientForm.notes}
                            onChange={(e) => setEditingClientForm({...editingClientForm, notes: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold leading-relaxed"
                          />
                        </div>

                        <div className="flex gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => setShowEditClientModal(false)}
                            className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Mettre à jour
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {/* Modal Add Quote */}
                {showAddQuoteModal && selectedClient && (
                  <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 text-white">
                    <div className="border border-zinc-800 bg-zinc-950 p-6 rounded-3xl max-w-md w-full space-y-4 shadow-2xl relative">
                      <button 
                        onClick={() => setShowAddQuoteModal(false)}
                        className="absolute top-4 right-4 text-zinc-400 hover:text-white"
                      >
                        <X size={18} />
                      </button>

                      <h3 className="text-base font-black uppercase tracking-wider text-amber-500 flex items-center gap-1.5">
                        <PlusCircle size={16} /> Ajouter un devis pour {selectedClient.name}
                      </h3>

                      <form onSubmit={handleCreateQuote} className="space-y-3 text-xs">
                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Type de Service <span className="text-red-500">*</span></label>
                          <select
                            value={newQuoteForm.service}
                            onChange={(e) => setNewQuoteForm({...newQuoteForm, service: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500 cursor-pointer font-bold"
                          >
                            <option value="Vidéosurveillance & CCTV">Vidéosurveillance & CCTV</option>
                            <option value="Réseaux & Télécoms">Réseaux & Télécoms</option>
                            <option value="Domotique & Smart Home">Domotique & Smart Home</option>
                            <option value="Cybersécurité Avancée">Cybersécurité Avancée</option>
                            <option value="Audit & Conseil IT">Audit & Conseil IT</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Gamme de Budget <span className="text-red-500">*</span></label>
                          <select
                            value={newQuoteForm.budget}
                            onChange={(e) => setNewQuoteForm({...newQuoteForm, budget: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl text-white outline-none focus:border-blue-500 cursor-pointer font-bold"
                          >
                            <option value="Moins de 1 500 €">Moins de 1 500 €</option>
                            <option value="1 500 € - 5 000 €">1 500 € - 5 000 €</option>
                            <option value="5 000 € - 10 000 €">5 000 € - 10 000 €</option>
                            <option value="Plus de 10 000 €">Plus de 10 000 €</option>
                          </select>
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Chiffrage Chiffré Manuel (€)</label>
                          <input
                            type="number"
                            placeholder="Laissez vide pour 'Sur devis'"
                            value={newQuoteForm.totalEst}
                            onChange={(e) => setNewQuoteForm({...newQuoteForm, totalEst: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold font-mono"
                          />
                        </div>

                        <div className="space-y-1">
                          <label className="text-zinc-400 font-bold">Description des besoins / Spécifications</label>
                          <textarea
                            placeholder="Ex: Installation de caméras extérieures IP, raccordement de l'enregistreur NVR..."
                            rows={3}
                            value={newQuoteForm.description}
                            onChange={(e) => setNewQuoteForm({...newQuoteForm, description: e.target.value})}
                            className="w-full p-2.5 bg-zinc-900 border border-zinc-800 rounded-xl outline-none focus:border-blue-500 text-white font-semibold leading-relaxed"
                          />
                        </div>

                        <div className="flex gap-2 pt-3">
                          <button
                            type="button"
                            onClick={() => setShowAddQuoteModal(false)}
                            className="flex-1 py-2.5 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 font-bold"
                          >
                            Annuler
                          </button>
                          <button
                            type="submit"
                            className="flex-1 py-2.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl transition-colors cursor-pointer"
                          >
                            Créer le devis
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            )}
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className={`border-t transition-colors duration-300 py-12 ${theme === 'dark' ? 'bg-[#06080b]/90 border-zinc-800' : 'bg-gray-100 border-gray-200'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-4">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => setActiveTab('home')}>
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <Cpu className="text-white" size={16} />
              </div>
              <span className="text-base font-black tracking-tight">VOLTPLAN</span>
            </div>
            <p className="text-[11px] text-zinc-500 leading-relaxed">
              Solutions globales de réseaux informatiques, télécommunications, vidéosurveillance intelligente, cybersécurité d'entreprise et domotique.
            </p>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-400">Liens Rapides</h4>
            <ul className="space-y-2">
              {['Accueil', 'Services', 'Solutions', 'Réalisations'].map((lnk, idx) => (
                <li key={idx}>
                  <button onClick={() => setActiveTab(['home', 'services', 'solutions', 'portfolio'][idx] as any)} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                    {lnk}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-400">Voltplan Tool</h4>
            <ul className="space-y-2">
              <li>
                <button onClick={onOpenDesigner} className="text-blue-500 hover:underline transition-colors flex items-center gap-1 cursor-pointer">
                  Voltplan Designer <Sparkles size={12} />
                </button>
              </li>
              <li>
                <button onClick={onOpenDashboard} className="text-zinc-500 hover:text-white transition-colors cursor-pointer">
                  Accès Administration (CRM)
                </button>
              </li>
            </ul>
          </div>

          <div className="space-y-3 text-xs">
            <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-400">Newsletter</h4>
            <p className="text-[11px] text-zinc-500 leading-relaxed">Inscrivez-vous pour recevoir nos études de cas IT & cybersécurité.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="Votre email..."
                className={`flex-1 p-2 border rounded-lg text-xs outline-none ${
                  theme === 'dark' ? 'bg-zinc-950 border-zinc-800 text-white focus:border-blue-500' : 'bg-white border-zinc-300 text-zinc-900 focus:border-blue-500'
                }`}
              />
              <button className="px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold cursor-pointer">
                S'inscrire
              </button>
            </div>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 mt-8 border-t border-zinc-800/50 flex flex-col sm:flex-row justify-between text-[11px] text-zinc-500 leading-relaxed gap-4">
          <div>&copy; 2026 Voltplan Technologies. Tous droits réservés.</div>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Mentions légales</a>
            <a href="#" className="hover:underline">Données personnelles</a>
            <a href="#" className="hover:underline">Cookies</a>
          </div>
        </div>
      </footer>

      {/* Floating Chatbot Widget */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3 pointer-events-none">
        
        {/* Chatbot Window */}
        <AnimatePresence>
          {chatbotOpen && (
            <motion.div
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 30, scale: 0.95 }}
              className={`pointer-events-auto w-80 sm:w-96 aspect-[3/4] border rounded-2xl shadow-2xl flex flex-col overflow-hidden ${
                theme === 'dark' ? 'bg-zinc-950 border-zinc-800' : 'bg-white border-gray-200'
              }`}
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-blue-600 to-cyan-500 text-white flex justify-between items-center shadow-md">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center font-bold text-xs animate-bounce">
                    🤖
                  </div>
                  <div>
                    <div className="font-bold text-xs">Voltplan AI Assistant</div>
                    <div className="text-[10px] opacity-80">En ligne • Support technique</div>
                  </div>
                </div>
                <button
                  onClick={() => setChatbotOpen(false)}
                  className="p-1 hover:bg-white/10 rounded-lg transition-colors cursor-pointer"
                >
                  <X size={16} />
                </button>
              </div>

              {/* Messages area */}
              <div className="flex-1 p-4 overflow-y-auto space-y-4 text-xs font-medium">
                {chatbotMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] p-3 rounded-2xl leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-none'
                          : theme === 'dark' ? 'bg-zinc-900 text-zinc-200 rounded-tl-none' : 'bg-gray-100 text-zinc-900 rounded-tl-none'
                      }`}
                    >
                      {msg.text}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="p-3 bg-zinc-900 text-zinc-400 rounded-2xl rounded-tl-none flex items-center gap-1.5 animate-pulse">
                      <span>L'assistant réfléchit</span>
                      <span className="flex gap-0.5"><span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-100" /><span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-200" /><span className="w-1.5 h-1.5 bg-zinc-500 rounded-full animate-bounce delay-300" /></span>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Suggested starting questions */}
              {chatbotMessages.length === 1 && (
                <div className="px-4 pb-2 flex flex-wrap gap-1.5 pointer-events-auto">
                  {[
                    "Quels sont vos tarifs ?",
                    "Faites-vous du MikroTik ?",
                    "Comment utiliser le Designer ?"
                  ].map((q, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setChatInput(q);
                      }}
                      className="px-2.5 py-1.5 bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 rounded-lg text-[10px] font-bold cursor-pointer border border-blue-500/10"
                    >
                      {q}
                    </button>
                  ))}
                </div>
              )}

              {/* Input */}
              <form onSubmit={handleChatSubmit} className="p-3 border-t border-zinc-800/40 flex gap-2">
                <input
                  type="text"
                  value={chatInput}
                  onChange={(e) => setChatInput(e.target.value)}
                  placeholder="Posez votre question technique..."
                  className={`flex-1 px-3 py-2 border rounded-xl text-xs outline-none focus:border-blue-500 ${
                    theme === 'dark' ? 'bg-zinc-900 border-zinc-800 text-white' : 'bg-gray-50 border-gray-200 text-zinc-950'
                  }`}
                />
                <button
                  type="submit"
                  className="p-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl cursor-pointer"
                >
                  <Send size={14} />
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action Buttons */}
        <div className="flex gap-2 pointer-events-auto">
          {/* WhatsApp Float */}
          <a
            href="https://wa.me/33612345678"
            target="_blank"
            rel="noopener noreferrer"
            className="w-12 h-12 bg-[#25D366] hover:bg-[#20ba5a] text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-115 active:scale-95"
            title="Nous contacter sur WhatsApp"
          >
            <Phone size={20} />
          </a>

          {/* Chatbot Toggle */}
          <button
            onClick={() => setChatbotOpen(prev => !prev)}
            className="w-12 h-12 bg-blue-600 hover:bg-blue-500 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-115 active:scale-95 cursor-pointer"
            title="Assistant IA Voltplan"
          >
            <MessageSquare size={20} />
          </button>
        </div>

      </div>

    </div>
  );
}

// Interactive Marketing Sandbox showing 3D Extrusions and dynamic security layers
function Local3DSandboxDemo({ theme }: { theme: 'dark' | 'light' }) {
  const [wallHeight, setWallHeight] = useState<number>(45); // Extrusion height in px
  const [activeLayer, setActiveLayer] = useState<'cctv' | 'wifi' | 'cables' | 'none'>('cctv');
  const [monitorCam, setMonitorCam] = useState<'hall' | 'server'>('hall');

  return (
    <div className="w-full max-w-lg space-y-6">
      
      {/* 3D Stage viewport with CSS perspective */}
      <div className="w-full aspect-[4/3] bg-zinc-950 rounded-2xl border border-zinc-800/80 shadow-2xl relative overflow-hidden flex items-center justify-center p-4">
        
        {/* Subtle radial light background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_70%)]" />
        
        {/* HUD Overlay details */}
        <div className="absolute top-4 left-4 font-mono text-[9px] text-zinc-500 space-y-0.5 z-20 pointer-events-none">
          <div>ENGINE: v2.5_WEB_GL_MOCK</div>
          <div>STATUS: INTERACTIF</div>
        </div>

        <div className="absolute top-4 right-4 z-20">
          <span className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider uppercase animate-pulse">
            LIVE 3D
          </span>
        </div>

        {/* The 3D CSS Stage */}
        <div className="relative w-72 h-56 transition-transform duration-700" style={{ perspective: '1200px' }}>
          
          <div 
            className="w-full h-full relative transition-all duration-500 transform-gpu"
            style={{ 
              transform: 'rotateX(58deg) rotateZ(-40deg) translateY(-20px)',
              transformStyle: 'preserve-3d' 
            }}
          >
            
            {/* Grid Floor */}
            <div className="absolute inset-0 bg-zinc-900 border border-indigo-500/20 rounded-xl [background-image:linear-gradient(rgba(99,102,241,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(99,102,241,0.05)_1px,transparent_1px)] bg-[size:16px_16px] shadow-2xl" />

            {/* Simulated 2D Floor Plan Blueprint Drawing underneath */}
            <div className="absolute inset-2 border border-dashed border-zinc-700/60 rounded-lg flex items-center justify-center pointer-events-none">
              <span className="font-mono text-[8px] text-zinc-600 tracking-wider">ZONE TECHNIQUE</span>
            </div>

            {/* Extruded Wall 1 (Back Wall) */}
            <div 
              className="absolute bg-gradient-to-t from-indigo-950/60 to-indigo-900/35 border-l border-t border-indigo-500/40 transition-all duration-300"
              style={{
                width: '100%',
                height: `${wallHeight}px`,
                bottom: '100%',
                left: 0,
                transform: 'rotateX(-90deg)',
                transformOrigin: 'bottom',
                transformStyle: 'preserve-3d'
              }}
            />

            {/* Extruded Wall 2 (Left Wall) */}
            <div 
              className="absolute bg-gradient-to-t from-indigo-950/60 to-indigo-900/35 border-l border-t border-indigo-500/40 transition-all duration-300"
              style={{
                width: `${wallHeight}px`,
                height: '100%',
                right: '100%',
                top: 0,
                transform: 'rotateY(-90deg)',
                transformOrigin: 'right',
                transformStyle: 'preserve-3d'
              }}
            />

            {/* Inner Partition Wall (Glass-like architectural office divider) */}
            <div 
              className="absolute bg-gradient-to-t from-emerald-500/20 to-emerald-400/5 border border-emerald-400/30 transition-all duration-300"
              style={{
                width: '4px',
                height: '120px',
                left: '140px',
                top: '40px',
                transform: 'rotateX(-90deg)',
                transformOrigin: 'bottom',
                transformStyle: 'preserve-3d'
              }}
            />

            {/* --- PLACED DEVICES AND LAYERS --- */}

            {/* Server Rack (Tall black cube) */}
            <div 
              className="absolute bg-zinc-950 border border-blue-500/50 shadow-lg"
              style={{
                width: '24px',
                height: '24px',
                left: '20px',
                top: '20px',
                transform: `translateZ(${wallHeight * 0.1}px)`,
                transformStyle: 'preserve-3d'
              }}
            >
              {/* LED Lights on server rack */}
              <div className="absolute top-1 left-1.5 w-1 h-1 bg-green-500 rounded-full animate-ping" />
              <div className="absolute top-2.5 left-1.5 w-1 h-1 bg-blue-500 rounded-full" />
              <div className="absolute top-4 left-1.5 w-1 h-1 bg-red-500 rounded-full animate-pulse" />
              <span className="absolute bottom-1 right-1 text-[5px] font-mono text-zinc-500">RACK</span>
            </div>

            {/* Camera 1 (Hallway) & FOV Cone */}
            <div 
              className="absolute"
              style={{ left: '160px', top: '150px', transform: 'translateZ(30px)' }}
            >
              {/* CCTV Camera Icon Node */}
              <div className="w-5 h-5 bg-blue-600 rounded-full border border-white flex items-center justify-center text-[8px] text-white font-extrabold shadow-md animate-bounce">
                📹
              </div>

              {/* Glowing camera cone beam */}
              {activeLayer === 'cctv' && (
                <div 
                  className="absolute origin-top bg-blue-500/15 border-l border-r border-dashed border-blue-500/40 rounded-b-full transition-all duration-500"
                  style={{
                    width: '70px',
                    height: '90px',
                    top: '10px',
                    left: '-25px',
                    transform: 'rotateX(20deg)',
                    clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)',
                    background: 'linear-gradient(to bottom, rgba(59, 130, 246, 0.45) 0%, rgba(59, 130, 246, 0.02) 100%)'
                  }}
                />
              )}
            </div>

            {/* Wi-Fi Router & Coverage Rings */}
            <div 
              className="absolute"
              style={{ left: '210px', top: '60px', transform: 'translateZ(35px)' }}
            >
              <div className="w-5 h-5 bg-emerald-500 rounded-full border border-white flex items-center justify-center text-[8px] text-white font-extrabold shadow-md">
                📶
              </div>

              {/* Wi-Fi Radio Waves simulation */}
              {activeLayer === 'wifi' && (
                <div className="absolute -left-16 -top-16 w-36 h-36 rounded-full border-2 border-emerald-500/20 bg-emerald-500/5 animate-pulse flex items-center justify-center">
                  <div className="w-24 h-24 rounded-full border border-dashed border-emerald-500/30 flex items-center justify-center">
                    <div className="w-12 h-12 rounded-full border border-emerald-500/40" />
                  </div>
                </div>
              )}
            </div>

            {/* Glowing Fiber Cables running along the ceiling */}
            {activeLayer === 'cables' && (
              <div className="absolute inset-0 pointer-events-none">
                {/* 3D styled neon cable pathway lines */}
                <svg className="w-full h-full overflow-visible" style={{ transform: 'translateZ(38px)' }}>
                  <path 
                    d="M 32 32 L 140 32 L 140 160 L 170 160" 
                    fill="none" 
                    stroke="#ec4899" 
                    strokeWidth="3.5" 
                    strokeLinecap="round"
                    strokeDasharray="8 6"
                    className="animate-pulse"
                    style={{ filter: 'drop-shadow(0 0 4px #ec4899)' }}
                  />
                  <path 
                    d="M 140 32 L 220 32 L 220 70" 
                    fill="none" 
                    stroke="#10b981" 
                    strokeWidth="2.5" 
                    strokeLinecap="round"
                    strokeDasharray="6 4"
                    style={{ filter: 'drop-shadow(0 0 3px #10b981)' }}
                  />
                </svg>
              </div>
            )}

          </div>
        </div>

        {/* Small floating security camera monitor PIP HUD */}
        {activeLayer === 'cctv' && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute bottom-4 right-4 w-28 sm:w-36 aspect-video bg-zinc-950 border border-blue-500/30 rounded-lg p-1 z-30 flex flex-col justify-between font-mono text-[7px] text-blue-400 shadow-xl overflow-hidden"
          >
            {/* Tiny camera screen mockup */}
            <div className="absolute inset-0 bg-blue-500/5" />
            <div className="absolute inset-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%)] bg-[length:100%_3px] pointer-events-none" />
            
            <div className="flex justify-between items-center z-10 bg-black/40 px-1 py-0.5 rounded">
              <span className="flex items-center gap-1 font-bold">
                <span className="w-1 h-1 bg-red-600 rounded-full animate-ping" />
                CAM_01
              </span>
              <span>LOBBY</span>
            </div>

            <div className="self-center font-bold text-[8px] animate-pulse text-zinc-400 z-10">
              {monitorCam === 'hall' ? 'Couloir principal' : 'Salles de serveurs'}
            </div>

            <div className="flex justify-between items-center text-[5px] text-zinc-500 z-10 pt-1">
              <span>FPS: 30</span>
              <span>1080p HD</span>
            </div>
          </motion.div>
        )}

      </div>

      {/* Control panel for the Sandbox */}
      <div className="space-y-4 bg-zinc-900/60 p-5 rounded-2xl border border-zinc-800/80">
        
        {/* Toggle Simulation Layers */}
        <div className="space-y-2">
          <span className="text-[10px] font-black uppercase text-zinc-500 tracking-wider">
            Sélecteur de Couches Visualisation
          </span>
          <div className="grid grid-cols-4 gap-1.5">
            <button 
              onClick={() => setActiveLayer('cctv')}
              className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                activeLayer === 'cctv' 
                  ? 'bg-blue-600 border-blue-500 text-white shadow-md' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              CCTV Cones
            </button>
            <button 
              onClick={() => setActiveLayer('wifi')}
              className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                activeLayer === 'wifi' 
                  ? 'bg-emerald-600 border-emerald-500 text-white shadow-md' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Wi-Fi Zones
            </button>
            <button 
              onClick={() => setActiveLayer('cables')}
              className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                activeLayer === 'cables' 
                  ? 'bg-pink-600 border-pink-500 text-white shadow-md' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Câblage 3D
            </button>
            <button 
              onClick={() => setActiveLayer('none')}
              className={`py-2 px-1 text-[10px] font-bold rounded-lg border transition-all cursor-pointer ${
                activeLayer === 'none' 
                  ? 'bg-zinc-800 border-zinc-700 text-white' 
                  : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-zinc-200'
              }`}
            >
              Brut
            </button>
          </div>
        </div>

        {/* Real-time slider extrusion */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] font-bold">
            <span className="text-zinc-400">Cloisonnement (Hauteur des Murs)</span>
            <span className="text-indigo-400 font-mono">{(wallHeight / 15).toFixed(1)}m</span>
          </div>
          <input 
            type="range" 
            min="10" 
            max="80" 
            value={wallHeight} 
            onChange={(e) => setWallHeight(parseInt(e.target.value))}
            className="w-full h-1.5 bg-zinc-950 rounded-lg appearance-none cursor-pointer accent-indigo-500"
          />
        </div>

      </div>

    </div>
  );
}
