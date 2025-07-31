'use client';

import { useState, useEffect } from 'react';
import { Trophy, Users, RotateCcw, Sparkles } from 'lucide-react';
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
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

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

  // Calculate responsive sizing based on bracket size and screen size
  const getResponsiveSizing = () => {
    const isMobile = screenSize.width < 768;
    const isTablet = screenSize.width < 1024;
    
    // Base sizes that scale with bracket size - more aggressive scaling
    const baseSizes = {
      4: { teamWidth: 'w-48', teamHeight: 'h-20', textSize: 'text-lg', seedSize: 'text-base' },
      8: { teamWidth: 'w-36', teamHeight: 'h-14', textSize: 'text-sm', seedSize: 'text-xs' },
      16: { teamWidth: 'w-24', teamHeight: 'h-10', textSize: 'text-xs', seedSize: 'text-xs' }
    };

    const sizes = baseSizes[bracketSize];

    // Scale down for smaller screens
    if (isMobile) {
      return {
        teamWidth: 'w-20',
        teamHeight: 'h-8',
        textSize: 'text-xs',
        seedSize: 'text-xs',
        gap: 'gap-1',
        containerHeight: 'h-[60vh]'
      };
    } else if (isTablet) {
      return {
        teamWidth: sizes.teamWidth.replace('w-48', 'w-32').replace('w-36', 'w-28').replace('w-24', 'w-20'),
        teamHeight: sizes.teamHeight.replace('h-20', 'h-12').replace('h-14', 'h-10').replace('h-10', 'h-8'),
        textSize: sizes.textSize.replace('text-lg', 'text-sm').replace('text-sm', 'text-xs').replace('text-xs', 'text-xs'),
        seedSize: sizes.seedSize.replace('text-base', 'text-xs').replace('text-sm', 'text-xs').replace('text-xs', 'text-xs'),
        gap: 'gap-2',
        containerHeight: 'h-[70vh]'
      };
    }

    return {
      ...sizes,
      gap: 'gap-3',
      containerHeight: 'h-[75vh]'
    };
  };

  const renderMatchup = (matchup: Matchup, roundIndex: number, matchupIndex: number) => {
    const isCurrentRound = roundIndex === bracketRounds.length - 1;
    const isCompleted = matchup.completed;
    const sizing = getResponsiveSizing();

    return (
      <div key={matchup.id} className={`relative ${sizing.gap} flex flex-col`}>
        {/* Team 1 */}
        <div
          className={`${sizing.teamWidth} ${sizing.teamHeight} p-2 rounded-lg border-2 transition-all ${
            isCompleted && matchup.winner?.id !== matchup.team1.id
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : isCompleted && matchup.winner?.id === matchup.team1.id
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${isCurrentRound && !isCompleted ? 'cursor-pointer' : ''}`}
          onClick={() => isCurrentRound && !isCompleted && selectWinner(roundIndex, matchupIndex, matchup.team1)}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-1">
              <span className={`font-bold text-gray-500 ${sizing.seedSize}`}>#{matchup.team1.seed}</span>
              <span className={`font-medium truncate ${sizing.textSize}`}>{matchup.team1.name}</span>
            </div>
            {isCompleted && matchup.winner?.id === matchup.team1.id && (
              <Trophy className="h-3 w-3 text-green-500 flex-shrink-0" />
            )}
          </div>
        </div>

        {/* VS */}
        <div className={`text-center text-gray-400 ${sizing.textSize} my-1`}>vs</div>

        {/* Team 2 */}
        <div
          className={`${sizing.teamWidth} ${sizing.teamHeight} p-2 rounded-lg border-2 transition-all ${
            isCompleted && matchup.winner?.id !== matchup.team2.id
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : isCompleted && matchup.winner?.id === matchup.team2.id
              ? 'border-green-400 bg-green-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          } ${isCurrentRound && !isCompleted ? 'cursor-pointer' : ''}`}
          onClick={() => isCurrentRound && !isCompleted && selectWinner(roundIndex, matchupIndex, matchup.team2)}
        >
          <div className="flex items-center justify-between h-full">
            <div className="flex items-center space-x-1">
              <span className={`font-bold text-gray-500 ${sizing.seedSize}`}>#{matchup.team2.seed}</span>
              <span className={`font-medium truncate ${sizing.textSize}`}>{matchup.team2.name}</span>
            </div>
            {isCompleted && matchup.winner?.id === matchup.team2.id && (
              <Trophy className="h-3 w-3 text-green-500 flex-shrink-0" />
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBracketRound = (round: BracketRound, roundIndex: number) => {
    const totalRounds = Math.ceil(Math.log2(bracketSize));
    const sizing = getResponsiveSizing();
    
    // Calculate positioning based on round
    const roundProgress = roundIndex / (totalRounds - 1); // 0 = first round, 1 = final round
    
    // For 4-corners layout, we need to position matchups in corners for first round
    if (roundIndex === 0) {
      // First round: distribute matchups to 4 corners
      const matchupsPerCorner = Math.ceil(round.matchups.length / 4);
      
      return (
        <div key={round.round} className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-2 p-2">
          {/* Top Left Corner */}
          <div className="flex flex-col items-start justify-start space-y-1">
            {round.matchups.slice(0, matchupsPerCorner).map((matchup, index) => 
              renderMatchup(matchup, roundIndex, index)
            )}
          </div>
          
          {/* Top Right Corner */}
          <div className="flex flex-col items-end justify-start space-y-1">
            {round.matchups.slice(matchupsPerCorner, matchupsPerCorner * 2).map((matchup, index) => 
              renderMatchup(matchup, roundIndex, index + matchupsPerCorner)
            )}
          </div>
          
          {/* Bottom Left Corner */}
          <div className="flex flex-col items-start justify-end space-y-1">
            {round.matchups.slice(matchupsPerCorner * 2, matchupsPerCorner * 3).map((matchup, index) => 
              renderMatchup(matchup, roundIndex, index + matchupsPerCorner * 2)
            )}
          </div>
          
          {/* Bottom Right Corner */}
          <div className="flex flex-col items-end justify-end space-y-1">
            {round.matchups.slice(matchupsPerCorner * 3).map((matchup, index) => 
              renderMatchup(matchup, roundIndex, index + matchupsPerCorner * 3)
            )}
          </div>
        </div>
      );
    } else {
      // Later rounds: converge toward center
      const centerOffset = roundProgress * 0.3; // Move 30% toward center
      
      return (
        <div key={round.round} className="absolute inset-0 flex items-center justify-center">
          <div 
            className="flex flex-col items-center space-y-1"
            style={{
              transform: `scale(${1 - centerOffset * 0.3})`,
              opacity: 1 - centerOffset * 0.2
            }}
          >
            {round.matchups.map((matchup, index) => 
              renderMatchup(matchup, roundIndex, index)
            )}
          </div>
        </div>
      );
    }
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Trophy className="inline-block h-8 w-8 text-gray-700 mr-3" />
            March Madness Bracket
          </h2>
          <p className="text-xl text-gray-600">Create your own tournament bracket!</p>
        </div>

        {/* Setup Panel - Compact Horizontal Layout */}
        <div className="bg-white rounded-xl p-4 shadow-lg border border-gray-200 mb-6">
          <div className="grid md:grid-cols-3 gap-4">
            {/* Bracket Size Selection */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-800">Tournament Size</h3>
              <div className="grid grid-cols-3 gap-2">
                {[4, 8, 16].map(size => (
                  <button
                    key={size}
                    onClick={() => setBracketSize(size as 4 | 8 | 16)}
                    className={`p-2 rounded-lg border-2 transition-all ${
                      bracketSize === size
                        ? 'border-gray-700 bg-gray-50 text-gray-700'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="text-lg font-bold">{size}</div>
                    <div className="text-xs">Teams</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Add Teams */}
            <div>
              <h3 className="text-sm font-semibold mb-2 text-gray-800">
                Add Teams ({teams.length}/{bracketSize})
              </h3>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  placeholder="Team name..."
                  className="flex-1 px-3 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addTeam()}
                  disabled={teams.length >= bracketSize}
                />
                <button
                  onClick={addTeam}
                  disabled={teams.length >= bracketSize}
                  className="px-3 py-1 text-sm bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300"
                >
                  Add
                </button>
              </div>
              <div className="space-y-1 max-h-20 overflow-y-auto">
                {teams.map((team) => (
                  <div key={team.id} className="flex items-center justify-between p-1 bg-gray-50 rounded text-xs">
                    <div className="flex items-center space-x-1">
                      <span className="font-bold text-gray-500">#{team.seed}</span>
                      <span className="font-medium truncate">{team.name}</span>
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
                className={`w-full py-3 rounded-lg text-lg font-bold text-white transition-all ${
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
                  className="w-full mt-2 py-1 text-sm rounded-lg text-gray-600 hover:bg-gray-100 transition-colors"
                >
                  <RotateCcw className="inline-block h-3 w-3 mr-1" />
                  Reset
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Bracket Display - Full Screen */}
        <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${getResponsiveSizing().containerHeight} relative overflow-hidden`}>
          {bracketRounds.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Add teams and generate your bracket to get started!</p>
              </div>
            </div>
          ) : (
            <div className="relative w-full h-full">
              {bracketRounds.map((round, index) => 
                renderBracketRound(round, index)
              )}
              
              {/* Winner Display - Center */}
              {winner && (
                <div className="absolute inset-0 flex items-center justify-center bg-white/90 backdrop-blur-sm">
                  <div className="text-center py-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200 px-8">
                    <Sparkles className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <h3 className="text-2xl font-bold text-gray-800 mb-2">🏆 Champion! 🏆</h3>
                    <p className="text-xl text-gray-700">#{winner.seed} {winner.name}</p>
                  </div>
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