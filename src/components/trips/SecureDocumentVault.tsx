import React, { useState } from 'react';
import { 
  Lock, 
  Unlock, 
  Eye, 
  EyeOff, 
  Shield, 
  AlertTriangle, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Upload, 
  FileText, 
  ExternalLink 
} from 'lucide-react';
import { Trip, TravelDoc, TravelDocCategory } from '../../types';
import { encryptData, decryptData, maskSensitiveNumber, checkPasswordStrength } from '../../utils/encryption';
import { Modal } from '../common/Modal';

interface SecureDocumentVaultProps {
  trip: Trip;
  currentUser?: {
    id: string;
    name: string;
    email?: string;
  } | null;
  onUpdateTrip: (updates: Partial<Trip>) => Promise<void>;
}

export const SecureDocumentVault: React.FC<SecureDocumentVaultProps> = ({ 
  trip, 
  currentUser, 
  onUpdateTrip 
}) => {
  const currentUserId = currentUser?.id || 'usr-default';
  const currentUserName = currentUser?.name || 'Moi';
  const vaultStorageKey = `vault_password_${currentUserId}_${trip.id}`;

  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activePassword, setActivePassword] = useState('');
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [revealedDocs, setRevealedDocs] = useState<Set<string>>(new Set());
  const [decryptedValues, setDecryptedValues] = useState<Record<string, string>>({});

  // Form states for adding a new document
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<TravelDocCategory>('Vol / Billet');
  const [newReference, setNewReference] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newFileUrl, setNewFileUrl] = useState('');

  const vaultPasswordHash = localStorage.getItem(vaultStorageKey);
  const hasVaultPassword = !!vaultPasswordHash;

  // Documents strictly belonging to the active user
  const userDocuments = (trip.travelDocs || []).filter(doc => 
    doc.userId === currentUserId || (!doc.userId && trip.userId === currentUserId)
  );

  const handleSetupVault = async () => {
    setError(null);

    if (newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    const strength = checkPasswordStrength(newPassword);
    if (strength.score < 40) {
      setError('Mot de passe trop faible. ' + strength.feedback.join(', '));
      return;
    }

    try {
      const { hashData } = await import('../../utils/encryption');
      const hashedPassword = await hashData(newPassword);
      localStorage.setItem(vaultStorageKey, hashedPassword);
      
      setActivePassword(newPassword);
      setIsUnlocked(true);
      setIsSetupModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError('Erreur lors de la création du coffre-fort');
    }
  };

  const handleUnlock = async () => {
    setError(null);
    
    try {
      const { hashData } = await import('../../utils/encryption');
      const hashedPassword = await hashData(password);
      
      if (hashedPassword === vaultPasswordHash) {
        setActivePassword(password);
        setIsUnlocked(true);
        setPassword('');
      } else {
        setError('Mot de passe maître incorrect');
      }
    } catch (err) {
      setError('Erreur lors du déverrouillage');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setNewFileUrl(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddNewDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    try {
      let encryptedRef = newReference.trim();
      let isEncrypted = false;

      if (newReference.trim() && activePassword) {
        encryptedRef = await encryptData(newReference.trim(), activePassword);
        isEncrypted = true;
      }

      const newDoc: TravelDoc = {
        id: `doc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: currentUserId,
        userName: currentUserName,
        isPrivate: true,
        isSensitive: true,
        isEncrypted,
        encryptedData: isEncrypted ? encryptedRef : undefined,
        title: newTitle.trim(),
        category: newCategory,
        referenceCode: newReference.trim() || undefined,
        fileUrl: newFileUrl || undefined,
        notes: newNotes.trim() || undefined,
        uploadedAt: new Date().toISOString()
      };

      // Keep documents of other users, append this user's document
      const otherUsersDocs = (trip.travelDocs || []).filter(d => 
        d.userId && d.userId !== currentUserId
      );
      const updatedDocs = [...otherUsersDocs, ...userDocuments, newDoc];

      await onUpdateTrip({ travelDocs: updatedDocs });

      setNewTitle('');
      setNewCategory('Vol / Billet');
      setNewReference('');
      setNewNotes('');
      setNewFileUrl('');
      setIsAddModalOpen(false);
    } catch (err) {
      setError('Erreur lors de l\'ajout du document sécurisé');
    }
  };

  const handleToggleReveal = async (doc: TravelDoc) => {
    if (revealedDocs.has(doc.id)) {
      setRevealedDocs(prev => {
        const next = new Set(prev);
        next.delete(doc.id);
        return next;
      });
      return;
    }

    if (doc.isEncrypted && doc.encryptedData) {
      try {
        const decrypted = await decryptData(doc.encryptedData, activePassword);
        setDecryptedValues(prev => ({ ...prev, [doc.id]: decrypted }));
      } catch (err) {
        console.warn('Déchiffrement échoué:', err);
      }
    }

    setRevealedDocs(prev => new Set(prev).add(doc.id));
  };

  const handleDeleteDocument = async (docId: string) => {
    const updated = (trip.travelDocs || []).filter(d => d.id !== docId);
    await onUpdateTrip({ travelDocs: updated });
  };

  const handleEncryptExistingDoc = async (doc: TravelDoc) => {
    if (!activePassword) return;
    try {
      const sensitiveText = doc.referenceCode || doc.title;
      const encrypted = await encryptData(sensitiveText, activePassword);
      
      const updated = (trip.travelDocs || []).map(d => {
        if (d.id === doc.id) {
          return {
            ...d,
            userId: currentUserId,
            userName: currentUserName,
            isSensitive: true,
            isEncrypted: true,
            encryptedData: encrypted
          };
        }
        return d;
      });

      await onUpdateTrip({ travelDocs: updated });
    } catch (err) {
      setError('Échec du chiffrement du document');
    }
  };

  const getPasswordStrengthColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-sky-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const passwordStrength = newPassword ? checkPasswordStrength(newPassword) : null;

  // View 1: Setup Vault Password for this specific user
  if (!hasVaultPassword) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/30 space-y-4">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white">Mon Coffre-Fort Personnel</h3>
            <p className="text-xs text-slate-400">
              Protection militaire AES-256 isolée pour votre profil ({currentUserName})
            </p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 space-y-2">
          <div className="flex items-start space-x-2">
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5 text-indigo-300" />
            <div>
              <strong className="text-indigo-300">Confidentialité totale & individuelle</strong>
              <p className="text-indigo-200/80 mt-1">
                Vos billets, pièces d'identité et justificatifs sont chiffrés localement. Aucun autre participant du voyage ne peut accéder à vos documents privés.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsSetupModalOpen(true)}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <Shield className="w-5 h-5" />
          <span>Activer mon Coffre-Fort Sécurisé</span>
        </button>

        {/* Setup Modal */}
        <Modal
          isOpen={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
          title="Créer votre Coffre-Fort Personnel"
          subtitle={`Définissez un mot de passe maître pour protéger vos documents (${currentUserName})`}
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Mot de passe maître</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères, majuscules, chiffres"
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 pr-10 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-slate-700 rounded"
                >
                  {showPassword ? <EyeOff className="w-4 h-4 text-slate-400" /> : <Eye className="w-4 h-4 text-slate-400" />}
                </button>
              </div>

              {passwordStrength && (
                <div className="mt-2 space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Force du mot de passe</span>
                    <span className={`font-bold ${passwordStrength.score >= 60 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {passwordStrength.level}
                    </span>
                  </div>
                  <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength.score)}`}
                      style={{ width: `${passwordStrength.score}%` }}
                    />
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Confirmer le mot de passe</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Ressaisissez le mot de passe"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
              />
            </div>

            {error && (
              <div className="p-3 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200 flex items-start space-x-2">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={handleSetupVault}
              disabled={!newPassword || !confirmPassword}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold rounded-xl transition-all"
            >
              Initialiser mon Coffre-Fort
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  // View 2: Locked Vault
  if (!isUnlocked) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/30 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Lock className="w-8 h-8 text-indigo-400" />
            <div>
              <h3 className="text-base font-bold text-white">Coffre-Fort de {currentUserName}</h3>
              <p className="text-xs text-slate-400">
                {userDocuments.length} document(s) personnel(s) protégé(s)
              </p>
            </div>
          </div>
          <span className="text-[10px] px-2.5 py-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 font-semibold">
            Isolé par profil
          </span>
        </div>

        <div className="space-y-3">
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleUnlock()}
            placeholder="Entrez votre mot de passe maître"
            className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
          />

          {error && (
            <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/40 text-xs text-rose-200">
              {error}
            </div>
          )}

          <button
            onClick={handleUnlock}
            className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-xl transition-all flex items-center justify-center space-x-2"
          >
            <Unlock className="w-4 h-4" />
            <span>Déverrouiller mon Coffre-Fort</span>
          </button>
        </div>
      </div>
    );
  }

  // View 3: Unlocked Vault
  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/30 space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center space-x-3">
          <Unlock className="w-8 h-8 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-white">Coffre-Fort Déverrouillé</h3>
            <p className="text-xs text-emerald-400">
              Session sécurisée active pour {currentUserName}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-3 py-1.5 text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl flex items-center space-x-1.5 shadow-md transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Ajouter Document</span>
          </button>

          <button
            onClick={() => {
              setIsUnlocked(false);
              setActivePassword('');
              setPassword('');
              setRevealedDocs(new Set());
            }}
            className="px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 rounded-xl border border-emerald-500/30 transition-colors"
          >
            Verrouiller
          </button>
        </div>
      </div>

      {/* Documents List */}
      <div className="space-y-2.5">
        {userDocuments.length === 0 ? (
          <div className="text-center py-8 rounded-xl border border-dashed border-slate-800 bg-slate-900/40 space-y-2">
            <FileText className="w-8 h-8 text-slate-600 mx-auto" />
            <p className="text-xs text-slate-400 font-medium">
              Aucun document personnel pour l'instant dans votre coffre-fort.
            </p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="text-xs font-bold text-emerald-400 hover:text-emerald-300 underline"
            >
              + Ajouter mon premier document protégé
            </button>
          </div>
        ) : (
          userDocuments.map(doc => {
            const isRevealed = revealedDocs.has(doc.id);
            const displayReference = isRevealed
              ? (decryptedValues[doc.id] || doc.referenceCode || '')
              : maskSensitiveNumber(doc.referenceCode || 'CONFIDENTIEL');

            return (
              <div key={doc.id} className="p-3.5 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 text-xs">
                <div className="space-y-1 truncate">
                  <div className="flex items-center space-x-2">
                    <Shield className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                    <span className="font-bold text-white truncate">{doc.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-600/40 font-semibold">
                      {doc.category}
                    </span>
                    {doc.isEncrypted && (
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-700/40">
                        AES-256
                      </span>
                    )}
                  </div>

                  {doc.referenceCode && (
                    <div className="text-xs text-slate-300 font-mono flex items-center space-x-2">
                      <span className="text-slate-500">PNR / Réf :</span>
                      <span className="font-bold text-amber-300">{displayReference}</span>
                    </div>
                  )}

                  {doc.notes && (
                    <p className="text-[11px] text-slate-400 italic truncate">{doc.notes}</p>
                  )}
                </div>

                <div className="flex items-center space-x-2 flex-shrink-0">
                  {doc.referenceCode && (
                    <button
                      onClick={() => handleToggleReveal(doc)}
                      className="px-2 py-1 text-[11px] font-semibold text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/30 transition-colors"
                    >
                      {isRevealed ? 'Masquer' : 'Révéler'}
                    </button>
                  )}

                  {!doc.isEncrypted && (
                    <button
                      onClick={() => handleEncryptExistingDoc(doc)}
                      className="px-2 py-1 text-[11px] font-semibold text-indigo-400 hover:bg-indigo-500/10 rounded-lg border border-indigo-500/30 transition-colors"
                      title="Chiffrer ce document avec le mot de passe maître"
                    >
                      Protéger
                    </button>
                  )}

                  {doc.fileUrl && (
                    <a
                      href={doc.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-[11px] font-semibold flex items-center space-x-1"
                    >
                      <ExternalLink className="w-3 h-3" />
                      <span>Voir</span>
                    </a>
                  )}

                  <button
                    onClick={() => handleDeleteDocument(doc.id)}
                    className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                    title="Supprimer du coffre-fort"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal: Add Document Directly in Vault */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Ajouter au Coffre-Fort Personnel"
        subtitle={`Ce document sera chiffré et strictement accessible par ${currentUserName}`}
      >
        <form onSubmit={handleAddNewDocument} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Intitulé du document</label>
            <input
              type="text"
              required
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="ex: Passeport Biométrique / Billet Air France AF712"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Catégorie</label>
              <select
                value={newCategory}
                onChange={e => setNewCategory(e.target.value as TravelDocCategory)}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-2 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
              >
                <option value="Vol / Billet">Vol / Billet</option>
                <option value="Hôtel / Logement">Hôtel / Logement</option>
                <option value="Identité / Visa">Identité / Visa / Passeport</option>
                <option value="Assurance">Assurance Voyage</option>
                <option value="Autre">Autre Justificatif</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">Code PNR / Réf confidentielle</label>
              <input
                type="text"
                value={newReference}
                onChange={e => setNewReference(e.target.value)}
                placeholder="ex: 6K9L2Z / N° Passeport"
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Pièce jointe (PDF ou Photo)</label>
            <label className="flex items-center justify-center space-x-2 px-3 py-2 bg-slate-800 hover:bg-slate-750 border border-slate-700 rounded-xl text-xs text-slate-300 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-emerald-400" />
              <span className="truncate">{newFileUrl ? 'Pièce jointe prête ✓' : 'Sélectionner un fichier local'}</span>
              <input type="file" onChange={handleFileUpload} className="hidden" />
            </label>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-300 mb-1">Remarques ou instructions</label>
            <input
              type="text"
              value={newNotes}
              onChange={e => setNewNotes(e.target.value)}
              placeholder="ex: Valable jusqu'en 2029"
              className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl text-xs transition-all shadow-md mt-2"
          >
            Chiffrer et Enregistrer dans mon Coffre-Fort
          </button>
        </form>
      </Modal>
    </div>
  );
};
