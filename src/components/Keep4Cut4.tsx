'use client';

import { useState } from 'react';
import { Heart, Sparkles, X } from 'lucide-react';

interface Choice {
  id: number;
  name: string;
  selected: boolean;
}

export default function Keep4Cut4() {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [newChoice, setNewChoice] = useState('');
  const [gameComplete, setGameComplete] = useState(false);
  const [selectedCount, setSelectedCount] = useState(0);

  const addChoice = () => {
    if (newChoice.trim() && choices.length < 8) {
      const choice: Choice = {
        id: Date.now(),
        name: newChoice.trim(),
        selected: false
      };
      setChoices([...choices, choice]);
      setNewChoice('');
    }
  };

  const removeChoice = (id: number) => {
    setChoices(choices.filter(c => c.id !== id));
  };

  const toggleChoice = (id: number) => {
    const updatedChoices = choices.map(choice => {
      if (choice.id === id) {
        const newSelected = !choice.selected;
        if (newSelected && selectedCount >= 4) {
          return choice; // Don't allow more than 4 selections
        }
        return { ...choice, selected: newSelected };
      }
      return choice;
    });

    const newSelectedCount = updatedChoices.filter(c => c.selected).length;
    setSelectedCount(newSelectedCount);
    setChoices(updatedChoices);

    // Check if game is complete
    if (newSelectedCount === 4) {
      setGameComplete(true);
    } else {
      setGameComplete(false);
    }
  };

  const resetGame = () => {
    setChoices([]);
    setNewChoice('');
    setGameComplete(false);
    setSelectedCount(0);
  };

  const getFinal4 = () => {
    return choices.filter(choice => choice.selected);
  };

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Heart className="inline-block h-8 w-8 text-gray-700 mr-3" />
            Keep 4 / Cut 4
          </h2>
          <p className="text-xl text-gray-600">Choose your top 4 from 8 options!</p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Input Panel */}
          <div className="space-y-6">
            {/* Add Choices */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Add Choices ({choices.length}/8)
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newChoice}
                  onChange={(e) => setNewChoice(e.target.value)}
                  placeholder="Choice name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addChoice()}
                  disabled={choices.length >= 8}
                />
                <button
                  onClick={addChoice}
                  disabled={choices.length >= 8}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300"
                >
                  Add
                </button>
              </div>

              {/* Choices List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {choices.map((choice) => (
                  <div key={choice.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <span className="font-medium">{choice.name}</span>
                      {choice.selected && (
                        <Heart className="h-4 w-4 text-gray-700" />
                      )}
                    </div>
                    <button
                      onClick={() => removeChoice(choice.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Progress */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-4 text-gray-800">Progress</h3>
                <div className="text-2xl font-bold text-gray-700 mb-2">
                  {selectedCount}/4 Selected
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2 mb-4">
                  <div 
                    className="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${(selectedCount / 4) * 100}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-600">
                  {selectedCount < 4 ? `Select ${4 - selectedCount} more` : 'All selected!'}
                </p>
              </div>
            </div>

            {/* Reset Button */}
            {choices.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <button
                  onClick={resetGame}
                  className="w-full py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors"
                >
                  Reset Game
                </button>
              </div>
            )}
          </div>

          {/* Game Grid */}
          <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
            {choices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Heart className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Add 8 choices to start the game!</p>
              </div>
            ) : (
              <div>
                <h3 className="text-lg font-semibold mb-4 text-gray-800 text-center">
                  {gameComplete ? 'Your Final 4!' : 'Select Your Top 4'}
                </h3>
                
                {gameComplete ? (
                  <div className="text-center">
                    <Sparkles className="h-12 w-12 text-gray-700 mx-auto mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                      {getFinal4().map((choice) => (
                        <div
                          key={choice.id}
                          className="p-4 bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl border-2 border-gray-200"
                        >
                          <div className="font-bold text-gray-700">{choice.name}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    {choices.map((choice) => (
                      <button
                        key={choice.id}
                        onClick={() => toggleChoice(choice.id)}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          choice.selected
                            ? 'border-gray-400 bg-gray-50'
                            : 'border-gray-200 bg-white hover:border-gray-300'
                        }`}
                      >
                        <div className="font-medium text-gray-700">{choice.name}</div>
                      </button>
                    ))}
                  </div>
                )}

                {/* Instructions */}
                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-700 mb-2">How to play:</h4>
                  <p className="text-sm text-gray-600">
                    Click on 4 choices you want to keep. The other 4 will be eliminated. 
                    Choose wisely!
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
} 