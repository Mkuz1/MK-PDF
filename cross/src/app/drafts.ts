// Unsaved work survives the app being closed, killed in the background or crashing: each edited document is kept in
// the browser's own database on this device until it is saved or closed, and offered back at the next launch.
// Password-protected documents are never kept (their contents would sit on disk unprotected).
import { effect } from '@preact/signals';
import type { DocModel } from '../pdf/doc';

export interface Draft { key: string; name: string; path?: string; bytes: Uint8Array; at: number }

const STORE = 'drafts';
function db(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const open = indexedDB.open('mkpdf', 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: 'key' });
    open.onsuccess = () => resolve(open.result);
    open.onerror = () => reject(open.error);
  });
}
async function run<T>(mode: IDBTransactionMode, work: (s: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const d = await db();
  try {
    return await new Promise<T>((resolve, reject) => {
      const tx = d.transaction(STORE, mode);
      const req = work(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(req.result);
      tx.onerror = tx.onabort = () => reject(tx.error);
    });
  } finally { d.close(); }
}

export const listDrafts = () => run<Draft[]>('readonly', (s) => s.getAll()).catch(() => [] as Draft[]);
export const removeDraft = (key: string) => run('readwrite', (s) => s.delete(key)).catch(() => undefined);
const putDraft = (d: Draft) => run('readwrite', (s) => s.put(d)).catch(() => undefined);

const keys = new WeakMap<DocModel, string>();
/** The key a document's draft is kept under (a restored document keeps the key it was restored from). */
export const draftKey = (doc: DocModel, restoredFrom?: string) => {
  if (restoredFrom) keys.set(doc, restoredFrom);
  if (!keys.has(doc)) keys.set(doc, `${Date.now()}-${Math.random().toString(36).slice(2)}`);
  return keys.get(doc)!;
};

/** Keeps the draft of every open document in step with its unsaved changes. */
export function watchDrafts(docs: { value: DocModel[] }) {
  const timers = new Map<DocModel, number>();
  const seen = new Set<DocModel>();
  effect(() => {
    const open = docs.value;
    // A closed document's draft goes with it (closing asks first when there are unsaved changes).
    for (const d of seen) if (!open.includes(d)) { seen.delete(d); clearTimeout(timers.get(d)); timers.delete(d); void removeDraft(draftKey(d)); }
    for (const d of open) {
      seen.add(d);
      const dirty = d.dirty.value;
      void d.version.value;
      clearTimeout(timers.get(d));
      if (!dirty || d.protection) { void removeDraft(draftKey(d)); continue; }
      // Shortly after the last change, so a burst of edits is written once.
      timers.set(d, window.setTimeout(async () => {
        const bytes = await d.currentBytes().catch(() => null);
        if (bytes && d.dirty.peek() && docs.value.includes(d)) await putDraft({ key: draftKey(d), name: d.name, path: d.path, bytes, at: Date.now() });
      }, 1200));
    }
  });
}
