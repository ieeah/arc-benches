import { useState, useEffect, useCallback, useMemo } from 'react';

const isDev = import.meta.env.DEV;
const LAST_ROUTE_KEY = 'arc_benches_last_route_v1';

export type AppRoute =
  | 'stash'
  | 'liste'
  | 'blueprints'
  | 'expeditions'
  | 'items'
  | 'settings'
  | 'list-detail'
  | 'maps'
  | 'role-maker'
  | 'dev-lists'
  | 'dev-overrides'
  | 'dev-translations'
  | 'dev-lab';

export const VALID_ROUTES: readonly AppRoute[] = [
  'stash',
  'liste',
  'blueprints',
  'expeditions',
  'items',
  'settings',
  'list-detail',
  'maps',
  'role-maker',
  'dev-lists',
  'dev-overrides',
  'dev-translations',
  'dev-lab',
] as const;

export const DEV_ROUTES: readonly AppRoute[] = [
  'dev-lists',
  'dev-overrides',
  'dev-translations',
  'dev-lab',
] as const;

export interface RouteLocation {
  route: AppRoute;
  params: Record<string, string>;
}

export interface AppRouter {
  route: AppRoute;
  pathname: AppRoute;
  params: Record<string, string>;
  searchParams: URLSearchParams;
  push: (route: AppRoute, params?: Record<string, string>) => void;
  replace: (route: AppRoute, params?: Record<string, string>) => void;
  back: () => void;
}

/**
 * Converte una stringa hash (es. "#/list-detail?id=weapons" o "#settings") in un oggetto RouteLocation.
 */
export function parseHash(hash: string): RouteLocation {
  const clean = hash.replace(/^#\/?/, '').trim();
  if (!clean) {
    return { route: 'stash', params: {} };
  }

  const [pathPart, queryPart] = clean.split('?');
  const normalizedRoute = pathPart.toLowerCase() as AppRoute;

  const isValid = VALID_ROUTES.includes(normalizedRoute);
  let route: AppRoute = isValid ? normalizedRoute : 'stash';

  // Se non siamo in DEV, blocca l'accesso diretto alle rotte dev
  if (!isDev && DEV_ROUTES.includes(route)) {
    route = 'stash';
  }

  const params: Record<string, string> = {};
  if (queryPart) {
    const searchParams = new URLSearchParams(queryPart);
    searchParams.forEach((value, key) => {
      params[key] = value;
    });
  }

  return { route, params };
}

/**
 * Costruisce la stringa hash a partire da rotta e parametri (es. "#/list-detail?id=weapons").
 */
export function buildHash(route: AppRoute, params?: Record<string, string>): string {
  let hash = `#/${route}`;
  if (params && Object.keys(params).length > 0) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, val]) => {
      if (val !== undefined && val !== null && val !== '') {
        searchParams.set(key, val);
      }
    });
    const qs = searchParams.toString();
    if (qs) {
      hash += `?${qs}`;
    }
  }
  return hash;
}

/**
 * Salva l'ultima rotta valida dell'utente in localStorage.
 * Non memorizza modali volatili come role-maker.
 */
function saveLastRoute(loc: RouteLocation) {
  if (loc.route === 'role-maker') return;
  if (!isDev && DEV_ROUTES.includes(loc.route)) return;
  try {
    localStorage.setItem(LAST_ROUTE_KEY, JSON.stringify(loc));
  } catch {
    // Ignore storage errors
  }
}

/**
 * Recupera l'ultima rotta salvata o fallback a 'stash'.
 */
function getLastSavedRoute(): RouteLocation | null {
  try {
    const raw = localStorage.getItem(LAST_ROUTE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as RouteLocation;
      if (VALID_ROUTES.includes(parsed.route)) {
        if (!isDev && DEV_ROUTES.includes(parsed.route)) {
          return null;
        }
        return parsed;
      }
    }
  } catch {
    // Ignore parse errors
  }
  return null;
}

/**
 * Risolve la rotta iniziale all'avvio dell'applicazione.
 * Precedenza: 1) hash nell'URL, 2) ultima rotta salvata, 3) fallback 'stash'.
 */
export function getInitialLocation(): RouteLocation {
  const currentHash = typeof window !== 'undefined' ? window.location.hash : '';
  const clean = currentHash.replace(/^#\/?/, '').trim();

  if (clean) {
    return parseHash(currentHash);
  }

  const lastSaved = getLastSavedRoute();
  if (lastSaved) {
    return lastSaved;
  }

  return { route: 'stash', params: {} };
}

type RouteListener = (loc: RouteLocation) => void;
const listeners = new Set<RouteListener>();

let currentLocation: RouteLocation = getInitialLocation();

// Sincronizza l'URL iniziale se era vuoto ma c'era una rotta salvata
if (typeof window !== 'undefined') {
  const currentClean = window.location.hash.replace(/^#\/?/, '').trim();
  if (!currentClean && currentLocation.route !== 'stash') {
    window.history.replaceState(null, '', buildHash(currentLocation.route, currentLocation.params));
  }
  saveLastRoute(currentLocation);

  window.addEventListener('hashchange', () => {
    const next = parseHash(window.location.hash);
    currentLocation = next;
    saveLastRoute(next);
    listeners.forEach((fn) => fn(next));
  });
}

/**
 * Hook centralizzato di navigazione (predisposto anche per Next.js App Router).
 */
export function useRouter(): AppRouter {
  const [loc, setLoc] = useState<RouteLocation>(() => currentLocation);

  useEffect(() => {
    const handleUpdate = (nextLoc: RouteLocation) => {
      setLoc(nextLoc);
    };
    listeners.add(handleUpdate);
    return () => {
      listeners.delete(handleUpdate);
    };
  }, []);

  const push = useCallback((route: AppRoute, params?: Record<string, string>) => {
    const newHash = buildHash(route, params);
    if (window.location.hash !== newHash) {
      window.location.hash = newHash;
    } else {
      // Se l'hash e' lo stesso ma forziamo l'aggiornamento
      const next: RouteLocation = { route, params: params || {} };
      currentLocation = next;
      saveLastRoute(next);
      listeners.forEach((fn) => fn(next));
    }
  }, []);

  const replace = useCallback((route: AppRoute, params?: Record<string, string>) => {
    const newHash = buildHash(route, params);
    window.history.replaceState(null, '', newHash);
    const next: RouteLocation = { route, params: params || {} };
    currentLocation = next;
    saveLastRoute(next);
    listeners.forEach((fn) => fn(next));
  }, []);

  const back = useCallback(() => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      // Fallback sicuro se aperto direttamente in un nuovo tab
      push('stash');
    }
  }, [push]);

  const searchParams = useMemo(() => {
    const sp = new URLSearchParams();
    Object.entries(loc.params).forEach(([k, v]) => sp.set(k, v));
    return sp;
  }, [loc.params]);

  return {
    route: loc.route,
    pathname: loc.route,
    params: loc.params,
    searchParams,
    push,
    replace,
    back,
  };
}
