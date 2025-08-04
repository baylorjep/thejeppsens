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
  const [screenSize, setScreenSize] = useState({ width: 0, height: 0 });

  useEffect(() => {
    const updateScreenSize = () => {
      setScreenSize({ width: window.innerWidth, height: window.innerHeight });
    };
    
    updateScreenSize();
    window.addEventListener('resize', updateScreenSize);
    return () => window.removeEventListener('resize', updateScreenSize);
  }, []);

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
      
      if (otherSlot && otherSlot.team) {
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

  // Calculate responsive sizing based on bracket size and screen size
  const getResponsiveSizing = () => {
    const isMobile = screenSize.width < 768;
    const isTablet = screenSize.width < 1024;
    
    // Base sizes that scale with bracket size
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

  const renderBracketSlot = (slot: BracketSlot) => {
    const sizing = getResponsiveSizing();
    const isFirstRound = slot.round === 1;
    
    return (
      <div
        key={slot.id}
        className={`${sizing.teamWidth} ${sizing.teamHeight} p-2 rounded-lg border-2 transition-all ${
          slot.team
            ? slot.isWinner
              ? 'border-green-400 bg-green-50'
              : slot.isPlayable
              ? 'border-blue-300 bg-blue-50 cursor-pointer hover:border-blue-400'
              : 'border-gray-200 bg-white'
            : 'border-gray-200 bg-gray-50'
        }`}
        onClick={() => slot.isPlayable && selectWinner(slot.id)}
      >
        <div className="flex items-center justify-between h-full">
          <div className="flex items-center space-x-1">
            {slot.team && (
              <>
                <span className={`font-bold text-gray-500 ${sizing.seedSize}`}>#{slot.team.seed}</span>
                <span className={`font-medium truncate ${sizing.textSize}`}>{slot.team.name}</span>
              </>
            )}
            {!slot.team && (
              <span className={`text-gray-400 ${sizing.textSize}`}>
                {isFirstRound ? `Seed ${slot.position + 1}` : 'TBD'}
              </span>
            )}
          </div>
          {slot.isWinner && slot.team && (
            <Trophy className="h-3 w-3 text-green-500 flex-shrink-0" />
          )}
        </div>
      </div>
    );
  };

  const renderBracket = () => {
    const totalRounds = Math.ceil(Math.log2(bracketSize));
    
    return (
      <div className="relative w-full h-full">
        {/* Bracket Lines Background */}
        <div className="absolute inset-0 pointer-events-none">
          <svg className="w-full h-full" style={{ position: 'absolute', top: 0, left: 0 }}>
            {/* Draw connecting lines for bracket progression */}
            {bracketSlots.map(slot => {
              if (slot.round < totalRounds) {
                const nextRound = slot.round + 1;
                const nextPosition = Math.floor(slot.position / 2);
                const nextSlotId = `${nextRound}-${nextPosition}`;
                const nextSlot = bracketSlots.find(s => s.id === nextSlotId);
                
                if (nextSlot) {
                  // Calculate positions for connecting lines
                  const currentPos = getSlotPosition(slot);
                  const nextPos = getSlotPosition(nextSlot);
                  
                  return (
                    <line
                      key={`line-${slot.id}-${nextSlotId}`}
                      x1={currentPos.x}
                      y1={currentPos.y}
                      x2={nextPos.x}
                      y2={nextPos.y}
                      stroke="#d1d5db"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                    />
                  );
                }
              }
              return null;
            })}
          </svg>
        </div>
        
        {/* Bracket Slots - 4 Quadrant Layout */}
        <div className="relative z-10 w-full h-full">
          {Array.from({ length: totalRounds }, (_, roundIndex) => {
            const round = roundIndex + 1;
            const roundSlots = bracketSlots.filter(slot => slot.round === round);
            const isFirstRound = round === 1;
            const isFinalRound = round === totalRounds;
            
            if (isFirstRound) {
              // First round: 4 quadrants in corners
              const slotsPerRegion = roundSlots.length / 4;
              
              return (
                <div key={round} className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-8 p-6">
                  {/* WEST Region (Top Left) */}
                  <div className="flex flex-col items-start justify-start space-y-2">
                    <div className="text-xs font-bold text-gray-600 mb-2">WEST</div>
                    {roundSlots.slice(0, slotsPerRegion).map(slot => renderBracketSlot(slot))}
                  </div>
                  
                  {/* SOUTH Region (Top Right) */}
                  <div className="flex flex-col items-end justify-start space-y-2">
                    <div className="text-xs font-bold text-gray-600 mb-2 text-right">SOUTH</div>
                    {roundSlots.slice(slotsPerRegion, slotsPerRegion * 2).map(slot => renderBracketSlot(slot))}
                  </div>
                  
                  {/* EAST Region (Bottom Left) */}
                  <div className="flex flex-col items-start justify-end space-y-2">
                    <div className="text-xs font-bold text-gray-600 mb-2">EAST</div>
                    {roundSlots.slice(slotsPerRegion * 2, slotsPerRegion * 3).map(slot => renderBracketSlot(slot))}
                  </div>
                  
                  {/* MIDWEST Region (Bottom Right) */}
                  <div className="flex flex-col items-end justify-end space-y-2">
                    <div className="text-xs font-bold text-gray-600 mb-2 text-right">MIDWEST</div>
                    {roundSlots.slice(slotsPerRegion * 3).map(slot => renderBracketSlot(slot))}
                  </div>
                </div>
              );
            } else if (isFinalRound) {
              // Final round: championship in center
              return (
                <div key={round} className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-700 mb-4">CHAMPIONSHIP</div>
                    <div className="flex flex-col items-center space-y-3">
                      {roundSlots.map(slot => renderBracketSlot(slot))}
                    </div>
                  </div>
                </div>
              );
            } else {
              // Middle rounds: maintain regional positioning and converge
              if (bracketSize === 8) {
                // 8-team bracket: Round 2 is semifinals (left vs right)
                if (round === 2) {
                  return (
                    <div key={round} className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-700 mb-4">SEMIFINALS</div>
                        <div className="flex flex-col items-center space-y-2">
                          {roundSlots.map(slot => renderBracketSlot(slot))}
                        </div>
                      </div>
                    </div>
                  );
                }
              } else if (bracketSize === 16) {
                // 16-team bracket: Round 2 is regional finals, Round 3 is semifinals
                if (round === 2) {
                  // Regional finals - maintain 4-quadrant layout but closer to center
                  const slotsPerRegion = 1;
                  
                  return (
                    <div key={round} className="absolute inset-0 grid grid-cols-2 grid-rows-2 gap-8 p-6">
                      {/* WEST Regional Final - closer to center */}
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="text-xs font-bold text-gray-600 mb-2">WEST FINAL</div>
                        {roundSlots.slice(0, slotsPerRegion).map(slot => renderBracketSlot(slot))}
                      </div>
                      
                      {/* SOUTH Regional Final - closer to center */}
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="text-xs font-bold text-gray-600 mb-2">SOUTH FINAL</div>
                        {roundSlots.slice(slotsPerRegion, slotsPerRegion * 2).map(slot => renderBracketSlot(slot))}
                      </div>
                      
                      {/* EAST Regional Final - closer to center */}
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="text-xs font-bold text-gray-600 mb-2">EAST FINAL</div>
                        {roundSlots.slice(slotsPerRegion * 2, slotsPerRegion * 3).map(slot => renderBracketSlot(slot))}
                      </div>
                      
                      {/* MIDWEST Regional Final - closer to center */}
                      <div className="flex flex-col items-center justify-center space-y-2">
                        <div className="text-xs font-bold text-gray-600 mb-2">MIDWEST FINAL</div>
                        {roundSlots.slice(slotsPerRegion * 3).map(slot => renderBracketSlot(slot))}
                      </div>
                    </div>
                  );
                } else if (round === 3) {
                  // Semifinals - left vs right, even closer to center
                  return (
                    <div key={round} className="absolute inset-0 flex items-center justify-center">
                      <div className="text-center">
                        <div className="text-sm font-bold text-gray-700 mb-4">FINAL FOUR</div>
                        <div className="flex flex-col items-center space-y-2">
                          {roundSlots.map(slot => renderBracketSlot(slot))}
                        </div>
                      </div>
                    </div>
                  );
                }
              }
              
              // Fallback: center positioning for any other middle rounds
              return (
                <div key={round} className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-sm font-bold text-gray-700 mb-4">ROUND {round}</div>
                    <div className="flex flex-col items-center space-y-2">
                      {roundSlots.map(slot => renderBracketSlot(slot))}
                    </div>
                  </div>
                </div>
              );
            }
          })}
        </div>
      </div>
    );
  };

  // Helper function to calculate slot positions for connecting lines
  const getSlotPosition = (slot: BracketSlot) => {
    const totalRounds = Math.ceil(Math.log2(bracketSize));
    const round = slot.round;
    const position = slot.position;
    
    // Calculate position based on round and slot position
    const containerWidth = 800; // Approximate container width
    const containerHeight = 600; // Approximate container height
    
    if (round === 1) {
      // First round: 4 quadrants
      const slotsPerRegion = bracketSize / 4;
      const regionIndex = Math.floor(position / slotsPerRegion);
      const regionPosition = position % slotsPerRegion;
      
      let x, y;
      switch (regionIndex) {
        case 0: // WEST (top left)
          x = containerWidth * 0.2;
          y = containerHeight * (0.2 + regionPosition * 0.15);
          break;
        case 1: // SOUTH (top right)
          x = containerWidth * 0.8;
          y = containerHeight * (0.2 + regionPosition * 0.15);
          break;
        case 2: // EAST (bottom left)
          x = containerWidth * 0.2;
          y = containerHeight * (0.6 + regionPosition * 0.15);
          break;
        case 3: // MIDWEST (bottom right)
          x = containerWidth * 0.8;
          y = containerHeight * (0.6 + regionPosition * 0.15);
          break;
        default:
          x = containerWidth * 0.5;
          y = containerHeight * 0.5;
      }
      return { x, y };
    } else if (round === totalRounds) {
      // Final round: center
      return {
        x: containerWidth * 0.5,
        y: containerHeight * 0.5
      };
    } else {
      // Middle rounds: converge toward center
      const progress = (round - 1) / (totalRounds - 1);
      const centerX = containerWidth * 0.5;
      const centerY = containerHeight * 0.5;
      
      // Calculate base position based on which region this slot came from
      const baseRegion = Math.floor(position * Math.pow(2, round - 1) / bracketSize);
      let baseX, baseY;
      
      switch (baseRegion) {
        case 0: // WEST
          baseX = containerWidth * 0.2;
          baseY = containerHeight * 0.4;
          break;
        case 1: // SOUTH
          baseX = containerWidth * 0.8;
          baseY = containerHeight * 0.4;
          break;
        case 2: // EAST
          baseX = containerWidth * 0.2;
          baseY = containerHeight * 0.6;
          break;
        case 3: // MIDWEST
          baseX = containerWidth * 0.8;
          baseY = containerHeight * 0.6;
          break;
        default:
          baseX = centerX;
          baseY = centerY;
      }
      
      // Interpolate between base position and center
      return {
        x: baseX + (centerX - baseX) * progress,
        y: baseY + (centerY - baseY) * progress
      };
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
          <p className="text-xl text-gray-600">Create our own tournament bracket!</p>
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

            {/* Reset Button */}
            <div className="flex flex-col justify-center">
              <button
                onClick={resetBracket}
                className="w-full py-3 rounded-lg text-lg font-bold text-gray-600 hover:bg-gray-100 transition-colors border-2 border-gray-200"
              >
                <RotateCcw className="inline-block h-4 w-4 mr-2" />
                Reset Bracket
              </button>
            </div>
          </div>
        </div>

        {/* Bracket Display - Full Screen */}
        <div className={`bg-white rounded-xl shadow-lg border border-gray-200 ${getResponsiveSizing().containerHeight} relative overflow-hidden`}>
          {bracketSlots.length === 0 ? (
            <div className="absolute inset-0 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <Users className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Select a tournament size to get started!</p>
              </div>
            </div>
          ) : (
            renderBracket()
          )}
        </div>

        {/* Winner Display - Dead Center */}
        {winner && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/95 backdrop-blur-sm z-10">
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