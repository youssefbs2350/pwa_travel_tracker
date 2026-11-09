/**
 * Utilitaires de chiffrement AES-256-GCM pour documents sensibles
 * Chiffrement côté client uniquement - clés jamais envoyées au serveur
 */

/**
 * Génère une clé de chiffrement à partir d'un mot de passe utilisateur
 * Utilise PBKDF2 pour dériver une clé sécurisée
 */
async function deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const encoder = new TextEncoder();
  const passwordKey = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveKey']
  );

  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    passwordKey,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt']
  );
}

/**
 * Chiffre des données sensibles avec AES-256-GCM
 * @param data - Données à chiffrer (string)
 * @param password - Mot de passe de chiffrement
 * @returns Données chiffrées encodées en base64
 */
export async function encryptData(data: string, password: string): Promise<string> {
  try {
    const encoder = new TextEncoder();
    const salt = crypto.getRandomValues(new Uint8Array(16));
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const key = await deriveKey(password, salt);

    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      encoder.encode(data)
    );

    // Combine salt + iv + encrypted data
    const combined = new Uint8Array(salt.length + iv.length + encryptedData.byteLength);
    combined.set(salt, 0);
    combined.set(iv, salt.length);
    combined.set(new Uint8Array(encryptedData), salt.length + iv.length);

    // Encode en base64 pour stockage
    return btoa(String.fromCharCode(...combined));
  } catch (error) {
    console.error('[Encryption] Error encrypting data:', error);
    throw new Error('Échec du chiffrement des données');
  }
}

/**
 * Déchiffre des données avec AES-256-GCM
 * @param encryptedData - Données chiffrées (base64)
 * @param password - Mot de passe de déchiffrement
 * @returns Données déchiffrées (string)
 */
export async function decryptData(encryptedData: string, password: string): Promise<string> {
  try {
    const decoder = new TextDecoder();
    
    // Decode from base64
    const combined = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));
    
    // Extract salt, iv, and encrypted data
    const salt = combined.slice(0, 16);
    const iv = combined.slice(16, 28);
    const encrypted = combined.slice(28);

    const key = await deriveKey(password, salt);

    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    return decoder.decode(decryptedData);
  } catch (error) {
    console.error('[Encryption] Error decrypting data:', error);
    throw new Error('Mot de passe incorrect ou données corrompues');
  }
}

/**
 * Hash un texte avec SHA-256 (pour vérification d'intégrité)
 */
export async function hashData(data: string): Promise<string> {
  const encoder = new TextEncoder();
  const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Génère un mot de passe aléatoire fort
 */
export function generateStrongPassword(length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*()_+-=[]{}|;:,.<>?';
  const randomValues = crypto.getRandomValues(new Uint8Array(length));
  return Array.from(randomValues)
    .map(x => charset[x % charset.length])
    .join('');
}

/**
 * Masque partiellement un numéro sensible (passeport, carte bancaire)
 * Ex: "AB123456" -> "AB****56"
 */
export function maskSensitiveNumber(value: string, visibleStart: number = 2, visibleEnd: number = 2): string {
  if (value.length <= visibleStart + visibleEnd) {
    return '*'.repeat(value.length);
  }
  
  const start = value.slice(0, visibleStart);
  const end = value.slice(-visibleEnd);
  const masked = '*'.repeat(value.length - visibleStart - visibleEnd);
  
  return `${start}${masked}${end}`;
}

/**
 * Vérifie la force d'un mot de passe
 */
export function checkPasswordStrength(password: string): {
  score: number; // 0-100
  level: 'weak' | 'medium' | 'strong' | 'very-strong';
  feedback: string[];
} {
  let score = 0;
  const feedback: string[] = [];

  // Longueur
  if (password.length >= 8) score += 20;
  if (password.length >= 12) score += 10;
  if (password.length >= 16) score += 10;
  else feedback.push('Utilisez au moins 12 caractères');

  // Complexité
  if (/[a-z]/.test(password)) score += 15;
  else feedback.push('Ajoutez des lettres minuscules');
  
  if (/[A-Z]/.test(password)) score += 15;
  else feedback.push('Ajoutez des lettres majuscules');
  
  if (/[0-9]/.test(password)) score += 15;
  else feedback.push('Ajoutez des chiffres');
  
  if (/[^a-zA-Z0-9]/.test(password)) score += 15;
  else feedback.push('Ajoutez des caractères spéciaux (!@#$...)');

  let level: 'weak' | 'medium' | 'strong' | 'very-strong' = 'weak';
  if (score >= 80) level = 'very-strong';
  else if (score >= 60) level = 'strong';
  else if (score >= 40) level = 'medium';

  return { score, level, feedback };
}
