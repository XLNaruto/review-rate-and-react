// Persists a user's submitted feedback/survey per slug in IndexedDB so the
// "thank you" summary survives a page refresh or a tab close + reopen.
//
// The store is wiped at the start of a *fresh browser session*, so fully
// closing the browser effectively clears it. Browsers expose no reliable
// "browser closed" event, so we approximate it with a localStorage heartbeat:
// while any tab of the app is open the heartbeat is kept warm; if we boot up
// and find the heartbeat stale (no tab alive for SESSION_GRACE_MS), we treat it
// as a new browser session and clear. A refresh or a quick tab reopen stays
// well under the grace window; a real browser restart generally exceeds it.

const DB_NAME = "rate-react";
const DB_VERSION = 2;
const STORE = "submissions";
// Cache of the GET /scan-qr response per slug, so a refresh can paint the page
// (logo, business/product/survey chrome) instantly without waiting on the
// network. This is public, non-sensitive data and is NOT wiped between browser
// sessions — it's only a render accelerator and is always revalidated.
const QR_STORE = "qr-cache";

const HEARTBEAT_KEY = "rr_session_hb";
const HEARTBEAT_INTERVAL_MS = 2000;
const SESSION_GRACE_MS = 10000;

export type SubmissionRecord = {
  slug: string;
  kind: string;
  payload: any;
  savedAt: number;
};

// --- browser-session detection (synchronous, runs once at module load) ------

const readHeartbeat = (): number => {
  try {
    const v = window.localStorage.getItem(HEARTBEAT_KEY);
    return v ? Number(v) : 0;
  } catch {
    return 0;
  }
};

const writeHeartbeat = () => {
  try {
    window.localStorage.setItem(HEARTBEAT_KEY, String(Date.now()));
  } catch {
    /* storage unavailable — ignore */
  }
};

const lastBeat = readHeartbeat();
const isFreshSession = !lastBeat || Date.now() - lastBeat > SESSION_GRACE_MS;

// Keep the heartbeat warm while the app is open.
writeHeartbeat();
if (typeof window !== "undefined") {
  window.setInterval(writeHeartbeat, HEARTBEAT_INTERVAL_MS);
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") writeHeartbeat();
  });
  window.addEventListener("pagehide", writeHeartbeat);
}

// --- IndexedDB plumbing -----------------------------------------------------

const openDb = (): Promise<IDBDatabase> =>
  new Promise((resolve, reject) => {
    const req = window.indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "slug" });
      }
      if (!db.objectStoreNames.contains(QR_STORE)) {
        db.createObjectStore(QR_STORE, { keyPath: "slug" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

const tx = async <T>(
  storeName: string,
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>
): Promise<T> => {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const t = db.transaction(storeName, mode);
    const req = run(t.objectStore(storeName));
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    t.oncomplete = () => db.close();
  });
};

const clearAll = () => tx(STORE, "readwrite", (s) => s.clear());

// Clear exactly once, at the start of a fresh browser session. Every public
// read/write awaits this so a restore can never race ahead of the wipe.
let sessionReady: Promise<void> | null = null;
const ensureSession = (): Promise<void> => {
  if (!sessionReady) {
    sessionReady = (async () => {
      if (isFreshSession) {
        try {
          await clearAll();
        } catch {
          /* ignore */
        }
      }
    })();
  }
  return sessionReady;
};

// --- public API -------------------------------------------------------------

export const saveSubmission = async (
  slug: string,
  kind: string,
  payload: any
): Promise<void> => {
  if (!slug) return;
  await ensureSession();
  const record: SubmissionRecord = {
    slug,
    kind,
    payload,
    savedAt: Date.now(),
  };
  try {
    await tx(STORE, "readwrite", (s) => s.put(record));
  } catch {
    /* ignore */
  }
};

export const getSubmission = async (
  slug: string
): Promise<SubmissionRecord | null> => {
  if (!slug) return null;
  await ensureSession();
  try {
    const rec = await tx<SubmissionRecord | undefined>(STORE, "readonly", (s) =>
      s.get(slug)
    );
    return rec ?? null;
  } catch {
    return null;
  }
};

export const clearSubmission = async (slug: string): Promise<void> => {
  if (!slug) return;
  try {
    await tx(STORE, "readwrite", (s) => s.delete(slug));
  } catch {
    /* ignore */
  }
};

// --- QR page-data cache (render accelerator, not session-scoped) ------------

export const saveQrData = async (slug: string, data: any): Promise<void> => {
  if (!slug || !data) return;
  try {
    await tx(QR_STORE, "readwrite", (s) =>
      s.put({ slug, data, savedAt: Date.now() })
    );
  } catch {
    /* ignore */
  }
};

// Drop a slug's cached page. Called when the server says the QR is gone (404)
// so a stale vendor page can't keep painting on subsequent refreshes.
export const removeQrData = async (slug: string): Promise<void> => {
  if (!slug) return;
  try {
    await tx(QR_STORE, "readwrite", (s) => s.delete(slug));
  } catch {
    /* ignore */
  }
};

export const getQrData = async (slug: string): Promise<any | null> => {
  if (!slug) return null;
  try {
    const rec = await tx<{ slug: string; data: any } | undefined>(
      QR_STORE,
      "readonly",
      (s) => s.get(slug)
    );
    return rec?.data ?? null;
  } catch {
    return null;
  }
};
