import React, { useState } from 'react';
import TeamPanel from './components/TeamPanel';
import { NFL_TEAMS, MOCK_PLAYERS } from './data/mockData';
import { ArrowRightLeft, Sparkles } from 'lucide-react';

export default function App() {
  const [teamAId, setTeamAId] = useState('');
  const [teamBId, setTeamBId] = useState('');
  const [teamAPlayers, setTeamAPlayers] = useState([]);
  const [teamBPlayers, setTeamBPlayers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verdict, setVerdict] = useState(null);

  const availableTeamAPlayers = MOCK_PLAYERS.filter(p => p.team === teamAId && !teamAPlayers.some(tp => tp.id === p.id));
  const availableTeamBPlayers = MOCK_PLAYERS.filter(p => p.team === teamBId && !teamBPlayers.some(tp => tp.id === p.id));

  const handleAnalyzeTrade = async () => {
    setLoading(true);
    setVerdict(null);

    // Simulated local response while waiting for backend API connection
    setTimeout(() => {
      setVerdict({
        status: 'Viable',
        analysis: `### Financial Context\n- **Team A Net Cap Change:** +$1.85M\n- **Team B Net Cap Change:** -$1.85M\n\n### RAG Trade Evaluation\nTrading **Amon-Ra St. Brown** for **Patrick Surtain II** addresses key positional needs for both teams while keeping both franchises compliant under salary cap limits.`
      });
      setLoading(false);
    }, 1500);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <header className="flex justify-between items-center border-b border-slate-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            <ArrowRightLeft className="text-blue-500" /> NFL Trade Viability Analyzer
          </h1>
          <p className="text-xs text-slate-400">Knowledge-Based System & Cap Space Calculator</p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <TeamPanel 
          label="Team A"
          teams={NFL_TEAMS}
          selectedTeamId={teamAId}
          onSelectTeam={setTeamAId}
          availablePlayers={availableTeamAPlayers}
          selectedPlayers={teamAPlayers}
          onAddPlayer={(p) => setTeamAPlayers([...teamAPlayers, p])}
          onRemovePlayer={(id) => setTeamAPlayers(teamAPlayers.filter(p => p.id !== id))}
          incomingPlayers={teamBPlayers}
        />

        <TeamPanel 
          label="Team B"
          teams={NFL_TEAMS}
          selectedTeamId={teamBId}
          onSelectTeam={setTeamBId}
          availablePlayers={availableTeamBPlayers}
          selectedPlayers={teamBPlayers}
          onAddPlayer={(p) => setTeamBPlayers([...teamBPlayers, p])}
          onRemovePlayer={(id) => setTeamBPlayers(teamBPlayers.filter(p => p.id !== id))}
          incomingPlayers={teamAPlayers}
        />
      </div>

      <div className="flex justify-center pt-2">
        <button
          disabled={!teamAId || !teamBId || (teamAPlayers.length === 0 && teamBPlayers.length === 0) || loading}
          onClick={handleAnalyzeTrade}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-800 disabled:text-slate-600 text-white font-semibold px-6 py-3 rounded-xl transition-all shadow-lg cursor-pointer disabled:cursor-not-allowed"
        >
          <Sparkles className="w-5 h-5" />
          {loading ? 'Executing RAG Analysis...' : 'Analyze Trade Viability'}
        </button>
      </div>

      {verdict && (
        <div className="bg-slate-800 border border-slate-700 rounded-xl p-6 shadow-xl space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-slate-400">Verdict:</span>
            <span className="bg-emerald-500/20 text-emerald-400 text-xs font-bold px-2.5 py-1 rounded-full border border-emerald-500/30">
              {verdict.status}
            </span>
          </div>
          <div className="text-slate-300 text-sm whitespace-pre-line leading-relaxed">
            {verdict.analysis}
          </div>
        </div>
      )}
    </div>
  );
}