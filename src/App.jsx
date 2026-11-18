import React, { useEffect, useState } from 'react';
import TeamPanel from './components/TeamPanel';
import { ArrowRightLeft, Sparkles } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { readTradeStream } from './utils/tradeStream';

const TRADE_API_URL = import.meta.env.VITE_TRADE_API_URL || '/api/trade';

export default function App() {
  const [showLanding, setShowLanding] = useState(true);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [catalogLoading, setCatalogLoading] = useState(true);
  const [catalogError, setCatalogError] = useState(null);
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadCatalog() {
      try {
        const response = await fetch('/api/catalog', { signal: controller.signal });
        if (!response.ok) throw new Error('The team and player catalog could not be loaded.');
        const catalog = await response.json();
        setTeams(catalog.teams);
        setPlayers(catalog.players);
      } catch (error) {
        if (!controller.signal.aborted) setCatalogError(error.message);
      } finally {
        if (!controller.signal.aborted) setCatalogLoading(false);
      }
    }

    loadCatalog();
    return () => controller.abort();
  }, []);

  const availableTeamAPlayers = players.filter(p => p.team === teamAId && !teamAPlayers.some(tp => tp.id === p.id));
  const availableTeamBPlayers = players.filter(p => p.team === teamBId && !teamBPlayers.some(tp => tp.id === p.id));

  const selectTeamA = (id) => {
    setTeamAId(id);
    setTeamAPlayers([]);
    setVerdict(null);
  };

  const selectTeamB = (id) => {
    setTeamBId(id);
    setTeamBPlayers([]);
    setVerdict(null);
  };

  const handleAnalyzeTrade = async () => {
    if (!teamAId || !teamBId || teamAId === teamBId ||
        (teamAPlayers.length === 0 && teamBPlayers.length === 0) || loading) return;
    setLoading(true);
    setVerdict(null);

    const teamA = teams.find(team => team.id === teamAId);
    const teamB = teams.find(team => team.id === teamBId);

    try {
      const response = await fetch(TRADE_API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamA, teamB, teamAPlayers, teamBPlayers }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(typeof data.detail === 'string' ? data.detail : 'The trade analysis failed.');
      }

      setVerdict({ status: 'Streaming', analysis: '' });
      await readTradeStream(response.body, (content) => {
        setVerdict(previous => ({ status: 'Streaming', analysis: previous.analysis + content }));
      });
      setVerdict(previous => ({ ...previous, status: 'Complete' }));
    } catch (error) {
      const message = error instanceof TypeError
        ? 'Could not reach the FastAPI backend. Make sure it is running on port 8000.'
        : error.message;
      setVerdict(previous => ({
        status: 'Error',
        analysis: previous?.analysis
          ? `${previous.analysis}\n\n**Analysis stopped:** ${message}`
          : message,
      }));
    } finally {
      setLoading(false);
    }
  };

  if (showLanding) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center space-y-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-center gap-4">
          <ArrowRightLeft className="w-16 h-16 text-blue-500" />
          <h1 className="text-5xl font-black text-slate-100 tracking-tight">NFL GM Simulator</h1>
        </div>
        <p className="text-slate-300 text-xl md:text-2xl leading-relaxed max-w-3xl font-light">
          Explore proposed NFL player trades and get an analysis from a local AI model.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left w-full pt-6">
          <div className="bg-slate-800/90 border border-slate-700 p-8 rounded-2xl shadow-lg">
            <h3 className="font-extrabold text-blue-400 text-xl mb-3">1. Pick Teams</h3>
            <p className="text-base text-slate-200 leading-relaxed">Select two NFL franchises.</p>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 p-8 rounded-2xl shadow-lg">
            <h3 className="font-extrabold text-blue-400 text-xl mb-3">2. Build Assets</h3>
            <p className="text-base text-slate-200 leading-relaxed">Choose the players each team sends.</p>
          </div>
          <div className="bg-slate-800/90 border border-slate-700 p-8 rounded-2xl shadow-lg">
            <h3 className="font-extrabold text-blue-400 text-xl mb-3">3. Stream Verdict</h3>
            <p className="text-base text-slate-200 leading-relaxed">Read the analysis as it arrives.</p>
          </div>
        </div>
        <button
          id="get-started"
          type="button"
          onClick={() => setShowLanding(false)}
          className="flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xl px-10 py-4 rounded-2xl transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer"
        >
          <Sparkles className="w-6 h-6" />
          Get Started!
        </button>
      </div>
    );
  }

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

      {catalogLoading && <p role="status" className="text-sm text-slate-400">Loading teams and players...</p>}
      {catalogError && <p role="alert" className="text-sm text-red-400">{catalogError} Make sure the FastAPI backend is running on port 8000.</p>}
      {!catalogLoading && !catalogError && players.length === 0 && (
        <p role="status" className="text-sm text-amber-300">The database has no players yet. Import a roster to add player choices.</p>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamPanel
          label="Team A"
          teams={teams}
          selectedTeamId={teamAId}
          onSelectTeam={selectTeamA}
          disabled={catalogLoading || Boolean(catalogError)}
          availablePlayers={availableTeamAPlayers}
          selectedPlayers={teamAPlayers}
          onAddPlayer={(p) => { setTeamAPlayers([...teamAPlayers, p]); setVerdict(null); }}
          onRemovePlayer={(id) => { setTeamAPlayers(teamAPlayers.filter(p => p.id !== id)); setVerdict(null); }}
          incomingPlayers={teamBPlayers}
        />

        <TeamPanel
          label="Team B"
          teams={teams}
          selectedTeamId={teamBId}
          onSelectTeam={selectTeamB}
          disabled={catalogLoading || Boolean(catalogError)}
          availablePlayers={availableTeamBPlayers}
          selectedPlayers={teamBPlayers}
          onAddPlayer={(p) => { setTeamBPlayers([...teamBPlayers, p]); setVerdict(null); }}
          onRemovePlayer={(id) => { setTeamBPlayers(teamBPlayers.filter(p => p.id !== id)); setVerdict(null); }}
          incomingPlayers={teamAPlayers}
        />
      </div>

      <div className="flex justify-center pt-2">
        <button
          disabled={!teamAId || !teamBId || teamAId === teamBId || (teamAPlayers.length === 0 && teamBPlayers.length === 0) || loading}
          onClick={handleAnalyzeTrade}
          id="analyze-trade"
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          {loading ? 'Analyzing Trade...' : 'Analyze Trade Viability'}
        </button>
      </div>

      {teamAId && teamAId === teamBId && (
        <p className="text-amber-400 text-center text-sm" role="status">
          Choose two different franchises to analyze a trade.
        </p>
      )}

      {verdict && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Verdict:</span>
            <span id="verdict-status" className={`text-xs font-bold px-2.5 py-1 rounded-full border ${verdict.status === 'Error' ? 'bg-red-500/20 text-red-400 border-red-500/30' : verdict.status === 'Streaming' ? 'bg-blue-500/20 text-blue-400 border-blue-500/30' : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}>
              {verdict.status}
            </span>
          </div>
          <div id="verdict-analysis" className="text-slate-300 text-sm leading-relaxed [&_h1]:font-bold [&_h2]:font-bold [&_h3]:font-bold [&_h3]:mt-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_p]:my-2">
            {verdict.analysis
              ? <ReactMarkdown>{verdict.analysis}</ReactMarkdown>
              : <p className="text-slate-400 italic">Waiting for the first token...</p>}
          </div>
        </div>
      )}
    </div>
  );
}
