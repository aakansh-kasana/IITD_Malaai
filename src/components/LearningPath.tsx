import React from 'react';
import { motion } from 'framer-motion';
import { Book, Clock, Trophy, Lock, CheckCircle, Play } from 'lucide-react';
import { Module, User } from '../types';
import { modules } from '../data/modules';

interface LearningPathProps {
  user: User;
  onModuleSelect: (module: Module) => void;
}

export const LearningPath: React.FC<LearningPathProps> = ({ user, onModuleSelect }) => {
  const isModuleAvailable = (module: Module): boolean => {
    if (!module.prerequisite) return true;
    return user.completedModules.includes(module.prerequisite);
  };

  const isModuleCompleted = (moduleId: string): boolean => {
    return user.completedModules.includes(moduleId);
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'green';
      case 'intermediate': return 'yellow';
      case 'advanced': return 'red';
      default: return 'gray';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">Learning Path</h1>
          <p className="text-base sm:text-xl text-gray-600 max-w-2xl mx-auto">
            Master the art of debate through our structured learning modules. 
            Progress from basics to advanced techniques at your own pace.
          </p>
        </div>

        {/* Progress Overview */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-4 sm:p-8 mb-8 sm:mb-12 text-white"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h2 className="text-xl sm:text-2xl font-bold mb-2">Your Progress</h2>
              <p className="text-blue-100 text-sm sm:text-base">
                {user.completedModules.length} of {modules.length} modules completed
              </p>
            </div>
            <div className="text-center sm:text-right">
              <div className="text-2xl sm:text-3xl font-bold">
                {Math.round((user.completedModules.length / modules.length) * 100)}%
              </div>
              <div className="text-blue-100 text-sm">Complete</div>
            </div>
          </div>
          <div className="mt-4">
            <div className="w-full bg-white/20 rounded-full h-2 sm:h-3">
              <div 
                className="bg-white h-2 sm:h-3 rounded-full transition-all duration-300"
                style={{ width: `${(user.completedModules.length / modules.length) * 100}%` }}
              />
            </div>
          </div>
        </motion.div>

        {/* Modules Grid */}
        <div className="space-y-4 sm:space-y-8">
          {modules.map((module, index) => {
            const isAvailable = isModuleAvailable(module);
            const isCompleted = isModuleCompleted(module.id);
            const difficultyColor = getDifficultyColor(module.difficulty);

            return (
              <motion.div
                key={module.id}
                initial={{ opacity: 0, x: index % 2 === 0 ? -20 : 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`relative bg-white rounded-xl shadow-lg border-2 overflow-hidden ${
                  isCompleted 
                    ? 'border-green-300 bg-green-50' 
                    : isAvailable 
                      ? 'border-blue-300 hover:border-blue-400' 
                      : 'border-gray-200 bg-gray-50'
                } transition-all duration-200`}
              >
                {/* Module Content */}
                <div className="p-4 sm:p-8">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1 mb-4 lg:mb-0">
                      <div className="flex items-start mb-4">
                        <div className={`p-2 sm:p-3 rounded-lg mr-3 sm:mr-4 flex-shrink-0 ${
                          isCompleted 
                            ? 'bg-green-100' 
                            : isAvailable 
                              ? 'bg-blue-100' 
                              : 'bg-gray-100'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                          ) : isAvailable ? (
                            <Book className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                          ) : (
                            <Lock className="h-5 w-5 sm:h-6 sm:w-6 text-gray-400" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className={`text-xl sm:text-2xl font-bold mb-2 ${
                            isAvailable ? 'text-gray-900' : 'text-gray-500'
                          }`}>
                            {module.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-2 sm:gap-4 mb-3">
                            <span className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium bg-${difficultyColor}-100 text-${difficultyColor}-800`}>
                              {module.difficulty}
                            </span>
                            <div className="flex items-center text-gray-600">
                              <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="text-xs sm:text-sm">{module.estimatedTime} min</span>
                            </div>
                            <div className="flex items-center text-gray-600">
                              <Trophy className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                              <span className="text-xs sm:text-sm">{module.xpReward} XP</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <p className={`text-sm sm:text-lg mb-4 sm:mb-6 ${
                        isAvailable ? 'text-gray-700' : 'text-gray-500'
                      }`}>
                        {module.description}
                      </p>

                      {module.prerequisite && (
                        <div className="mb-4">
                          <span className="text-xs sm:text-sm text-gray-600">
                            Prerequisite: {modules.find(m => m.id === module.prerequisite)?.title}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-stretch lg:items-end space-y-3 lg:ml-4">
                      {isCompleted && (
                        <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-xs sm:text-sm font-medium text-center">
                          Completed ✓
                        </div>
                      )}
                      
                      <button
                        onClick={() => isAvailable && onModuleSelect(module)}
                        disabled={!isAvailable}
                        className={`flex items-center justify-center px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-all text-sm sm:text-base ${
                          isCompleted
                            ? 'bg-green-600 hover:bg-green-700 text-white'
                            : isAvailable
                            ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        {isCompleted ? (
                          <>Review Module</>
                        ) : isAvailable ? (
                          <>
                            <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Start Module
                          </>
                        ) : (
                          <>
                            <Lock className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            Locked
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Progress indicator for available modules */}
                {isAvailable && !isCompleted && (
                  <div className="absolute bottom-0 left-0 right-0 h-1 bg-blue-600"></div>
                )}
              </motion.div>
            );
          })}
        </div>

        {/* Next Steps */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mt-8 sm:mt-12 bg-gradient-to-r from-purple-600 to-pink-600 rounded-2xl p-4 sm:p-8 text-white text-center"
        >
          <h2 className="text-xl sm:text-2xl font-bold mb-4">Keep Learning!</h2>
          <p className="text-purple-100 mb-4 sm:mb-6 text-sm sm:text-base">
            Complete all modules to unlock advanced practice debates and become a debate master!
          </p>
          <div className="flex justify-center space-x-4">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{user.completedModules.length}</div>
              <div className="text-purple-100 text-xs sm:text-sm">Completed</div>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg p-3 sm:p-4">
              <div className="text-xl sm:text-2xl font-bold">{modules.length - user.completedModules.length}</div>
              <div className="text-purple-100 text-xs sm:text-sm">Remaining</div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};