import { useState, useEffect } from 'react';
import { 
  User, 
  MapPin, 
  Phone, 
  Mail, 
  Plus, 
  Search, 
  Trash2, 
  Edit2, 
  Cloud, 
  CloudOff, 
  LogIn, 
  LogOut, 
  Check, 
  Loader2, 
  Building,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { Client } from '../../types';
import { 
  auth, 
  db, 
  loginWithGoogle, 
  logoutUser, 
  handleFirestoreError, 
  OperationType 
} from '../../lib/firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  setDoc, 
  deleteDoc, 
  doc, 
  serverTimestamp 
} from 'firebase/firestore';

interface ClientDatabaseTabProps {
  theme: 'dark' | 'light';
  onSelectClient: (client: { name: string; address: string }) => void;
  currentClientName?: string;
  currentClientAddress?: string;
}

export default function ClientDatabaseTab({ 
  theme, 
  onSelectClient,
  currentClientName = '',
  currentClientAddress = ''
}: ClientDatabaseTabProps) {
  const [clients, setClients] = useState<Client[]>([]);
  const [localClients, setLocalClients] = useState<Client[]>(() => {
    const saved = localStorage.getItem('local_clients_db');
    return saved ? JSON.parse(saved) : [];
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Form State
  const [isEditing, setIsEditing] = useState<string | null>(null); // client ID if editing
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  // Auth & Cloud State
  const [user, setUser] = useState(auth.currentUser);
  const [authLoading, setAuthLoading] = useState(false);
  const [dbLoading, setDbLoading] = useState(false);

  // Sync Auth State
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((u) => {
      setUser(u);
    });
    return () => unsubscribe();
  }, []);

  // Set clients based on Auth State
  useEffect(() => {
    if (!user) {
      // Offline/Local mode: Use local clients
      setClients(localClients);
      return;
    }

    // Cloud Mode: Subscribe to Firestore clients
    setDbLoading(true);
    const clientsRef = collection(db, 'clients');
    const q = query(clientsRef, where('userId', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedClients: Client[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        fetchedClients.push({
          id: docSnap.id,
          name: data.name || '',
          address: data.address || '',
          phone: data.phone || '',
          email: data.email || '',
          userId: data.userId || '',
          createdAt: data.createdAt,
          updatedAt: data.updatedAt
        });
      });
      
      // Sort by name
      fetchedClients.sort((a, b) => a.name.localeCompare(b.name));
      setClients(fetchedClients);
      setDbLoading(false);
      
      // Auto Sync outstanding local clients
      syncLocalToCloud(fetchedClients, user.uid);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'clients');
      setDbLoading(false);
    });

    return () => unsubscribe();
  }, [user, localClients]);

  // Sync local client state to local storage
  const saveLocalClients = (updated: Client[]) => {
    setLocalClients(updated);
    localStorage.setItem('local_clients_db', JSON.stringify(updated));
    if (!user) {
      setClients(updated);
    }
  };

  // Sync offline clients to Firestore on login
  const syncLocalToCloud = async (cloudList: Client[], uid: string) => {
    if (localClients.length === 0) return;
    
    let syncedCount = 0;
    for (const local of localClients) {
      // Check if this local client is already in the cloud by name
      const alreadyInCloud = cloudList.some(
        c => c.name.toLowerCase().trim() === local.name.toLowerCase().trim()
      );
      
      if (!alreadyInCloud) {
        try {
          const docId = local.id || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          const docRef = doc(db, 'clients', docId);
          await setDoc(docRef, {
            name: local.name,
            address: local.address,
            phone: local.phone || '',
            email: local.email || '',
            userId: uid,
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp()
          });
          syncedCount++;
        } catch (err) {
          console.error("Failed to sync client to cloud:", err);
        }
      }
    }

    if (syncedCount > 0) {
      // Clear local storage after successful sync to prevent duplicate syncs
      saveLocalClients([]);
      showSuccess(`${syncedCount} client(s) locaux synchronisés vers votre cloud.`);
    }
  };

  const showSuccess = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 4000);
  };

  // Google Login Action
  const handleLogin = async () => {
    setAuthLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
      showSuccess("Connexion réussie ! Vos données sont maintenant synchronisées en temps réel sur le cloud.");
    } catch (err: any) {
      setError("Erreur de connexion : " + (err.message || String(err)));
    } finally {
      setAuthLoading(false);
    }
  };

  // Logout Action
  const handleLogout = async () => {
    setAuthLoading(true);
    try {
      await logoutUser();
      showSuccess("Déconnexion réussie. Mode local activé.");
    } catch (err: any) {
      setError("Erreur lors de la déconnexion : " + err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  // Handle Create or Update
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) {
      setError("Le nom du client est requis.");
      return;
    }
    if (!address.trim()) {
      setError("L'adresse du client est requise.");
      return;
    }

    const clientData = {
      name: name.trim(),
      address: address.trim(),
      phone: phone.trim(),
      email: email.trim()
    };

    if (user) {
      // Save to Cloud Firestore
      setDbLoading(true);
      try {
        const id = isEditing || `client_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
        const path = `clients/${id}`;
        
        await setDoc(doc(db, 'clients', id), {
          ...clientData,
          userId: user.uid,
          createdAt: isEditing ? clients.find(c => c.id === isEditing)?.createdAt || serverTimestamp() : serverTimestamp(),
          updatedAt: serverTimestamp()
        });

        showSuccess(isEditing ? "Client modifié avec succès dans le cloud !" : "Nouveau client enregistré dans le cloud !");
        resetForm();
      } catch (err) {
        handleFirestoreError(err, isEditing ? OperationType.UPDATE : OperationType.CREATE, `clients/${isEditing || 'new'}`);
      } finally {
        setDbLoading(false);
      }
    } else {
      // Save to Local Storage
      if (isEditing) {
        const updated = localClients.map(c => c.id === isEditing ? {
          ...c,
          ...clientData,
          updatedAt: new Date().toISOString()
        } : c);
        saveLocalClients(updated);
        showSuccess("Client modifié localement avec succès !");
      } else {
        const newClient: Client = {
          id: `client_${Date.now()}`,
          ...clientData,
          userId: 'local',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        saveLocalClients([...localClients, newClient]);
        showSuccess("Client enregistré localement avec succès !");
      }
      resetForm();
    }
  };

  // Edit action
  const startEdit = (client: Client) => {
    setIsEditing(client.id);
    setName(client.name);
    setAddress(client.address);
    setPhone(client.phone || '');
    setEmail(client.email || '');
  };

  const resetForm = () => {
    setIsEditing(null);
    setName('');
    setAddress('');
    setPhone('');
    setEmail('');
    setError(null);
  };

  // Delete action
  const handleDelete = async (clientId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer ce client ?")) return;
    
    setError(null);
    if (user) {
      setDbLoading(true);
      try {
        await deleteDoc(doc(db, 'clients', clientId));
        showSuccess("Client supprimé avec succès du cloud.");
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `clients/${clientId}`);
      } finally {
        setDbLoading(false);
      }
    } else {
      const updated = localClients.filter(c => c.id !== clientId);
      saveLocalClients(updated);
      showSuccess("Client supprimé localement.");
    }
  };

  // Quick select action
  const selectClient = (client: Client) => {
    onSelectClient({ name: client.name, address: client.address });
    showSuccess(`Client "${client.name}" sélectionné pour la facture.`);
  };

  // Filter clients based on query
  const filteredClients = clients.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (c.phone && c.phone.includes(searchQuery))
  );

  return (
    <div className={cn(
      "flex-1 flex flex-col overflow-hidden p-6 space-y-6 transition-colors duration-300",
      theme === 'dark' ? "bg-zinc-950" : "bg-white"
    )}>
      {/* Header with auth status */}
      <div className={cn(
        "flex flex-col md:flex-row gap-4 items-center justify-between border-b pb-4 shrink-0 transition-colors duration-300",
        theme === 'dark' ? "border-zinc-800" : "border-zinc-200"
      )}>
        <div>
          <h3 className={cn(
            "text-base font-bold flex items-center gap-2 transition-colors duration-300",
            theme === 'dark' ? "text-white" : "text-zinc-900"
          )}>
            <User className="text-emerald-500" size={18} />
            Gestionnaire de Base de Données Clients
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Enregistrez vos clients habituels pour pouvoir les sélectionner instantanément sur vos devis et factures.
          </p>
        </div>

        {/* Cloud Authentication Card */}
        <div className={cn(
          "flex items-center gap-3 px-4 py-2 border rounded-xl transition-all duration-300 text-xs shrink-0",
          theme === 'dark' 
            ? "bg-zinc-900/40 border-zinc-800" 
            : "bg-zinc-50 border-zinc-200"
        )}>
          {authLoading ? (
            <div className="flex items-center gap-2 text-zinc-400">
              <Loader2 className="animate-spin" size={14} />
              <span>Authentification...</span>
            </div>
          ) : user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-emerald-500 font-medium">
                <Cloud size={14} />
                <span>Cloud activé ({user.email})</span>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className={cn(
                  "flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded cursor-pointer transition-colors",
                  theme === 'dark' ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300" : "bg-zinc-200 hover:bg-zinc-300 text-zinc-700"
                )}
                title="Se déconnecter"
              >
                <LogOut size={12} />
                Déconnexion
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 text-amber-500 font-medium">
                <CloudOff size={14} />
                <span>Stockage local (non connecté)</span>
              </div>
              <button
                type="button"
                onClick={handleLogin}
                className="flex items-center gap-1 text-[10px] font-bold bg-blue-600 hover:bg-blue-500 text-white px-2 py-1 rounded cursor-pointer transition-colors shadow-sm"
              >
                <LogIn size={12} />
                Se connecter avec Google
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Success/Error Alerts */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 rounded-lg text-xs font-medium">
          {error}
        </div>
      )}
      {successMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-lg text-xs font-medium flex items-center gap-2">
          <Check size={14} />
          {successMsg}
        </div>
      )}

      {/* Layout Grid */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 overflow-hidden">
        
        {/* Left column: Create / Edit Form */}
        <div className={cn(
          "w-full lg:w-96 shrink-0 border rounded-xl p-5 space-y-4 flex flex-col h-fit transition-colors duration-300",
          theme === 'dark' ? "bg-zinc-900/20 border-zinc-800/80" : "bg-zinc-50 border-zinc-200"
        )}>
          <h4 className={cn(
            "text-xs font-bold uppercase tracking-wider flex items-center gap-2 border-b pb-2",
            theme === 'dark' ? "text-zinc-300 border-zinc-800" : "text-zinc-700 border-zinc-200"
          )}>
            {isEditing ? <Edit2 size={12} className="text-blue-500" /> : <Plus size={14} className="text-emerald-500" />}
            {isEditing ? "Modifier le Client" : "Enregistrer un Nouveau Client"}
          </h4>

          <form onSubmit={handleSubmit} className="space-y-3">
            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase">Nom du client / Entreprise *</label>
              <div className="relative mt-1">
                <Building className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                <input
                  type="text"
                  required
                  placeholder="Ex: GVA - CANALBOX TOGO"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className={cn(
                    "w-full border rounded-lg text-xs pl-9 pr-3 py-2 outline-none focus:border-emerald-500 transition-colors",
                    theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                  )}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase">Adresse & Contacts *</label>
              <textarea
                required
                placeholder="Ex: contact-togo@gva.africa&#10;Tél: (+228) 22 53 02 82"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                rows={3}
                className={cn(
                  "w-full border rounded-lg text-xs px-3 py-2 outline-none focus:border-emerald-500 transition-colors mt-1 resize-none",
                  theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                )}
              />
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase">Téléphone (Optionnel)</label>
              <div className="relative mt-1">
                <Phone className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                <input
                  type="text"
                  placeholder="Ex: +228 22 53 02 82"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className={cn(
                    "w-full border rounded-lg text-xs pl-9 pr-3 py-2 outline-none focus:border-emerald-500 transition-colors",
                    theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                  )}
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] text-zinc-500 font-bold uppercase">E-mail (Optionnel)</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-2.5 text-zinc-500" size={14} />
                <input
                  type="email"
                  placeholder="Ex: client@gva.africa"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={cn(
                    "w-full border rounded-lg text-xs pl-9 pr-3 py-2 outline-none focus:border-emerald-500 transition-colors",
                    theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                  )}
                />
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              {isEditing && (
                <button
                  type="button"
                  onClick={resetForm}
                  className={cn(
                    "flex-1 text-xs font-semibold py-2 rounded-lg cursor-pointer transition-colors border",
                    theme === 'dark' 
                      ? "bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border-zinc-700" 
                      : "bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border-zinc-200"
                  )}
                >
                  Annuler
                </button>
              )}
              <button
                type="submit"
                disabled={dbLoading}
                className="flex-1 flex items-center justify-center gap-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg cursor-pointer transition-colors shadow-sm disabled:opacity-50"
              >
                {dbLoading && <Loader2 className="animate-spin" size={12} />}
                {isEditing ? "Enregistrer" : "Ajouter le client"}
              </button>
            </div>
          </form>
        </div>

        {/* Right column: Clients Directory */}
        <div className={cn(
          "flex-1 flex flex-col overflow-hidden border rounded-xl p-5 space-y-4 transition-colors duration-300",
          theme === 'dark' ? "bg-zinc-900/10 border-zinc-800/80" : "bg-white border-zinc-200"
        )}>
          <div className="flex flex-col sm:flex-row gap-3 justify-between items-center shrink-0">
            <h4 className={cn(
              "text-xs font-bold uppercase tracking-wider flex items-center gap-2",
              theme === 'dark' ? "text-zinc-300" : "text-zinc-700"
            )}>
              <span>Annuaire des Clients Réguliers</span>
              <span className="px-2 py-0.5 text-[10px] rounded-full bg-blue-600/15 text-blue-500 font-bold">
                {filteredClients.length} client(s)
              </span>
            </h4>

            {/* Search Input */}
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-2.5 text-zinc-500" size={14} />
              <input
                type="text"
                placeholder="Rechercher un client..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={cn(
                  "w-full border rounded-lg text-xs pl-9 pr-3 py-2 outline-none focus:border-emerald-500 transition-colors",
                  theme === 'dark' ? "bg-zinc-950 border-zinc-800 text-white" : "bg-white border-zinc-300 text-zinc-900"
                )}
              />
            </div>
          </div>

          {/* Directory Grid */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">
            {dbLoading && filteredClients.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-zinc-500 gap-2">
                <Loader2 className="animate-spin text-emerald-500" size={24} />
                <span className="text-xs">Chargement de la base de données...</span>
              </div>
            ) : filteredClients.length === 0 ? (
              <div className={cn(
                "h-full border-2 border-dashed rounded-xl flex flex-col items-center justify-center p-8 text-center transition-colors duration-300",
                theme === 'dark' ? "border-zinc-800 bg-zinc-950/20" : "border-zinc-200 bg-zinc-50"
              )}>
                <User className="text-zinc-500 mb-2" size={32} />
                <p className="text-xs font-semibold text-zinc-400">Aucun client trouvé</p>
                <p className="text-[11px] text-zinc-500 mt-1 max-w-sm">
                  {searchQuery ? "Essayez d'ajuster vos termes de recherche." : "Enregistrez votre premier client régulier à l'aide du formulaire à gauche."}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredClients.map((client) => {
                  const isCurrentlyUsed = 
                    client.name.toLowerCase().trim() === currentClientName.toLowerCase().trim() &&
                    client.address.toLowerCase().trim() === currentClientAddress.toLowerCase().trim();

                  return (
                    <div
                      key={client.id}
                      className={cn(
                        "border rounded-xl p-4 flex flex-col justify-between gap-4 transition-all duration-300",
                        theme === 'dark' 
                          ? "bg-zinc-900/40 border-zinc-800/80 hover:border-zinc-700 hover:bg-zinc-900/60" 
                          : "bg-zinc-50 border-zinc-200 hover:border-zinc-300 hover:bg-zinc-100/60 shadow-sm",
                        isCurrentlyUsed && (theme === 'dark' ? "border-emerald-500/60 bg-emerald-950/10" : "border-emerald-500 bg-emerald-50/40")
                      )}
                    >
                      <div className="space-y-2">
                        {/* Title & Status */}
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h5 className={cn(
                              "text-xs font-bold transition-colors",
                              theme === 'dark' ? "text-white" : "text-zinc-900"
                            )}>
                              {client.name}
                            </h5>
                          </div>
                          {isCurrentlyUsed && (
                            <span className="flex items-center gap-1 text-[9px] bg-emerald-500/10 text-emerald-500 font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border border-emerald-500/20">
                              <Check size={8} /> Actif
                            </span>
                          )}
                        </div>

                        {/* Details */}
                        <div className="space-y-1.5 text-xs">
                          <p className="text-zinc-400 flex items-start gap-1.5 text-[11px] leading-relaxed">
                            <MapPin className="text-zinc-500 shrink-0 mt-0.5" size={12} />
                            <span className="whitespace-pre-line">{client.address}</span>
                          </p>
                          {client.phone && (
                            <p className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                              <Phone className="text-zinc-500 shrink-0" size={12} />
                              <span>{client.phone}</span>
                            </p>
                          )}
                          {client.email && (
                            <p className="text-zinc-400 flex items-center gap-1.5 text-[11px]">
                              <Mail className="text-zinc-500 shrink-0" size={12} />
                              <span className="truncate">{client.email}</span>
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className={cn(
                        "flex items-center justify-between border-t pt-3 transition-colors duration-300",
                        theme === 'dark' ? "border-zinc-800" : "border-zinc-200"
                      )}>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => startEdit(client)}
                            className={cn(
                              "p-1.5 rounded hover:bg-blue-500/10 hover:text-blue-500 transition-colors text-zinc-500",
                              theme === 'dark' ? "hover:bg-zinc-800" : "hover:bg-zinc-200"
                            )}
                            title="Modifier les coordonnées"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(client.id)}
                            className={cn(
                              "p-1.5 rounded hover:bg-red-500/10 hover:text-red-500 transition-colors text-zinc-500",
                              theme === 'dark' ? "hover:bg-zinc-800" : "hover:bg-zinc-200"
                            )}
                            title="Supprimer le client"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={isCurrentlyUsed}
                          onClick={() => selectClient(client)}
                          className={cn(
                            "flex items-center gap-1 text-[10px] font-bold px-2.5 py-1.5 rounded-lg cursor-pointer transition-all",
                            isCurrentlyUsed
                              ? "bg-zinc-800 text-zinc-500 cursor-default border border-zinc-700/30"
                              : "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                          )}
                        >
                          Choisir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
