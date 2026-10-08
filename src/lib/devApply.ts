/**
 * Client dell'endpoint `POST <base>__dev/apply` del dev server (vite-plugins/dev-apply.ts):
 * scrive nei file del repository le bozze modificate, al posto del download manuale.
 */
import type { DevArtifact } from '@/lib/devArtifacts';

export type ApplyOutcome =
  | { status: 'ok'; written: string[] }
  | { status: 'conflict'; conflicts: string[] }
  | { status: 'nothing' }
  | { status: 'error'; message: string };

/** Applica solo gli artefatti con una bozza modificata; `force` ignora il controllo sul disco. */
export async function applyArtifacts(artifacts: DevArtifact[], force = false): Promise<ApplyOutcome> {
  const modified = artifacts.filter((a) => a.isModified());
  if (modified.length === 0) return { status: 'nothing' };

  try {
    const res = await fetch(`${import.meta.env.BASE_URL}__dev/apply`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        force,
        files: modified.map((a) => ({ path: a.file, content: a.build(), baseline: a.baseline() })),
      }),
    });
    const body = (await res.json()) as ApplyOutcome;
    return body;
  } catch {
    return { status: 'error', message: 'Il server di sviluppo non risponde.' };
  }
}
