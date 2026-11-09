import React, { useState } from 'react';
import { Lock, Unlock, Eye, EyeOff, Shield, AlertTriangle, CheckCircle2, X, Save } from 'lucide-react';
import { Trip, TravelDoc } from '../../types';
import { encryptData, decryptData, maskSensitiveNumber, checkPasswordStrength } from '../../utils/encryption';
import { Modal } from '../common/Modal';

interface SecureDocumentVaultProps {
  trip: Trip;
  onUpdateTrip: (updates: Partial<Trip>) => Promise<void>;
}

interface SecureDocument extends TravelDoc {
  isEncrypted?: boolean;
  encryptedData?: string;
  isSensitive?: boolean;
}

export const SecureDocumentVault: React.FC<SecureDocumentVaultProps> = ({ trip, onUpdateTrip }) => {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [password, setPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSetupModalOpen, setIsSetupModalOpen] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<SecureDocument | null>(null);
  const [revealedDocs, setRevealedDocs] = useState<Set<string>>(new Set());

  const vaultPassword = localStorage.getItem(`vault_password_${trip.id}`);
  const hasVaultPassword = !!vaultPassword;

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
      // Hash le mot de passe pour le stockage local (ne jamais stocker en clair)
      const { hashData } = await import('../../utils/encryption');
      const hashedPassword = await hashData(newPassword);
      localStorage.setItem(`vault_password_${trip.id}`, hashedPassword);
      
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
      
      if (hashedPassword === vaultPassword) {
        setIsUnlocked(true);
        setPassword('');
      } else {
        setError('Mot de passe incorrect');
      }
    } catch (err) {
      setError('Erreur lors du déverrouillage');
    }
  };

  const handleEncryptDocument = async (doc: TravelDoc, sensitiveData: string) => {
    if (!password && !isUnlocked) {
      setError('Veuillez déverrouiller le coffre-fort');
      return;
    }

    try {
      const encrypted = await encryptData(sensitiveData, password || newPassword);
      
      const updatedDocs = (trip.travelDocs || []).map(d => 
        d.id === doc.id 
          ? { ...d, encryptedData: encrypted, isEncrypted: true, isSensitive: true } as SecureDocument
          : d
      );

      await onUpdateTrip({ travelDocs: updatedDocs });
    } catch (err) {
      setError('Échec du chiffrement');
    }
  };

  const handleRevealDocument = async (doc: SecureDocument) => {
    if (!doc.encryptedData || !doc.isEncrypted) return;

    try {
      const decrypted = await decryptData(doc.encryptedData, password);
      setRevealedDocs(prev => new Set(prev).add(doc.id));
      
      // Cache automatiquement après 30 secondes
      setTimeout(() => {
        setRevealedDocs(prev => {
          const newSet = new Set(prev);
          newSet.delete(doc.id);
          return newSet;
        });
      }, 30000);
    } catch (err) {
      setError('Impossible de déchiffrer le document');
    }
  };

  const secureDocuments = (trip.travelDocs || []).filter((doc): doc is SecureDocument => 
    (doc as SecureDocument).isSensitive === true
  );

  const getPasswordStrengthColor = (score: number) => {
    if (score >= 80) return 'bg-emerald-500';
    if (score >= 60) return 'bg-sky-500';
    if (score >= 40) return 'bg-amber-500';
    return 'bg-rose-500';
  };

  const passwordStrength = newPassword ? checkPasswordStrength(newPassword) : null;

  if (!hasVaultPassword) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/30 space-y-4">
        <div className="flex items-center space-x-3">
          <Shield className="w-8 h-8 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white">Coffre-Fort Sécurisé</h3>
            <p className="text-xs text-slate-400">Protection AES-256 pour vos documents sensibles</p>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/30 text-xs text-indigo-200 space-y-2">
          <div className="flex items-start space-x-2">
            <Lock className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-indigo-300">Chiffrement de bout en bout</strong>
              <p className="text-indigo-200/80 mt-1">Vos passeports, cartes bancaires et documents sensibles sont chiffrés localement sur votre appareil. Aucune clé n'est envoyée au serveur.</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsSetupModalOpen(true)}
          className="w-full py-3 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center space-x-2"
        >
          <Shield className="w-5 h-5" />
          <span>Créer mon Coffre-Fort</span>
        </button>

        {/* Setup Modal */}
        <Modal
          isOpen={isSetupModalOpen}
          onClose={() => setIsSetupModalOpen(false)}
          title="Créer votre Coffre-Fort Sécurisé"
          subtitle="Définissez un mot de passe fort pour protéger vos documents"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-2">Mot de passe maître</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  placeholder="Min. 8 caractères, avec majuscules, chiffres et symboles"
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
                  {passwordStrength.feedback.length > 0 && (
                    <ul className="text-[11px] text-amber-300 space-y-0.5 mt-1">
                      {passwordStrength.feedback.map((tip, idx) => (
                        <li key={idx}>• {tip}</li>
                      ))}
                    </ul>
                  )}
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
              Créer le Coffre-Fort
            </button>
          </div>
        </Modal>
      </div>
    );
  }

  if (!isUnlocked) {
    return (
      <div className="p-6 rounded-2xl bg-gradient-to-br from-indigo-950/40 via-slate-900 to-slate-900 border border-indigo-800/30 space-y-4">
        <div className="flex items-center space-x-3">
          <Lock className="w-8 h-8 text-indigo-400" />
          <div>
            <h3 className="text-base font-bold text-white">Coffre-Fort Verrouillé</h3>
            <p className="text-xs text-slate-400">{secureDocuments.length} document(s) chiffré(s)</p>
          </div>
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
            <span>Déverrouiller</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 rounded-2xl bg-gradient-to-br from-emerald-950/40 via-slate-900 to-slate-900 border border-emerald-800/30 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Unlock className="w-8 h-8 text-emerald-400" />
          <div>
            <h3 className="text-base font-bold text-white">Coffre-Fort Déverrouillé</h3>
            <p className="text-xs text-emerald-400">Session sécurisée active</p>
          </div>
        </div>

        <button
          onClick={() => {
            setIsUnlocked(false);
            setPassword('');
            setRevealedDocs(new Set());
          }}
          className="px-3 py-1.5 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 rounded-lg border border-emerald-500/30 transition-colors"
        >
          Verrouiller
        </button>
      </div>

      <div className="space-y-2">
        {secureDocuments.length === 0 ? (
          <div className="text-center py-8 text-xs text-slate-500">
            Aucun document sensible chiffré pour le moment
          </div>
        ) : (
          secureDocuments.map(doc => (
            <div key={doc.id} className="p-3 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm font-semibold text-white">{doc.title}</span>
                </div>
                <button
                  onClick={() => handleRevealDocument(doc)}
                  className="px-2 py-1 text-xs font-semibold text-emerald-400 hover:bg-emerald-500/10 rounded border border-emerald-500/30"
                >
                  {revealedDocs.has(doc.id) ? 'Masquer' : 'Révéler'}
                </button>
              </div>

              {doc.referenceCode && (
                <div className="text-xs text-slate-300">
                  <span className="text-slate-500">Référence:</span>{' '}
                  {revealedDocs.has(doc.id) ? doc.referenceCode : maskSensitiveNumber(doc.referenceCode)}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};
