import React from 'react';
import { UserMinus } from 'lucide-react';

export default function TeamPanel({ 
  label, 
  teams, 
  selectedTeamId, 
  onSelectTeam, 
  availablePlayers, 
  selectedPlayers, 
  onAddPlayer, 
  onRemovePlayer,
  incomingPlayers
}) {
  const currentTeam = teams.find(t => t.id === selectedTeamId);
  const currentCap = currentTeam ? currentTeam.capSpace : 0;

  const outgoingCap = selectedPlayers.reduce((acc, p) => acc + p.capHit, 0);
  const incomingCap = incomingPlayers.reduce((acc, p) => acc + p.capHit, 0);
  const projectedCap = currentCap - incomingCap + outgoingCap;
  const capDelta = outgoingCap - incomingCap;

  return (
    <div className="bg-slate-800 border border-slate-700 rounded-xl p-5 flex flex-col justify-between shadow-lg">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-slate-200">{label}</h2>
          {currentTeam && (
            <span className="text-xs bg-slate-700 text-slate-300 px-2.5 py-1 rounded-full font-mono">
              Cap: ${(currentCap / 1e6).toFixed(2)}M
            </span>
          )}
        </div>

        {/* Team Dropdown */}
        <div className="mb-4">
          <label className="block text-xs text-slate-400 mb-1">Select Franchise</label>
          <select 
            value={selectedTeamId} 
            onChange={(e) => onSelectTeam(e.target.value)}
            className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="">-- Choose Team --</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>

        {/* Player Dropdown */}
        {selectedTeamId && (
          <div className="mb-4">
            <label className="block text-xs text-slate-400 mb-1">Add Player to Trade</label>
            <select 
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  const player = availablePlayers.find(p => p.id === e.target.value);
                  onAddPlayer(player);
                  e.target.value = "";
                }
              }}
              className="w-full bg-slate-900 border border-slate-700 text-slate-200 rounded-lg p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
            >
              <option value="">-- Select Player --</option>
              {availablePlayers.map(p => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.position}) - ${(p.capHit / 1e6).toFixed(2)}M
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Selected Players List */}
        <div className="mt-4">
          <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Sending Assets ({selectedPlayers.length})
          </h3>
          <div className="space-y-2 min-h-[120px] max-h-[200px] overflow-y-auto pr-1">
            {selectedPlayers.length === 0 ? (
              <div className="text-sm text-slate-500 italic p-3 border border-dashed border-slate-700 rounded-lg text-center">
                No players added to trade
              </div>
            ) : (
              selectedPlayers.map(player => (
                <div key={player.id} className="flex justify-between items-center bg-slate-900/80 border border-slate-700/60 p-3 rounded-lg">
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{player.name}</p>
                    <p className="text-xs text-slate-400">{player.position} | Cap Hit: ${(player.capHit / 1e6).toFixed(2)}M</p>
                  </div>
                  <button 
                    onClick={() => onRemovePlayer(player.id)}
                    className="text-slate-500 hover:text-red-400 p-1 transition-colors cursor-pointer"
                    title="Remove Player"
                  >
                    <UserMinus className="w-4 h-4" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Cap Visualizer Footer */}
      {selectedTeamId && (
        <div className="mt-6 pt-4 border-t border-slate-700/80 bg-slate-900/50 -mx-5 -mb-5 p-5 rounded-b-xl">
          <div className="flex justify-between items-center text-sm mb-1">
            <span className="text-slate-400">Projected Cap:</span>
            <span className={`font-mono font-bold ${projectedCap < 0 ? 'text-red-400' : 'text-slate-200'}`}>
              ${(projectedCap / 1e6).toFixed(2)}M
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-slate-500">Net Delta:</span>
            <span className={`font-mono ${capDelta >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {capDelta >= 0 ? '+' : ''}${(capDelta / 1e6).toFixed(2)}M
            </span>
          </div>
        </div>
      )}
    </div>
  );
}