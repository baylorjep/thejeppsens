'use client';

import { useState, useEffect, useCallback } from 'react';
import { Trophy, Users, RotateCcw, Sparkles } from 'lucide-react';
import Confetti from 'react-confetti';

interface Team {
  id: number;
  name: string;
  seed: number;
}

interface BracketSlot {
  id: string;
  round: number;
  position: number;
  team: Team | null;
  isWinner: boolean;
  isPlayable: boolean;
}

export default function BracketBuilder() {
  const [bracketSize, setBracketSize] = useState<4 | 8 | 16>(8);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeam, setNewTeam] = useState('');
  const [bracketSlots, setBracketSlots] = useState<BracketSlot[]>([]);
  const [winner, setWinner] = useState<Team | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  // Generate bracket template whenever bracket size changes
  const generateBracketTemplate = useCallback(() => {
    const slots: BracketSlot[] = [];
    const totalRounds = Math.ceil(Math.log2(bracketSize));
    
    // Generate all possible slots for the bracket
    for (let round = 1; round <= totalRounds; round++) {
      const teamsInRound = bracketSize / Math.pow(2, round - 1);
      for (let position = 0; position < teamsInRound; position++) {
        slots.push({
          id: `${round}-${position}`,
          round,
          position,
          team: null,
          isWinner: false,
          isPlayable: false
        });
      }
    }
    
    setBracketSlots(slots);
    setWinner(null);
    setShowConfetti(false);
  }, [bracketSize]);

  useEffect(() => {
    generateBracketTemplate();
  }, [bracketSize, generateBracketTemplate]);

  const addTeam = () => {
    if (newTeam.trim() && teams.length < bracketSize) {
      const newTeamObj: Team = {
        id: Date.now(),
        name: newTeam.trim(),
        seed: teams.length + 1
      };
      const updatedTeams = [...teams, newTeamObj];
      setTeams(updatedTeams);
      setNewTeam('');
      
      // If this is the last team, populate the first round
      if (updatedTeams.length === bracketSize) {
        populateFirstRound(updatedTeams);
      }
    }
  };

  const populateFirstRound = (teamList: Team[]) => {
    const updatedSlots = [...bracketSlots];
    
    // Populate first round with teams in proper seeding order
    const firstRoundSlots = updatedSlots.filter(slot => slot.round === 1);
    const totalFirstRoundSlots = firstRoundSlots.length;
    
    firstRoundSlots.forEach((slot, index) => {
      const teamIndex = index < totalFirstRoundSlots / 2 
        ? index 
        : totalFirstRoundSlots - 1 - (index - totalFirstRoundSlots / 2);
      
      if (teamList[teamIndex]) {
        slot.team = teamList[teamIndex];
        slot.isPlayable = true;
      }
    });
    
    setBracketSlots(updatedSlots);
  };

  const removeTeam = (id: number) => {
    const updatedTeams = teams.filter(team => team.id !== id).map((team, index) => ({ ...team, seed: index + 1 }));
    setTeams(updatedTeams);
    
    // Clear bracket if not enough teams
    if (updatedTeams.length < bracketSize) {
      const updatedSlots = bracketSlots.map(slot => ({
        ...slot,
        team: null,
        isWinner: false,
        isPlayable: false
      }));
      setBracketSlots(updatedSlots);
    } else if (updatedTeams.length === bracketSize) {
      // Repopulate first round with updated teams
      populateFirstRound(updatedTeams);
    }
  };

  const selectWinner = (slotId: string) => {
    const slot = bracketSlots.find(s => s.id === slotId);
    if (!slot || !slot.isPlayable || !slot.team) return;

    const updatedSlots = [...bracketSlots];
    const currentSlot = updatedSlots.find(s => s.id === slotId)!;
    
    // Mark this slot as winner
    currentSlot.isWinner = true;
    currentSlot.isPlayable = false;
    
    // Find the next round slot and advance the team
    const nextRound = currentSlot.round + 1;
    const nextPosition = Math.floor(currentSlot.position / 2);
    const nextSlotId = `${nextRound}-${nextPosition}`;
    const nextSlot = updatedSlots.find(s => s.id === nextSlotId);
    
    if (nextSlot) {
      nextSlot.team = currentSlot.team;
      
      // Check if both teams in the matchup are ready
      const otherPosition = currentSlot.position % 2 === 0 ? currentSlot.position + 1 : currentSlot.position - 1;
      const otherSlotId = `${currentSlot.round}-${otherPosition}`;
      const otherSlot = updatedSlots.find(s => s.id === otherSlotId);
      
      if (otherSlot && otherSlot.team && otherSlot.isWinner) {
        // Both teams are set, make the next round slot playable
        nextSlot.isPlayable = true;
      }
      
      // Check if we have a champion
      if (nextRound > Math.ceil(Math.log2(bracketSize))) {
        setWinner(currentSlot.team);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
      }
    }
    
    setBracketSlots(updatedSlots);
  };

  const resetBracket = () => {
    setTeams([]);
    setBracketSlots([]);
    setWinner(null);
    setShowConfetti(false);
    generateBracketTemplate();
  };

  const renderBracketSlot = (slot: BracketSlot) => {
    const isFirstRound = slot.round === 1;
    
    return (
      <div
        key={slot.id}
        className={`p-3 rounded-lg border-2 transition-all cursor-pointer ${
          slot.team
            ? slot.isWinner
              ? 'border-green-400 bg-green-50 shadow-md'
              : slot.isPlayable
              ? 'border-blue-300 bg-blue-50 hover:border-blue-400 hover:shadow-md'
              : 'border-gray-200 bg-white'
            : 'border-gray-200 bg-gray-50'
        }`}
        onClick={() => slot.isPlayable && selectWinner(slot.id)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            {slot.team && (
              <>
                <span className="text-xs font-bold text-gray-500 bg-gray-100 px-2 py-1 rounded">
                  #{slot.team.seed}
                </span>
                <span className="font-medium text-gray-800">{slot.team.name}</span>
              </>
            )}
            {!slot.team && (
              <span className="text-gray-400 text-sm">
                {isFirstRound ? `Seed ${slot.position + 1}` : 'TBD'}
              </span>
            )}
          </div>
          {slot.isWinner && slot.team && (
            <Trophy className="h-4 w-4 text-green-500" />
          )}
        </div>
      </div>
    );
  };

  const renderBracket = () => {
    const totalRounds = Math.ceil(Math.log2(bracketSize));
    
    return (
      <div className="flex justify-center space-x-8 p-8">
        {Array.from({ length: totalRounds }, (_, roundIndex) => {
          const round = roundIndex + 1;
          const roundSlots = bracketSlots.filter(slot => slot.round === round);
          
          return (
            <div key={round} className="flex flex-col space-y-4">
              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">
                  {round === 1 ? 'First Round' : 
                   round === 2 ? 'Quarterfinals' :
                   round === 3 ? 'Semifinals' : 'Championship'}
                </h3>
              </div>
              <div className="flex flex-col space-y-2">
                {roundSlots.map(slot => renderBracketSlot(slot))}
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Trophy className="inline-block h-8 w-8 text-gray-700 mr-3" />
            Tournament Bracket
          </h2>
          <p className="text-xl text-gray-600">Create our own tournament bracket!</p>
        </div>

        {/* Setup Panel */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 mb-8">
          <div className="grid md:grid-cols-3 gap-6">
            {/* Bracket Size Selection */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Tournament Size</h3>
              <div className="grid grid-cols-3 gap-3">
                {[4, 8, 16].map(size => (
                  <button
                    key={size}
                    onClick={() => setBracketSize(size as 4 | 8 | 16)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      bracketSize === size
                        ? 'border-gray-700 bg-gray-50 text-gray-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-xl font-bold">{size}</div>
                    <div className="text-sm">Teams</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Teams */}
            <div>
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Add Teams ({teams.length}/{bracketSize})
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  placeholder="Team name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addTeam()}
                  disabled={teams.length >= bracketSize}
                />
                <button
                  onClick={addTeam}
                  disabled={teams.length >= bracketSize}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300"
                >
                  Add
                </button>
              </div>
              <div className="space-y-2 max-h-32 overflow-y-auto">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-gray-500">#{team.seed}</span>
                      <span className="font-medium">{team.name}</span>
                    </div>
                    <button
                      onClick={() => removeTeam(team.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Reset Button */}
            <div className="flex flex-col justify-center">
              <button
                onClick={resetBracket}
                className="w-full py-4 rounded-lg text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors border-2 border-gray-200"
              >
                <RotateCcw className="inline-block h-5 w-5 mr-2" />
                Reset Bracket
              </button>
            </div>
          </div>
        </div>

        {/* Bracket Display */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-x-auto">
          {bracketSlots.length === 0 ? (
            <div className="text-center py-16">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Select a tournament size to get started!</p>
            </div>
          ) : (
            renderBracket()
          )}
        </div>

        {/* Winner Display */}
        {winner && (
          <div className="fixed inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-10">
            <div className="text-center py-8 bg-gradient-to-r from-gray-50 to-gray-100 rounded-2xl border-2 border-gray-200 px-12 shadow-2xl">
              <Sparkles className="h-16 w-16 text-gray-700 mx-auto mb-6" />
              <h3 className="text-4xl font-bold text-gray-800 mb-4">🏆 Champion! 🏆</h3>
              <div className="bg-white rounded-xl p-6 border border-gray-200 mb-4">
                <p className="text-3xl font-bold text-gray-700">#{winner.seed}</p>
                <p className="text-2xl font-semibold text-gray-800">{winner.name}</p>
              </div>
              <p className="text-lg text-gray-600">Tournament Complete!</p>
            </div>
          </div>
        )}

        {/* Confetti */}
        {showConfetti && (
          <Confetti
            width={window.innerWidth}
            height={window.innerHeight}
            recycle={false}
            numberOfPieces={200}
            colors={['#f97316', '#ec4899', '#8b5cf6', '#06b6d4', '#10b981']}
          />
        )}
      </div>
    </section>
  );
} 