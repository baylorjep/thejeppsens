'use client';

import { useState, type FormEvent } from 'react';
import { Loader2, Download } from 'lucide-react';

export default function Mp3Tool() {
  const [url, setUrl] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  async function handleConvert(e: FormEvent) {
    e.preventDefault();
    setStatus('loading');
    setError(null);

    try {
      const res = await fetch('/api/mp3/convert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? 'Conversion failed');
      }

      const disposition = res.headers.get('Content-Disposition') ?? '';
      const match = disposition.match(/filename="(.+)"/);
      const filename = match?.[1] ?? 'audio.mp3';

      const blob = await res.blob();
      const downloadUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(downloadUrl);

      setStatus('idle');
      setUrl('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStatus('error');
    }
  }

  return (
    <div className="mx-auto max-w-xl py-16">
      <h1 className="text-3xl font-semibold tracking-tight text-gray-950">YouTube → MP3</h1>
      <p className="mt-2 text-sm text-gray-600">
        Paste a link to a video you have the rights to (your own uploads, Creative Commons, or
        personal fair-use archiving). Max ~20 minutes.
      </p>

      <form onSubmit={handleConvert} className="mt-8 flex flex-col gap-3">
        <input
          type="url"
          required
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
          className="rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="inline-flex items-center justify-center gap-2 rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-700 disabled:opacity-50"
        >
          {status === 'loading' ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Converting…
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              Convert &amp; download
            </>
          )}
        </button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </form>
    </div>
  );
}
