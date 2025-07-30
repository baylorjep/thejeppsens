'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Trophy, Users, RotateCcw, Sparkles, ChevronRight } from 'lucide-react';
import Confetti from 'react-confetti';

interface Team {
  id: number;
  name: string;
  seed: number;
  eliminated: boolean;
  wins: number;
}

interface BracketRound {
  round: number;
  name: string;
  teams: Team[];
  matchups: number[][]; // Array of [team1Id, team2Id] pairs
}

export default function BracketBuilder() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [newTeam, setNewTeam] = useState('');
  const [bracketSize, setBracketSize] = useState<4 | 8 | 16>(8);
  const [bracketRounds, setBracketRounds] = useState<BracketRound[]>([]);
  const [currentRound, setCurrentRound] = useState(0);
  const [winner, setWinner] = useState<Team | null>(null);
  const [showConfetti, setShowConfetti] = useState(false);
  const [selectedMatchup, setSelectedMatchup] = useState<number | null>(null);

  const addTeam = () => {
    if (newTeam.trim() && teams.length < bracketSize) {
      const team: Team = {
        id: Date.now(),
        name: newTeam.trim(),
        seed: teams.length + 1,
        eliminated: false,
        wins: 0
      };
      setTeams([...teams, team]);
      setNewTeam('');
    }
  };

  const removeTeam = (id: number) => {
    setTeams(teams.filter(team => team.id !== id));
  };

  const generateBracket = () => {
    if (teams.length !== bracketSize) return;

    // Sort teams by seed (1, 2, 3, 4...)
    const sortedTeams = [...teams].sort((a, b) => a.seed - b.seed);
    
    // Create matchups for first round (1v8, 2v7, 3v6, 4v5 for 8-team bracket)
    const matchups: number[][] = [];
    for (let i = 0; i < sortedTeams.length / 2; i++) {
      matchups.push([sortedTeams[i].id, sortedTeams[sortedTeams.length - 1 - i].id]);
    }
    
    // Create first round
    const firstRound: BracketRound = {
      round: 1,
      name: getRoundName(1, bracketSize),
      teams: sortedTeams,
      matchups
    };

    setBracketRounds([firstRound]);
    setCurrentRound(1);
    setWinner(null);
    setShowConfetti(false);
    setSelectedMatchup(null);
  };

  const getRoundName = (round: number, size: number): string => {
    if (size === 4) {
      return round === 1 ? 'Semifinals' : 'Championship';
    } else if (size === 8) {
      return round === 1 ? 'Quarterfinals' : round === 2 ? 'Semifinals' : 'Championship';
    } else {
      return round === 1 ? 'First Round' : round === 2 ? 'Second Round' : round === 3 ? 'Sweet 16' : round === 4 ? 'Elite 8' : 'Final Four';
    }
  };

  const selectWinner = (teamId: number) => {
    if (currentRound === 0) return;

    const currentRoundData = bracketRounds[currentRound - 1];
    
    // Find the matchup this team is in
    const matchup = currentRoundData.matchups.find(m => m.includes(teamId));
    if (!matchup) return;
    
    // Get the other team in the matchup
    const otherTeamId = matchup.find(id => id !== teamId);
    if (!otherTeamId) return;
    
    const updatedTeams = currentRoundData.teams.map(team => {
      if (team.id === teamId) {
        return { ...team, wins: team.wins + 1 };
      } else if (team.id === otherTeamId) {
        return { ...team, eliminated: true };
      }
      return team;
    });

    const updatedRounds = [...bracketRounds];
    updatedRounds[currentRound - 1] = {
      ...currentRoundData,
      teams: updatedTeams
    };

    // Check if round is complete
    const remainingTeams = updatedTeams.filter(team => !team.eliminated);
    
    if (remainingTeams.length === 1) {
      // We have a winner!
      setWinner(remainingTeams[0]);
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 5000);
      return;
    }

    // Create next round
    if (remainingTeams.length >= 2) {
      const nextMatchups: number[][] = [];
      for (let i = 0; i < remainingTeams.length; i += 2) {
        if (i + 1 < remainingTeams.length) {
          nextMatchups.push([remainingTeams[i].id, remainingTeams[i + 1].id]);
        }
      }

      const nextRound: BracketRound = {
        round: currentRound + 1,
        name: getRoundName(currentRound + 1, bracketSize),
        teams: remainingTeams,
        matchups: nextMatchups
      };
      updatedRounds.push(nextRound);
      setCurrentRound(currentRound + 1);
    }

    setBracketRounds(updatedRounds);
    setSelectedMatchup(null); // Clear selection after making a choice
  };

  const resetBracket = () => {
    setBracketRounds([]);
    setCurrentRound(0);
    setWinner(null);
    setShowConfetti(false);
    setSelectedMatchup(null);
  };

  const renderMatchup = (team1: Team, team2: Team, matchupIndex: number, roundIndex: number) => {
    const isCurrentRound = roundIndex === currentRound - 1;
    const isSelected = selectedMatchup === matchupIndex;

    return (
      <motion.div
        key={`${team1.id}-${team2.id}`}
        className={`relative mb-4 ${
          isCurrentRound ? 'cursor-pointer' : ''
        }`}
        onClick={() => isCurrentRound && setSelectedMatchup(matchupIndex)}
      >
        {/* Team 1 */}
        <motion.div
          className={`p-3 rounded-lg border-2 transition-all ${
            team1.eliminated
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : team1.wins > 0
              ? 'border-green-400 bg-green-50'
              : isCurrentRound && isSelected
              ? 'border-gray-400 bg-gray-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          whileHover={isCurrentRound ? { scale: 1.02 } : {}}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-500">#{team1.seed}</span>
              <span className="font-medium">{team1.name}</span>
            </div>
            {team1.wins > 0 && <Trophy className="h-4 w-4 text-green-500" />}
          </div>
        </motion.div>

        {/* VS */}
        <div className="text-center text-xs text-gray-400 my-1">vs</div>

        {/* Team 2 */}
        <motion.div
          className={`p-3 rounded-lg border-2 transition-all ${
            team2.eliminated
              ? 'border-gray-200 bg-gray-50 text-gray-400'
              : team2.wins > 0
              ? 'border-green-400 bg-green-50'
              : isCurrentRound && isSelected
              ? 'border-gray-400 bg-gray-50'
              : 'border-gray-200 bg-white hover:border-gray-300'
          }`}
          whileHover={isCurrentRound ? { scale: 1.02 } : {}}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-bold text-gray-500">#{team2.seed}</span>
              <span className="font-medium">{team2.name}</span>
            </div>
            {team2.wins > 0 && <Trophy className="h-4 w-4 text-green-500" />}
          </div>
        </motion.div>

        {/* Winner Selection Buttons */}
        {isCurrentRound && isSelected && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex space-x-2 mt-2"
          >
            <button
              onClick={() => selectWinner(team1.id)}
              className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              {team1.name} Wins
            </button>
            <button
              onClick={() => selectWinner(team2.id)}
              className="flex-1 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm"
            >
              {team2.name} Wins
            </button>
          </motion.div>
        )}
      </motion.div>
    );
  };

  const renderBracketRound = (round: BracketRound, roundIndex: number) => {
    return (
      <motion.div
        key={round.round}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="flex flex-col"
      >
        <h3 className="text-lg font-semibold text-gray-700 text-center mb-4">
          {round.name}
        </h3>
        <div className="space-y-2">
          {round.matchups.map((matchup, index) => {
            const team1 = round.teams.find(t => t.id === matchup[0]);
            const team2 = round.teams.find(t => t.id === matchup[1]);
            if (team1 && team2) {
              return renderMatchup(team1, team2, index, roundIndex);
            }
            return null;
          })}
        </div>
      </motion.div>
    );
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Trophy className="inline-block h-8 w-8 text-gray-700 mr-3" />
            March Madness Bracket
          </h2>
          <p className="text-xl text-gray-600">Create your own tournament bracket!</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Setup Panel */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Bracket Size Selection */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
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
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Add Teams ({teams.length}/{bracketSize})
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newTeam}
                  onChange={(e) => setNewTeam(e.target.value)}
                  placeholder="Team name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
              
              {/* Teams List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
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
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
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
          </motion.div>

          {/* Bracket Display */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200 overflow-x-auto"
          >
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
                <AnimatePresence>
                  {winner && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="text-center py-6 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200"
                    >
                      <Sparkles className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                      <h3 className="text-2xl font-bold text-gray-800 mb-2">🏆 Champion! 🏆</h3>
                      <p className="text-xl text-gray-700">#{winner.seed} {winner.name}</p>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </motion.div>
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