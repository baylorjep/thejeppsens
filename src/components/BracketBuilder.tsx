'use client';

import { useState } from 'react';
import { Trophy, Users, RotateCcw, ChevronRight, Sparkles } from 'lucide-react';
import Confetti from 'react-confetti';

interface Team {
  id: number;
  name: string;
  seed: number;
}

interface Matchup {
  id: number;
  team1: Team;
  team2: Team;
  winner: Team | null;
  completed: boolean;
}

interface BracketRound {
  round: number;
  name: string;
  matchups: Matchup[];
}

export default function BracketBuilder() {
  const [bracketSize, setBracketSize] = useState<4 | 8 | 16>(8);
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeam, setNewTeam] = useState('');
  const [bracketRounds, setBracketRounds] = useState<BracketRound[]>([]);
  const [winner, setWinner] = useState<Team | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);

  const addTeam = () => {
    if (newTeam.trim() && teams.length < bracketSize) {
      const newTeamObj: Team = {
        id: Date.now(),
        name: newTeam.trim(),
        seed: teams.length + 1
      };
      setTeams([...teams, newTeamObj]);
      setNewTeam('');
    }
  };

  const removeTeam = (id: number) => {
    setTeams(teams.filter(team => team.id !== id).map((team, index) => ({ ...team, seed: index + 1 })));
  };

  const generateBracket = () => {
    if (teams.length !== bracketSize) return;

    // Create first round matchups with proper seeding
    const firstRoundMatchups: Matchup[] = [];
    for (let i = 0; i < teams.length / 2; i++) {
      firstRoundMatchups.push({
        id: i,
        team1: teams[i],
        team2: teams[teams.length - 1 - i],
        winner: null,
        completed: false
      });
    }

    const firstRound: BracketRound = {
      round: 1,
      name: getRoundName(1, bracketSize),
      matchups: firstRoundMatchups
    };

    setBracketRounds([firstRound]);
    setWinner(null);
    setShowConfetti(false);
  };

  const getRoundName = (round: number, size: number): string => {
    if (size === 4) return round === 1 ? 'Semifinals' : 'Championship';
    if (size === 8) return round === 1 ? 'Quarterfinals' : round === 2 ? 'Semifinals' : 'Championship';
    return round === 1 ? 'Round of 16' : round === 2 ? 'Quarterfinals' : round === 3 ? 'Semifinals' : 'Championship';
  };

  const selectWinner = (roundIndex: number, matchupIndex: number, winningTeam: Team) => {
    const updatedRounds = [...bracketRounds];
    const currentRound = updatedRounds[roundIndex];
    
    // Mark the matchup as completed with the winner
    currentRound.matchups[matchupIndex].winner = winningTeam;
    currentRound.matchups[matchupIndex].completed = true;

    // Check if current round is complete
    const allMatchupsComplete = currentRound.matchups.every(matchup => matchup.completed);
    
    if (allMatchupsComplete) {
      // Get all winners from this round
      const winners = currentRound.matchups.map(matchup => matchup.winner!);
      
      // Check if we have a champion (only one winner left)
      if (winners.length === 1) {
        setWinner(winners[0]);
        setShowConfetti(true);
        setTimeout(() => setShowConfetti(false), 5000);
        return;
      }
      
      // Create next round with winners
      const nextMatchups: Matchup[] = [];
      for (let i = 0; i < winners.length; i += 2) {
        if (i + 1 < winners.length) {
          nextMatchups.push({
            id: i / 2,
            team1: winners[i],
            team2: winners[i + 1],
            winner: null,
            completed: false
          });
        }
      }

      const nextRound: BracketRound = {
        round: currentRound.round + 1,
        name: getRoundName(currentRound.round + 1, bracketSize),
        matchups: nextMatchups
      };
      
      updatedRounds.push(nextRound);
    }

    setBracketRounds(updatedRounds);
  };

  const resetBracket = () => {
    setBracketRounds([]);
    setWinner(null);
    setShowConfetti(false);
  };

  const renderMatchup = (matchup: Matchup, roundIndex: number, matchupIndex: number) => {
    const isCurrentRound = roundIndex === bracketRounds.length - 1;
    const isCompleted = matchup.completed;

    return (
      <div key={matchup.id} className="relative mb-4">
        {/* Team 1 */}
        <div
          className={`p-3 rounded-lg border-2 transition-all ${
            isCompleted && matchup.winner?.id !== matchup.team1.id
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : isCompleted && matchup.winner?.id === matchup.team1.id
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${isCurrentRound && !isCompleted ? 'cursor-pointer' : ''}`}
          onClick={() => isCurrentRound && !isCompleted && selectWinner(roundIndex, matchupIndex, matchup.team1)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-500">#{matchup.team1.seed}</span>
              <span className="font-medium">{matchup.team1.name}</span>
            </div>
            {isCompleted && matchup.winner?.id === matchup.team1.id && (
              <Trophy className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>

        {/* VS */}
        <div className="text-center text-xs text-gray-400 my-1">vs</div>

        {/* Team 2 */}
        <div
          className={`p-3 rounded-lg border-2 transition-all ${
            isCompleted && matchup.winner?.id !== matchup.team2.id
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : isCompleted && matchup.winner?.id === matchup.team2.id
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${isCurrentRound && !isCompleted ? 'cursor-pointer' : ''}`}
          onClick={() => isCurrentRound && !isCompleted && selectWinner(roundIndex, matchupIndex, matchup.team2)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-500">#{matchup.team2.seed}</span>
              <span className="font-medium">{matchup.team2.name}</span>
            </div>
            {isCompleted && matchup.winner?.id === matchup.team2.id && (
              <Trophy className="h-4 w-4 text-green-500" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBracketRound = (round: BracketRound, roundIndex: number) => {
    return (
      <div key={round.round} className="flex flex-col">
        <h3 className="text-lg font-semibold text-gray-700 text-center mb-4">
          {round.name}
        </h3>
        <div className="space-y-2">
          {round.matchups.map((matchup, index) => 
            renderMatchup(matchup, roundIndex, index)
          )}
        </div>
      </div>
    );
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Trophy className="inline-block h-8 w-8 text-gray-700 mr-3" />
            March Madness Bracket
          </h2>
          <p className="text-xl text-gray-600">Create your own tournament bracket!</p>
        </div>

        {/* Setup Panel - Horizontal Layout */}
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
                    <div className="text-2xl font-bold">{size}</div>
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
                  <div key={team.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-bold text-gray-500">#{team.seed}</span>
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

            {/* Generate Button */}
            <div className="flex flex-col justify-center">
              <button
                onClick={generateBracket}
                disabled={teams.length !== bracketSize}
                className={`w-full py-4 rounded-lg text-xl font-bold text-white transition-all ${
                  teams.length === bracketSize
                    ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-800 hover:to-gray-900'
                    : 'bg-gray-300 cursor-not-allowed'
                }`}
              >
                Generate Bracket
              </button>
              
              {bracketRounds.length > 0 && (
                <button
                  onClick={resetBracket}
                  className="w-full mt-3 py-2 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <RotateCcw className="inline-block h-4 w-4 mr-2" />
                  Reset Bracket
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bracket Display - Full Width */}
        <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 overflow-x-auto">
          {bracketRounds.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <p>Add teams and generate your bracket to get started!</p>
            </div>
          ) : (
            <div className="flex space-x-8 min-w-max">
              {bracketRounds.map((round, index) => (
                <div key={round.round} className="flex flex-col">
                  {renderBracketRound(round, index)}
                  {index < bracketRounds.length - 1 && (
                    <ChevronRight className="h-6 w-6 text-gray-400 mx-auto my-4" />
                  )}
                </div>
              ))}
              
              {/* Winner Display */}
              {winner && (
                <div className="text-center py-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200">
                  <Sparkles className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">🏆 Champion! 🏆</h3>
                  <p className="text-xl text-gray-700">#{winner.seed} {winner.name}</p>
                </div>
              )}
            </div>
          )}
        </div>

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