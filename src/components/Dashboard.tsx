import React from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, Award, Clock, Target, Book, Zap } from 'lucide-react';
import { User } from '../types';

interface DashboardProps {
  user: User;
  onNavigate: (view: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ user, onNavigate }) => {
  const stats = [
    {
      label: 'Current Level',
      value: user.level,
      icon: TrendingUp,
      color: 'blue',
      change: '+2 this week'
    },
    {
      label: 'Total XP',
      value: user.xp,
      icon: Zap,
      color: 'purple',
      change: '+150 this week'
    },
    {
      label: 'Achievements',
      value: user.achievements.length,
      icon: Award,
      color: 'green',
      change: '+1 this week'
    },
    {
      label: 'Streak',
      value: `${user.currentStreak} days`,
      icon: Target,
      color: 'orange',
      change: 'Keep it up!'
    }
  ];

  const recentAchievements = user.achievements.slice(-3);
  const nextLevel = user.level + 1;
  const xpToNext = (nextLevel * 200) - user.xp;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Welcome Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 rounded-2xl p-4 sm:p-8 mb-6 sm:mb-8 text-white"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div className="mb-4 sm:mb-0">
              <h1 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, {user.name}! 🎉</h1>
              <p className="text-blue-100 text-base sm:text-lg">
                You're only {xpToNext} XP away from Level {nextLevel}!
              </p>
            </div>
            <div className="sm:hidden md:block">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4">
                <div className="text-xl sm:text-2xl font-bold">{user.currentStreak}</div>
                <div className="text-blue-100 text-sm">Day Streak</div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-lg p-3 sm:p-6 border border-gray-100 hover:shadow-xl transition-shadow"
            >
              <div className="flex items-center justify-between mb-2 sm:mb-4">
                <div className={`p-2 sm:p-3 rounded-lg bg-${stat.color}-100`}>
                  <stat.icon className={`h-4 w-4 sm:h-6 sm:w-6 text-${stat.color}-600`} />
                </div>
                <div className="text-right">
                  <div className="text-lg sm:text-2xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-xs sm:text-sm text-gray-600">{stat.label}</div>
                </div>
              </div>
              <div className={`text-xs sm:text-sm text-${stat.color}-600 font-medium`}>
                {stat.change}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-8 mb-6 sm:mb-8">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100"
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Book className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
              Continue Learning
            </h2>
            <div className="space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-blue-50 rounded-lg">
                <div className="mb-3 sm:mb-0">
                  <div className="font-medium text-gray-900 text-sm sm:text-base">Logical Fallacies</div>
                  <div className="text-xs sm:text-sm text-gray-600">Next: Advanced Techniques</div>
                </div>
                <button
                  onClick={() => onNavigate('learn')}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                  Continue
                </button>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100"
          >
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4 flex items-center">
              <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-purple-600" />
              Practice Debate
            </h2>
            <div className="space-y-3">
              <div className="p-3 sm:p-4 bg-purple-50 rounded-lg">
                <div className="font-medium text-gray-900 mb-2 text-sm sm:text-base">AI Debate Challenge</div>
                <div className="text-xs sm:text-sm text-gray-600 mb-3">
                  Ready for a practice debate? Test your skills against our AI opponent!
                </div>
                <button
                  onClick={() => onNavigate('practice')}
                  className="bg-purple-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors text-sm sm:text-base w-full sm:w-auto"
                >
                  Start Debate
                </button>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-4 sm:p-6 border border-gray-100"
        >
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900 flex items-center mb-2 sm:mb-0">
              <Award className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-yellow-500" />
              Recent Achievements
            </h2>
            <button
              onClick={() => onNavigate('achievements')}
              className="text-blue-600 hover:text-blue-700 font-medium text-sm sm:text-base"
            >
              View All
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {recentAchievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 sm:p-4 rounded-lg border-2 ${
                  achievement.rarity === 'legendary' ? 'border-yellow-300 bg-yellow-50' :
                  achievement.rarity === 'epic' ? 'border-purple-300 bg-purple-50' :
                  achievement.rarity === 'rare' ? 'border-blue-300 bg-blue-50' :
                  'border-gray-300 bg-gray-50'
                }`}
              >
                <div className="text-xl sm:text-2xl mb-2">{achievement.icon}</div>
                <div className="font-bold text-gray-900 text-sm sm:text-base">{achievement.title}</div>
                <div className="text-xs sm:text-sm text-gray-600">{achievement.description}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
};