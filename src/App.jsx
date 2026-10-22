import React, { useState } from 'react';
import TeamPanel from './components/TeamPanel';
import { NFL_TEAMS, MOCK_PLAYERS } from './data/mockData';
import { ArrowRightLeft, Sparkles } from 'lucide-react';

// If the Vite dev server proxies /api to FastAPI, this relative path works
// without cross-origin requests. Override with VITE_TRADE_API_URL if needed.
const TRADE_API_URL = import.meta.env.VITE_TRADE_API_URL || '/api/trade';

function errorFromResponse(body, status) {
  let message = body.trim();

  try {
    const parsed = JSON.parse(body);
    message = parsed.detail || parsed.error || parsed.message || message;
    if (typeof message !== 'string') message = JSON.stringify(message);
  } catch {
    // The backend can also return a plain-text error.
  }

  return new Error(message || `Trade analysis failed (HTTP ${status}).`);
}

// A FastAPI StreamingResponse with media_type='text/plain' streams raw
// Ollama tokens. Update the React view after every chunk, not just at the end.
async function readTradeStream(body, onUpdate) {
  if (!body) throw new Error('The backend returned no streaming response.');

  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      text += decoder.decode(value, { stream: true });
      onUpdate(text);
    }
    text += decoder.decode();
    onUpdate(text);
  } finally {
    reader.releaseLock();
  }

  return text;
}

export default function App() {
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState(null);

  const availableTeamAPlayers = MOCK_PLAYERS.filter(
    (p) => p.team === teamAId && !teamAPlayers.some((selected) => selected.id === p.id)
  );
  const availableTeamBPlayers = MOCK_PLAYERS.filter(
    (p) => p.team === teamBId && !teamBPlayers.some((selected) => selected.id === p.id)
  );

  const handleSelectTeamA = (id) => {
    setTeamAId(id);
    setTeamAPlayers([]); // Never retain players from a previously selected franchise.
    setVerdict(null);
  };

  const handleSelectTeamB = (id) => {
    setTeamBId(id);
    setTeamBPlayers([]);
    setVerdict(null);
  };

  const handleAnalyzeTrade = async () => {
    const teamA = NFL_TEAMS.find((team) => team.id === teamAId);
    const teamB = NFL_TEAMS.find((team) => team.id === teamBId);
    if (!teamA || !teamB || teamAId === teamBId ||
        (teamAPlayers.length === 0 && teamBPlayers.length === 0) || loading) {
      return;
    }

    setLoading(true);
    // The verifier looks for this state *before* Ollama finishes responding.
    setVerdict({ status: 'Streaming', analysis: '' });

    try {
      const response = await fetch(TRADE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'text/plain' },
        body: JSON.stringify({ teamA, teamB, teamAPlayers, teamBPlayers }),
      });

      if (!response.ok) {
        throw errorFromResponse(await response.text(), response.status);
      }

      const contentType = response.headers.get('content-type') || '';

let analysis;

if (contentType.includes('application/json')) {
  const data = await response.json();
  analysis = data.analysis ?? data.error ?? JSON.stringify(data);
} else {
  analysis = await readTradeStream(response.body, (partialAnalysis) => {
    setVerdict({ status: 'Streaming', analysis: partialAnalysis });
  });
}

      if (!analysis.trim()) {
        throw new Error('The backend returned an empty analysis.');
      }
      // Some streaming backends report a generation failure in the response
      // body even after sending HTTP 200.
  
      if (/^\s*(?:error\s*:|could not reach ollama\b|ollama returned http\b)/i.test(analysis)) {
  throw new Error(analysis.trim());
}

      setVerdict({ status: 'Complete', analysis });
    }  catch (error) {
  const message = error instanceof Error
    ? error.message
    : String(error);

  const isConnectionError =
    /ollama|connect|refused|fetch failed|network|HTTP 50\d|internal server error/i.test(message);

  const displayMessage = isConnectionError &&
    !message.includes('Could not reach Ollama')
      ? `Could not reach Ollama: ${message}`
      : message;

  setVerdict({
    status: 'Error',
    analysis: displayMessage
  });
} finally {
  setLoading(false);
}
  };

  const canAnalyze = Boolean(
    teamAId && teamBId && teamAId !== teamBId &&
    (teamAPlayers.length > 0 || teamBPlayers.length > 0) && !loading
  );

  const verdictClass = verdict?.status === 'Complete'
    ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
    : verdict?.status === 'Error'
      ? 'bg-red-500/20 text-red-400 border-red-500/30'
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="text-blue-500" /> NFL GM Simulator
          </h1>
          <p className="text-xs text-slate-400">Trade Viability Analyzer</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamPanel
          idPrefix="team-a"
          label="Team A"
          teams={NFL_TEAMS}
          selectedTeamId={teamAId}
          onSelectTeam={handleSelectTeamA}
          availablePlayers={availableTeamAPlayers}
          selectedPlayers={teamAPlayers}
          onAddPlayer={(player) => {
            setTeamAPlayers((current) => [...current, player]);
            setVerdict(null);
          }}
          onRemovePlayer={(id) => {
            setTeamAPlayers((current) => current.filter((player) => player.id !== id));
            setVerdict(null);
          }}
          incomingPlayers={teamBPlayers}
        />

        <TeamPanel
          idPrefix="team-b"
          label="Team B"
          teams={NFL_TEAMS}
          selectedTeamId={teamBId}
          onSelectTeam={handleSelectTeamB}
          availablePlayers={availableTeamBPlayers}
          selectedPlayers={teamBPlayers}
          onAddPlayer={(player) => {
            setTeamBPlayers((current) => [...current, player]);
            setVerdict(null);
          }}
          onRemovePlayer={(id) => {
            setTeamBPlayers((current) => current.filter((player) => player.id !== id));
            setVerdict(null);
          }}
          incomingPlayers={teamAPlayers}
        />
      </div>

      <div className="flex justify-center pt-2">
        <button
          id="analyze-trade"
          type="button"
          disabled={!canAnalyze}
          onClick={handleAnalyzeTrade}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          {loading ? 'Executing RAG Analysis...' : 'Analyze Trade Viability'}
        </button>
      </div>

      {teamAId && teamAId === teamBId && (
        <p className="text-amber-400 text-center text-sm" role="status">
          Choose two different franchises to analyze a trade.
        </p>
      )}

      {verdict && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-3" aria-live="polite">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Verdict:</span>
            <span
              id="verdict-status"
              className={`text-xs font-bold px-2.5 py-1 rounded-full border ${verdictClass}`}
            >
              {verdict.status}
            </span>
          </div>
          <div
            id="verdict-analysis"
            className="text-slate-300 text-sm whitespace-pre-wrap leading-relaxed"
          >
            {verdict.analysis || (loading ? 'Generating live analysis...' : '')}
          </div>
        </div>
      )}
    </div>
  );
}
