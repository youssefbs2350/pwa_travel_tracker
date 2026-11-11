/**
 * staticDataCache.ts
 * Système de mise en cache multi-niveaux (Mémoire RAM + LocalStorage persistant)
 * pour les données fixes et quasi-statiques :
 *  - Coordonnées GPS des villes et destinations (TTL 30 jours)
 *  - Photos Wikimedia / Wikipedia (TTL 14 jours)
 *  - Prévisions météo Open-Meteo (TTL 3 heures)
 *  - Suggestions de lieux par destination (TTL 24 heures)
 *
 * Élimine les temps d'attente réseau, rend l'application instantanément réactive
 * et réduit drastiquement la charge sur Vercel et les API tierces.
 */

interface CacheWrapper<T> {
  data: T;
  timestamp: number;
  ttlMs: number;
}

// 1. Mémoire vive (RAM) pour accès instantané < 0.1ms
const ramCache = new Map<string, CacheWrapper<any>>();

// Préfixe de stockage pour éviter les collisions
const STORAGE_PREFIX = 'tt_scache_';

/**
 * Récupère une entrée depuis la RAM ou le LocalStorage si non expirée
 */
export function getStaticCache<T>(key: string): T | null {
  const fullKey = STORAGE_PREFIX + key;
  const now = Date.now();

  // 1. Vérification en RAM
  const inRam = ramCache.get(fullKey);
  if (inRam) {
    if (now - inRam.timestamp < inRam.ttlMs) {
      return inRam.data as T;
    }
    ramCache.delete(fullKey);
  }

  // 2. Vérification dans LocalStorage
  try {
    const raw = localStorage.getItem(fullKey);
    if (!raw) return null;

    const parsed: CacheWrapper<T> = JSON.parse(raw);
    if (now - parsed.timestamp < parsed.ttlMs) {
      // Remet en RAM pour les prochains accès
      ramCache.set(fullKey, parsed);
      return parsed.data;
    }
    // Expiré
    localStorage.removeItem(fullKey);
  } catch {
    // Erreur de parsing ou localStorage désactivé
  }

  return null;
}

/**
 * Enregistre une valeur dans la RAM et le LocalStorage avec un TTL
 */
export function setStaticCache<T>(key: string, data: T, ttlMs: number): void {
  const fullKey = STORAGE_PREFIX + key;
  const entry: CacheWrapper<T> = {
    data,
    timestamp: Date.now(),
    ttlMs
  };

  // 1. RAM
  ramCache.set(fullKey, entry);

  // 2. LocalStorage (avec protection quota)
  try {
    localStorage.setItem(fullKey, JSON.stringify(entry));
  } catch (e) {
    // Si le quota localStorage est plein, nettoyer les anciennes clés périmées
    cleanExpiredStaticCache();
  }
}

/**
 * Nettoyage automatique des entrées expirées du LocalStorage
 */
export function cleanExpiredStaticCache(): void {
  const now = Date.now();
  try {
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(STORAGE_PREFIX)) {
        try {
          const raw = localStorage.getItem(k);
          if (raw) {
            const parsed = JSON.parse(raw);
            if (now - parsed.timestamp >= parsed.ttlMs) {
              keysToRemove.push(k);
            }
          }
        } catch {
          keysToRemove.push(k);
        }
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch {
    // ignore
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Fonctions spécialisées à usage direct
// ─────────────────────────────────────────────────────────────────────────────

// TTL standard
const TTL_GEOCODE = 30 * 24 * 60 * 60 * 1000;    // 30 jours (les coordonnées ne changent pas)
const TTL_PHOTO = 14 * 24 * 60 * 60 * 1000;      // 14 jours (photos pérennes)
const TTL_WEATHER = 3 * 60 * 60 * 1000;          // 3 heures (météo stable sur plusieurs heures)
const TTL_SUGGESTIONS = 24 * 60 * 60 * 1000;     // 24 heures

/**
 * Géocodage avec mise en cache transparente
 */
export async function getOrFetchGeocode(
  destination: string,
  country: string | undefined,
  fetcher: () => Promise<[number, number]>
): Promise<[number, number]> {
  const normalizedKey = `geo:${destination.trim().toLowerCase()}_${(country || '').trim().toLowerCase()}`;
  const cached = getStaticCache<[number, number]>(normalizedKey);
  if (cached) return cached;

  const result = await fetcher();
  if (result && !isNaN(result[0]) && !isNaN(result[1])) {
    setStaticCache(normalizedKey, result, TTL_GEOCODE);
  }
  return result;
}

/**
 * Photo Wikimedia avec mise en cache
 */
export async function getOrFetchPhoto(
  placeName: string,
  city: string,
  category: string,
  fetcher: () => Promise<string>
): Promise<string> {
  const normalizedKey = `photo:${placeName.trim().toLowerCase()}_${city.trim().toLowerCase()}`;
  const cached = getStaticCache<string>(normalizedKey);
  if (cached) return cached;

  const result = await fetcher();
  if (result) {
    setStaticCache(normalizedKey, result, TTL_PHOTO);
  }
  return result;
}

/**
 * Données météo avec mise en cache
 */
export async function getOrFetchWeather<T>(
  lat: number,
  lon: number,
  dateStr: string,
  fetcher: () => Promise<T>
): Promise<T> {
  // Arrondi à 2 décimales (~1km de précision) pour maximiser le réemploi du cache
  const key = `weather:${lat.toFixed(2)}:${lon.toFixed(2)}:${dateStr}`;
  const cached = getStaticCache<T>(key);
  if (cached) return cached;

  const result = await fetcher();
  if (result) {
    setStaticCache(key, result, TTL_WEATHER);
  }
  return result;
}

/**
 * Suggestions par catégorie avec mise en cache
 */
export async function getOrFetchSuggestions<T>(
  city: string,
  categoryType: string,
  fetcher: () => Promise<T>
): Promise<T> {
  const key = `sug:${city.trim().toLowerCase()}:${categoryType}`;
  const cached = getStaticCache<T>(key);
  if (cached) return cached;

  const result = await fetcher();
  if (result) {
    setStaticCache(key, result, TTL_SUGGESTIONS);
  }
  return result;
}
