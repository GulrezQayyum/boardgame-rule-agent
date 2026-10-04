'use client';

import { useState } from 'react';

interface RulingResult {
  verdict: string;
  reasoning: string;
  citedDocuments: string[];
  confidence: 'high' | 'medium' | 'low';
}

interface ResolveResponse {
  success: boolean;
  agentRuling?: RulingResult;
  error?: string;
}

export default function Home() {
  const [cardInputs, setCardInputs] = useState<string>('Mirror Shield, Piercing Bolt');
  const [phase, setPhase] = useState<string>('Action Phase');
  const [question, setQuestion] = useState<string>('Can Mirror Shield reflect Piercing Bolt?');
  const [loading, setLoading] = useState<boolean>(false);
  const [result, setResult] = useState<RulingResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleResolve = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const cardsArray = cardInputs
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    try {
      const res = await fetch('/api/resolve-conflict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cards: cardsArray,
          currentPhase: phase,
          question,
        }),
      });

      const data: ResolveResponse = await res.json();

      if (!data.success) {
        throw new Error(data.error || 'Failed to resolve conflict.');
      }

      if (!data.agentRuling) {
        throw new Error('The response did not include a ruling.');
      }

      setResult(data.agentRuling);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resolve conflict.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#070914] text-slate-100 px-4 py-8 sm:px-6 md:py-12 font-sans">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="relative overflow-hidden border-b border-slate-800/80 pb-7">
          <div className="absolute -right-20 -top-24 h-56 w-56 rounded-full border border-amber-400/10" />
          <div className="relative">
            <p className="mb-3 font-mono text-[11px] uppercase tracking-[0.2em] text-amber-400">
              Tournament desk / ruling intake
            </p>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-md border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-xs font-mono text-amber-400">
                Sanity Content Lake
              </span>
              <span className="rounded-md border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-xs font-mono text-emerald-400">
                Tool-assisted review
              </span>
            </div>
            <h1 className="mt-4 max-w-2xl text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Board Game Rule Conflict Resolver
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400 sm:text-base">
              Submit the table state. The judge checks official cards, errata, and rule priorities before issuing a sourced ruling.
            </p>
          </div>
        </header>

        <form onSubmit={handleResolve} className="space-y-5 rounded-xl border border-slate-800 bg-slate-900/90 p-5 shadow-2xl shadow-black/20 sm:p-6">
          <div className="flex items-start justify-between gap-4 border-b border-slate-800 pb-4">
            <div>
              <h2 className="text-base font-semibold text-white">Describe the conflict</h2>
              <p className="mt-1 text-xs text-slate-500">Use the exact card names printed on the cards.</p>
            </div>
            <span className="hidden rounded border border-slate-700 px-2 py-1 font-mono text-[10px] uppercase tracking-wider text-slate-500 sm:block">
              Step 01
            </span>
          </div>
          <div>
            <label htmlFor="active-cards" className="mb-1.5 block text-sm font-medium text-slate-300">
              Active cards <span className="font-normal text-slate-500">(comma-separated)</span>
            </label>
            <input
              id="active-cards"
              type="text"
              value={cardInputs}
              onChange={(e) => setCardInputs(e.target.value)}
              className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
              placeholder="e.g. Mirror Shield, Piercing Bolt"
              required
            />
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="game-phase" className="mb-1.5 block text-sm font-medium text-slate-300">Game phase</label>
              <select
                id="game-phase"
                value={phase}
                onChange={(e) => setPhase(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition-colors focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
              >
                <option value="Start of Turn / Upkeep">Start of Turn / Upkeep</option>
                <option value="Action Phase">Action Phase</option>
                <option value="Combat Phase">Combat Phase</option>
                <option value="End Phase">End Phase</option>
              </select>
            </div>

            <div>
              <label htmlFor="player-question" className="mb-1.5 block text-sm font-medium text-slate-300">Player question</label>
              <input
                id="player-question"
                type="text"
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                className="w-full rounded-lg border border-slate-800 bg-slate-950 px-4 py-3 text-slate-100 outline-none transition-colors placeholder:text-slate-600 focus:border-amber-500 focus:ring-1 focus:ring-amber-500/40"
                placeholder="What happens when these cards interact?"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-amber-500 py-3.5 font-semibold text-slate-950 transition-colors hover:bg-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-300 focus:ring-offset-2 focus:ring-offset-slate-900 disabled:cursor-wait disabled:opacity-60"
          >
            {loading && <span className="h-4 w-4 animate-spin rounded-full border-2 border-slate-950/30 border-t-slate-950" />}
            {loading ? 'Checking official sources...' : 'Resolve rule conflict'}
          </button>
        </form>

        {error && (
          <div role="alert" className="rounded-xl border border-red-800/50 bg-red-950/50 p-4 text-sm text-red-300">
            <p className="mb-1 font-semibold text-red-200">Unable to issue a ruling</p>
            <p>{error}</p>
          </div>
        )}

        {result && (
          <section aria-live="polite" className="space-y-5 rounded-xl border border-slate-800 bg-slate-900 p-5 shadow-2xl shadow-black/20 sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="mb-1 font-mono text-[10px] uppercase tracking-[0.18em] text-emerald-400">Official response</p>
                <h2 className="text-lg font-semibold text-white">Ruling verdict</h2>
              </div>
              <span
                className={`rounded-full border px-2.5 py-1 text-xs font-mono uppercase ${
                  result.confidence === 'high'
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : result.confidence === 'medium'
                    ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                    : 'bg-red-500/10 text-red-400 border-red-500/30'
                }`}
              >
                Confidence: {result.confidence}
              </span>
            </div>

            <p className="border-l-2 border-amber-400 pl-4 text-lg font-medium leading-snug text-amber-300">{result.verdict}</p>

            <div className="space-y-2 border-t border-slate-800 pt-5">
              <h3 className="text-sm font-semibold text-slate-300">Reasoning</h3>
              <p className="whitespace-pre-line text-sm leading-relaxed text-slate-400">
                {result.reasoning}
              </p>
            </div>

            {result.citedDocuments && result.citedDocuments.length > 0 && (
              <div className="space-y-2 border-t border-slate-800 pt-4">
                <span className="block text-xs font-mono uppercase tracking-wider text-slate-500">Cited context documents</span>
                <div className="flex flex-wrap gap-2">
                  {result.citedDocuments.map((doc, idx) => (
                    <span
                      key={idx}
                      className="rounded border border-slate-800 bg-slate-950 px-2 py-1 text-xs font-mono text-slate-400"
                    >
                      {doc}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </section>
        )}
      </div>
    </main>
  );
}