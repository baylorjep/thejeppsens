'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { Grid, Heart, X, RotateCcw, Sparkles } from 'lucide-react';

interface Choice {
  id: number;
  name: string;
  selected: boolean;
  eliminated: boolean;
}

export default function Keep4Cut4() {
  const [choices, setChoices] = useState<Choice[]>([]);
  const [newChoice, setNewChoice] = useState('');
  const [gameComplete, setGameComplete] = useState(false);
  const [showFinal4, setShowFinal4] = useState(false);

  const addChoice = () => {
    if (newChoice.trim() && choices.length < 8) {
      const choice: Choice = {
        id: Date.now(),
        name: newChoice.trim(),
        selected: false,
        eliminated: false
      };
      setChoices([...choices, choice]);
      setNewChoice('');
    }
  };

  const removeChoice = (id: number) => {
    setChoices(choices.filter(choice => choice.id !== id));
  };

  const toggleChoice = (id: number) => {
    if (gameComplete) return;

    const updatedChoices = choices.map(choice => {
      if (choice.id === id) {
        return { ...choice, selected: !choice.selected };
      }
      return choice;
    });

    setChoices(updatedChoices);

    // Check if 4 are selected
    const selectedCount = updatedChoices.filter(c => c.selected).length;
    if (selectedCount === 4) {
      // Eliminate the unselected ones
      const finalChoices = updatedChoices.map(choice => ({
        ...choice,
        eliminated: !choice.selected
      }));
      setChoices(finalChoices);
      setGameComplete(true);
      setShowFinal4(true);
    }
  };

  const resetGame = () => {
    setChoices([]);
    setGameComplete(false);
    setShowFinal4(false);
  };

  const selectedCount = choices.filter(c => c.selected).length;

  return (
    <section className="py-20 bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-bold text-gray-800 mb-4">
            <Grid className="inline-block h-8 w-8 text-gray-700 mr-3" />
            Keep 4 / Cut 4
          </h2>
          <p className="text-xl text-gray-600">Choose your top 4 from 8 options!</p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Setup Panel */}
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="space-y-6"
          >
            {/* Add Choices */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">
                Add Your Options ({choices.length}/8)
              </h3>
              <div className="flex gap-2 mb-4">
                <input
                  type="text"
                  value={newChoice}
                  onChange={(e) => setNewChoice(e.target.value)}
                  placeholder="Option name..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && addChoice()}
                  disabled={choices.length >= 8 || gameComplete}
                />
                <button
                  onClick={addChoice}
                  disabled={choices.length >= 8 || gameComplete}
                  className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-800 transition-colors disabled:bg-gray-300"
                >
                  Add
                </button>
              </div>
              
              {/* Choices List */}
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {choices.map((choice) => (
                  <div key={choice.id} className="flex items-center justify-between p-2 bg-gray-50 rounded-lg">
                    <span className="font-medium">{choice.name}</span>
                    <button
                      onClick={() => removeChoice(choice.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      disabled={gameComplete}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Game Status */}
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Game Status</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Selected:</span>
                  <span className="font-bold text-gray-700">{selectedCount}/4</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <motion.div
                    className="bg-gradient-to-r from-gray-700 to-gray-800 h-2 rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${(selectedCount / 4) * 100}%` }}
                    transition={{ duration: 0.5 }}
                  />
                </div>
                {gameComplete && (
                  <div className="text-center py-2 bg-green-50 rounded-lg border border-green-200">
                    <span className="text-green-700 font-medium">Game Complete!</span>
                  </div>
                )}
              </div>
            </div>

            {/* Reset Button */}
            {choices.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-200">
                <button
                  onClick={resetGame}
                  className="w-full py-3 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors flex items-center justify-center gap-2"
                >
                  <RotateCcw className="h-5 w-5" />
                  Reset Game
                </button>
              </div>
            )}
          </motion.div>

          {/* Game Grid */}
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            className="bg-white rounded-xl p-6 shadow-lg border border-gray-200"
          >
            {choices.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Grid className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                <p>Add 8 options to start the game!</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Game Grid */}
                <div className="grid grid-cols-2 gap-4">
                  {choices.map((choice) => (
                    <motion.div
                      key={choice.id}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ 
                        opacity: choice.eliminated ? 0.3 : 1, 
                        scale: choice.eliminated ? 0.9 : 1 
                      }}
                      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all ${
                        choice.eliminated
                          ? 'border-gray-200 bg-gray-50'
                          :                         choice.selected
                        ? 'border-gray-400 bg-gray-50'
                        : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                      }`}
                      onClick={() => toggleChoice(choice.id)}
                    >
                      <div className="text-center">
                        <span className={`font-medium ${
                          choice.eliminated ? 'text-gray-400' : 'text-gray-800'
                        }`}>
                          {choice.name}
                        </span>
                      </div>
                      
                      {/* Selection Indicator */}
                      {choice.selected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <Heart className="h-6 w-6 text-gray-700 fill-current" />
                        </motion.div>
                      )}
                      
                      {/* Elimination Indicator */}
                      {choice.eliminated && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-2 right-2"
                        >
                          <X className="h-6 w-6 text-red-500" />
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>

                {/* Final 4 Display */}
                <AnimatePresence>
                  {showFinal4 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-xl p-6 border-2 border-gray-200"
                    >
                      <div className="text-center mb-4">
                        <Sparkles className="h-8 w-8 text-gray-700 mx-auto mb-2" />
                        <h3 className="text-xl font-bold text-gray-800">Your Final 4!</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-3">
                        {choices.filter(c => !c.eliminated).map((choice, index) => (
                          <motion.div
                            key={choice.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-white rounded-lg p-3 border border-gray-200 text-center"
                          >
                                                          <span className="font-medium text-gray-700">{choice.name}</span>
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Instructions */}
                {!gameComplete && choices.length === 8 && (
                                  <div className="text-center py-4 bg-gray-50 rounded-lg border border-gray-200">
                  <p className="text-gray-700">
                      Click on 4 options to keep them. The rest will be eliminated!
                    </p>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
} 