import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Clock, Trophy, Target, AlertCircle, Zap, Key, ArrowLeft } from 'lucide-react';
import { DebateMessage, Feedback } from '../types';
import { geminiService } from '../services/geminiService';

interface PracticeDebateProps {
  onComplete: (xpGained: number) => void;
  onBack: () => void;
}

export const PracticeDebate: React.FC<PracticeDebateProps> = ({ onComplete, onBack }) => {
  const [topic, setTopic] = useState('');
  const [userSide, setUserSide] = useState<'pro' | 'con'>('pro');
  const [debateStarted, setDebateStarted] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 minutes
  const [argumentCount, setArgumentCount] = useState(0);
  const [userTurn, setUserTurn] = useState(true);
  const [debateEnded, setDebateEnded] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<Feedback | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const topics = [
    'School uniforms should be mandatory',
    'Social media does more harm than good',
    'Homework should be banned',
    'Video games cause violence',
    'Remote learning is better than in-person education',
    'Artificial intelligence will replace human jobs',
    'Climate change is the most pressing global issue',
    'Nuclear energy is safer than renewable energy',
    'Standardized testing should be eliminated',
    'Universal basic income should be implemented'
  ];

  useEffect(() => {
    // Check if Gemini is configured
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
    setAiConfigured(!!apiKey);
    
    // Reinitialize service if API key was added
    if (apiKey) {
      geminiService.reinitialize();
    }
  }, []);

  useEffect(() => {
    // Scroll to bottom when new messages are added, but maintain container position
    if (messages.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      // Use requestAnimationFrame to ensure DOM is updated
      requestAnimationFrame(() => {
        container.scrollTop = container.scrollHeight;
      });
    }
  }, [messages.length]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (debateStarted && !debateEnded && timeRemaining > 0) {
      timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
    } else if (timeRemaining === 0 && debateStarted) {
      endDebate();
    }
    return () => clearTimeout(timer);
  }, [timeRemaining, debateStarted, debateEnded]);

  const startDebate = () => {
    if (!topic) return;
    
    if (!aiConfigured) {
      setApiError('Gemini API key required for AI debate responses. Please add your API key first.');
      return;
    }
    
    console.log('Starting unlimited debate with topic:', topic, 'User side:', userSide);
    setDebateStarted(true);
    setMessages([]);
    setArgumentCount(0);
    setUserTurn(userSide === 'pro');
    setApiError(null);
    
    // AI opens if user chose con
    if (userSide === 'con') {
      setTimeout(() => {
        generateAIResponse("", 1, []);
      }, 1000);
    }
  };

  const generateAIResponse = async (userArgument: string, currentArgument: number, history: string[]) => {
    console.log('Generating AI response...', { 
      topic, 
      userArgument, 
      argumentCount: currentArgument,
      history: history.length,
      aiSide: userSide === 'pro' ? 'con' : 'pro'
    });
    
    setIsAiThinking(true);
    setApiError(null);
    
    try {
      const aiSide = userSide === 'pro' ? 'con' : 'pro';
      const response = await geminiService.generateDebateResponse(
        topic,
        userArgument,
        aiSide,
        currentArgument,
        history
      );
      
      console.log('AI response received:', response);
      
      // Generate feedback for AI's response (simulated high score)
      const aiFeedback: Feedback = {
        score: Math.floor(Math.random() * 10) + 90, // AI scores 90-100
        strengths: ['Well-structured argument', 'Strong evidence', 'Clear reasoning'],
        improvements: ['Could expand on examples'],
        fallaciesDetected: [],
        suggestions: ['Continue with strong rebuttals']
      };
      
      const aiMessage: DebateMessage = {
        id: Date.now().toString(),
        speaker: 'ai',
        content: response,
        timestamp: new Date(),
        feedback: aiFeedback
      };
      
      setMessages(prev => [...prev, aiMessage]);
      setUserTurn(true);
      
    } catch (error: any) {
      console.error('Error generating AI response:', error);
      setApiError(error.message || 'Failed to generate AI response');
      setUserTurn(true);
      
      // Add error message to chat
      const errorMessage: DebateMessage = {
        id: Date.now().toString(),
        speaker: 'ai',
        content: `⚠️ AI Response Error: ${error.message || 'Unable to generate response'}`,
        timestamp: new Date(),
        feedback: {
          score: 0,
          strengths: [],
          improvements: [],
          fallaciesDetected: [],
          suggestions: ['Please check your Gemini API key and try again']
        }
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsAiThinking(false);
    }
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || !userTurn) return;

    console.log('Sending user message:', currentMessage, 'Topic:', topic);
    setUserTurn(false);
    setApiError(null);
    
    const newArgumentCount = argumentCount + 1;
    setArgumentCount(newArgumentCount);
    
    try {
      // Analyze user's argument with AI
      const feedback = await geminiService.analyzeFeedback(
        currentMessage,
        topic,
        userSide,
        newArgumentCount
      );

      const userMessage: DebateMessage = {
        id: Date.now().toString(),
        speaker: 'user',
        content: currentMessage,
        timestamp: new Date(),
        feedback
      };

      setMessages(prev => {
        const newMessages = [...prev, userMessage];
        console.log('Updated messages:', newMessages.length);
        return newMessages;
      });
      
      const messageHistory = [...messages.map(m => `${m.speaker}: ${m.content}`), `user: ${currentMessage}`];
      const currentUserMessage = currentMessage;
      setCurrentMessage('');

      // Generate AI response after a short delay
      setTimeout(() => {
        generateAIResponse(currentUserMessage, newArgumentCount, messageHistory);
      }, 1500);
    } catch (error: any) {
      console.error('Error analyzing user message:', error);
      setApiError(error.message || 'Failed to analyze your message');
      
      // Still add user message but with error feedback
      const userMessage: DebateMessage = {
        id: Date.now().toString(),
        speaker: 'user',
        content: currentMessage,
        timestamp: new Date(),
        feedback: {
          score: 0,
          strengths: [],
          improvements: [],
          fallaciesDetected: [],
          suggestions: ['Unable to analyze - please check your Gemini API key']
        }
      };

      setMessages(prev => [...prev, userMessage]);
      setCurrentMessage('');
      setUserTurn(true);
    }
  };

  const endDebate = async () => {
    console.log('Ending debate...');
    setDebateEnded(true);
    setUserTurn(false);
    
    // Calculate final feedback based on all user messages
    const userMessages = messages.filter(m => m.speaker === 'user');
    const avgScore = userMessages.length > 0 
      ? Math.round(userMessages.reduce((sum, m) => sum + (m.feedback?.score || 0), 0) / userMessages.length)
      : 75;
    
    const allStrengths = userMessages.flatMap(m => m.feedback?.strengths || []);
    const allImprovements = userMessages.flatMap(m => m.feedback?.improvements || []);
    const allFallacies = userMessages.flatMap(m => m.feedback?.fallaciesDetected || []);
    const allSuggestions = userMessages.flatMap(m => m.feedback?.suggestions || []);
    
    const feedback: Feedback = {
      score: avgScore,
      strengths: [...new Set(allStrengths)].slice(0, 3),
      improvements: [...new Set(allImprovements)].slice(0, 3),
      fallaciesDetected: [...new Set(allFallacies)],
      suggestions: [...new Set(allSuggestions)].slice(0, 3)
    };
    
    setFinalFeedback(feedback);
    
    // Award XP based on performance and number of arguments
    const baseXP = Math.floor(avgScore * 2.5); // 150-250 XP range
    const argumentBonus = Math.min(userMessages.length * 10, 100); // Up to 100 bonus XP for more arguments
    const totalXP = baseXP + argumentBonus;
    
    setTimeout(() => onComplete(totalXP), 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Reset function to restart the debate
  const resetDebate = () => {
    setDebateStarted(false);
    setDebateEnded(false);
    setMessages([]);
    setCurrentMessage('');
    setTimeRemaining(300);
    setArgumentCount(0);
    setUserTurn(true);
    setFinalFeedback(null);
    setIsAiThinking(false);
    setApiError(null);
    setTopic('');
    setUserSide('pro');
  };

  if (debateEnded && finalFeedback) {
    const userMessages = messages.filter(m => m.speaker === 'user');
    const argumentBonus = Math.min(userMessages.length * 10, 100);
    const baseXP = Math.floor(finalFeedback.score * 2.5);
    const totalXP = baseXP + argumentBonus;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-4xl mx-auto"
        >
          <div className="bg-white rounded-2xl shadow-xl p-4 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <Trophy className="h-12 w-12 sm:h-16 sm:w-16 text-yellow-500 mx-auto mb-4" />
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">Debate Complete!</h2>
              <p className="text-gray-600 mb-2 text-sm sm:text-base">Topic: "{topic}"</p>
              <p className="text-gray-500 text-sm">Here's your comprehensive performance analysis</p>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
              <div className="bg-blue-50 p-3 sm:p-6 rounded-lg text-center">
                <div className="text-2xl sm:text-3xl font-bold text-blue-600">{finalFeedback.score}</div>
                <div className="text-blue-800 text-xs sm:text-sm">Overall Score</div>
              </div>
              <div className="bg-green-50 p-3 sm:p-6 rounded-lg text-center">
                <div className="text-2xl sm:text-3xl font-bold text-green-600">{userMessages.length}</div>
                <div className="text-green-800 text-xs sm:text-sm">Arguments Made</div>
              </div>
              <div className="bg-purple-50 p-3 sm:p-6 rounded-lg text-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">+{argumentBonus}</div>
                <div className="text-purple-800 text-xs sm:text-sm">Argument Bonus XP</div>
              </div>
              <div className="bg-yellow-50 p-3 sm:p-6 rounded-lg text-center">
                <div className="text-2xl sm:text-3xl font-bold text-yellow-600">+{totalXP}</div>
                <div className="text-yellow-800 text-xs sm:text-sm">Total XP Earned</div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-green-800 mb-3 flex items-center">
                  <Trophy className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Strengths
                </h3>
                <ul className="space-y-2">
                  {finalFeedback.strengths.map((strength, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-green-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm sm:text-base">{strength}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div>
                <h3 className="text-base sm:text-lg font-semibold text-blue-800 mb-3 flex items-center">
                  <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Areas for Improvement
                </h3>
                <ul className="space-y-2">
                  {finalFeedback.improvements.map((improvement, index) => (
                    <li key={index} className="flex items-start">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                      <span className="text-gray-700 text-sm sm:text-base">{improvement}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {finalFeedback.fallaciesDetected.length > 0 && (
              <div className="mb-6 sm:mb-8 p-4 sm:p-6 bg-red-50 rounded-lg border border-red-200">
                <h3 className="text-base sm:text-lg font-semibold text-red-800 mb-4 flex items-center">
                  <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                  Logical Fallacies Detected
                </h3>
                <div className="space-y-3">
                  {finalFeedback.fallaciesDetected.map((fallacy, index) => (
                    <div key={index} className="bg-white p-3 rounded-lg border border-red-100">
                      <div className="text-red-800 font-medium text-sm sm:text-base mb-1">
                        • {fallacy}
                      </div>
                      <div className="text-red-600 text-xs sm:text-sm">
                        {fallacy.toLowerCase().includes('non sequitur') && 
                          "A conclusion that doesn't logically follow from the premises"
                        }
                        {fallacy.toLowerCase().includes('ad hominem') && 
                          "Attacking the person making the argument rather than the argument itself"
                        }
                        {fallacy.toLowerCase().includes('straw man') && 
                          "Misrepresenting someone's argument to make it easier to attack"
                        }
                        {fallacy.toLowerCase().includes('false dilemma') && 
                          "Presenting only two options when more alternatives exist"
                        }
                        {fallacy.toLowerCase().includes('slippery slope') && 
                          "Assuming one event will lead to a chain of negative consequences"
                        }
                        {!fallacy.toLowerCase().includes('non sequitur') && 
                         !fallacy.toLowerCase().includes('ad hominem') && 
                         !fallacy.toLowerCase().includes('straw man') && 
                         !fallacy.toLowerCase().includes('false dilemma') && 
                         !fallacy.toLowerCase().includes('slippery slope') && 
                          "A logical error that weakens the argument"
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-purple-800 mb-3 flex items-center">
                <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                Suggestions for Next Time
              </h3>
              <ul className="space-y-2">
                {finalFeedback.suggestions.map((suggestion, index) => (
                  <li key={index} className="flex items-start">
                    <div className="w-2 h-2 bg-purple-500 rounded-full mt-2 mr-3 flex-shrink-0" />
                    <span className="text-gray-700 text-sm sm:text-base">{suggestion}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg mb-6 sm:mb-8">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">🎯 Performance Breakdown</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Base Score XP:</span>
                  <span className="font-semibold text-blue-600 ml-2">+{baseXP}</span>
                </div>
                <div>
                  <span className="text-gray-600">Argument Bonus:</span>
                  <span className="font-semibold text-purple-600 ml-2">+{argumentBonus} ({userMessages.length} arguments)</span>
                </div>
              </div>
              <div className="mt-2 text-xs sm:text-sm text-gray-600">
                💡 Make more arguments within the time limit to earn bonus XP!
              </div>
            </div>

            <div className="text-center space-y-3">
              <button
                onClick={resetDebate}
                className="bg-blue-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-blue-700 transition-colors text-sm sm:text-base mr-4"
              >
                Practice Again
              </button>
              <button
                onClick={onBack}
                className="bg-gray-600 text-white px-6 sm:px-8 py-3 rounded-lg hover:bg-gray-700 transition-colors text-sm sm:text-base"
              >
                Back to Practice Menu
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!debateStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Back Button */}
          <div className="mb-6">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Practice
            </button>
          </div>

          <div className="bg-white rounded-xl shadow-lg p-4 sm:p-8">
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">🚀 Unlimited AI Debate Challenge</h1>
              <p className="text-gray-600 mb-4 text-sm sm:text-base">
                Make as many arguments as you can in 5 minutes! Each argument earns bonus XP.
              </p>
              
              {!aiConfigured && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="text-red-800 font-medium text-sm sm:text-base">Gemini API Key Required</p>
                      <p className="text-red-700 text-xs sm:text-sm">
                        Real-time AI responses require a valid Gemini API key. Please add your API key using the "Setup AI" button in the header.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {aiConfigured && (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <Zap className="h-5 w-5 text-green-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="text-green-800 font-medium text-sm sm:text-base">🤖 Real-Time AI Enabled</p>
                      <p className="text-green-700 text-xs sm:text-sm">
                        Live Gemini AI responses and real-time feedback analysis are ready!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {apiError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                  <div className="flex items-start">
                    <AlertCircle className="h-5 w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <div className="text-left">
                      <p className="text-red-800 font-medium text-sm sm:text-base">API Error</p>
                      <p className="text-red-700 text-xs sm:text-sm">{apiError}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="max-w-2xl mx-auto space-y-6">
              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-900 mb-4">
                  Choose a debate topic:
                </label>
                <div className="space-y-2 sm:space-y-3 max-h-64 overflow-y-auto">
                  {topics.map((topicOption) => (
                    <button
                      key={topicOption}
                      onClick={() => setTopic(topicOption)}
                      className={`w-full p-3 sm:p-4 text-left rounded-lg border-2 transition-all text-sm sm:text-base ${
                        topic === topicOption
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                      }`}
                    >
                      {topicOption}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-900 mb-4">
                  Choose your position:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setUserSide('pro')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      userSide === 'pro'
                        ? 'border-green-500 bg-green-50'
                        : 'border-gray-200 hover:border-green-300'
                    }`}
                  >
                    <div className="text-base sm:text-lg font-semibold text-green-700">FOR (Pro)</div>
                    <div className="text-xs sm:text-sm text-gray-600">You support the statement</div>
                  </button>
                  <button
                    onClick={() => setUserSide('con')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      userSide === 'con'
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:border-red-300'
                    }`}
                  >
                    <div className="text-base sm:text-lg font-semibold text-red-700">AGAINST (Con)</div>
                    <div className="text-xs sm:text-sm text-gray-600">You oppose the statement</div>
                  </button>
                </div>
              </div>

              <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-lg">
                <h3 className="font-medium text-gray-900 mb-3 text-sm sm:text-base">🚀 Unlimited Debate Features:</h3>
                <ul className="text-xs sm:text-sm text-gray-600 space-y-2">
                  <li>• 🤖 <strong>Live Gemini AI responses</strong> to every argument you make</li>
                  <li>• 🔍 <strong>Real-time argument analysis</strong> and scoring for each message</li>
                  <li>• 📊 <strong>Instant feedback</strong> on strengths and improvements</li>
                  <li>• 🚨 <strong>Live logical fallacy detection</strong> as you debate</li>
                  <li>• ⏱️ <strong>5-minute time limit</strong> with unlimited arguments</li>
                  <li>• 🎯 <strong>Bonus XP</strong> for each argument you make (+10 XP per argument)</li>
                  <li>• 🏆 <strong>Performance scoring</strong> based on quality and quantity</li>
                </ul>
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <p className="text-xs sm:text-sm text-yellow-800">
                    <strong>💡 Pro Tip:</strong> Make as many quality arguments as possible! You earn +10 bonus XP for each argument, up to +100 XP total.
                  </p>
                </div>
              </div>

              <button
                onClick={startDebate}
                disabled={!topic || !aiConfigured}
                className="w-full bg-blue-600 text-white py-3 sm:py-4 rounded-lg font-semibold hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center text-sm sm:text-base"
              >
                {!aiConfigured ? (
                  <>
                    <Key className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Add API Key to Start
                  </>
                ) : (
                  <>
                    <Zap className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Start Unlimited AI Debate
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-4">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6">
          {/* Debate Interface */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-blue-600 to-purple-600 p-3 sm:p-6 text-white">
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base sm:text-xl font-bold truncate">{topic}</h2>
                    <p className="text-blue-100 text-xs sm:text-sm">You are arguing {userSide === 'pro' ? 'FOR' : 'AGAINST'}</p>
                    <div className="flex items-center mt-1 sm:mt-2">
                      <Zap className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="text-xs sm:text-sm text-blue-100">Real-Time Gemini AI</span>
                    </div>
                  </div>
                  <div className="flex flex-col items-end space-y-1 sm:space-y-2">
                    <div className="flex items-center">
                      <Clock className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                      <span className="font-mono text-sm sm:text-lg">{formatTime(timeRemaining)}</span>
                    </div>
                    <div className="bg-white/20 px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm">
                      {argumentCount} arguments
                    </div>
                  </div>
                </div>
              </div>

              {/* API Error Display */}
              {apiError && (
                <div className="bg-red-50 border-b border-red-200 p-3 sm:p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-red-800 text-xs sm:text-sm">{apiError}</span>
                  </div>
                </div>
              )}

              {/* Messages Container - Fixed height to prevent movement */}
              <div className="h-64 sm:h-96 flex flex-col">
                <div 
                  ref={messagesContainerRef}
                  className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-3 sm:space-y-4"
                  style={{ scrollBehavior: 'smooth' }}
                >
                  <AnimatePresence>
                    {messages.map((message) => (
                      <motion.div
                        key={message.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl p-3 sm:p-4 rounded-lg ${
                          message.speaker === 'user'
                            ? 'bg-blue-600 text-white'
                            : message.content.includes('⚠️')
                            ? 'bg-red-100 text-red-900 border border-red-200'
                            : 'bg-gray-100 text-gray-900'
                        }`}>
                          <div className="flex items-center mb-2">
                            {message.speaker === 'user' ? (
                              <User className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            ) : (
                              <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            )}
                            <span className="text-xs sm:text-sm font-medium">
                              {message.speaker === 'user' ? 'You' : 'Gemini AI'}
                            </span>
                          </div>
                          <p className="text-xs sm:text-sm">{message.content}</p>
                          {message.feedback && message.feedback.score > 0 && (
                            <div className="mt-2 text-xs opacity-75">
                              Score: {message.feedback.score}/100
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                    
                    {isAiThinking && (
                      <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className="bg-gray-100 text-gray-900 p-3 sm:p-4 rounded-lg">
                          <div className="flex items-center mb-2">
                            <Bot className="h-3 w-3 sm:h-4 sm:w-4 mr-2" />
                            <span className="text-xs sm:text-sm font-medium">Gemini AI</span>
                          </div>
                          <div className="flex items-center">
                            <div className="animate-pulse flex space-x-1">
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
                            </div>
                            <span className="text-xs text-gray-500 ml-2">Generating real-time response...</span>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  {/* Invisible scroll anchor */}
                  <div ref={messagesEndRef} />
                </div>
              </div>

              {/* Input */}
              <div className="border-t border-gray-200 p-3 sm:p-4">
                <div className="flex space-x-2 sm:space-x-3">
                  <textarea
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    placeholder={userTurn ? "Type your argument..." : isAiThinking ? "AI is generating response..." : "Waiting for AI response..."}
                    disabled={!userTurn}
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 text-sm sm:text-base resize-none"
                    rows={2}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        sendMessage();
                      }
                    }}
                  />
                  <button
                    onClick={sendMessage}
                    disabled={!userTurn || !currentMessage.trim()}
                    className="bg-blue-600 text-white p-2 sm:p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4 sm:space-y-6">
            {/* Live Feedback */}
            <div className="bg-white rounded-xl shadow-lg p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <Target className="h-4 w-4 sm:h-5 sm:w-5 mr-2 text-blue-600" />
                Live AI Feedback
              </h3>
              {messages.length > 0 && messages[messages.length - 1].speaker === 'user' && messages[messages.length - 1].feedback && (
                <div className="space-y-3">
                  <div className="text-center">
                    <div className="text-xl sm:text-2xl font-bold text-blue-600">
                      {messages[messages.length - 1].feedback!.score}
                    </div>
                    <div className="text-xs sm:text-sm text-gray-600">Latest Score</div>
                  </div>
                  
                  {messages[messages.length - 1].feedback!.strengths.length > 0 && (
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-green-700 mb-1">Strengths:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {messages[messages.length - 1].feedback!.strengths.map((strength, index) => (
                          <li key={index}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  
                  {messages[messages.length - 1].feedback!.fallaciesDetected.length > 0 && (
                    <div>
                      <div className="text-xs sm:text-sm font-medium text-red-700 mb-1">Fallacies Detected:</div>
                      <ul className="text-xs text-gray-600 space-y-1">
                        {messages[messages.length - 1].feedback!.fallaciesDetected.map((fallacy, index) => (
                          <li key={index}>• {fallacy}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Argument Counter */}
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">📊 Argument Tracker</h3>
              <div className="space-y-3">
                <div className="text-center">
                  <div className="text-2xl sm:text-3xl font-bold text-purple-600">{argumentCount}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Arguments Made</div>
                </div>
                <div className="text-center">
                  <div className="text-xl sm:text-2xl font-bold text-green-600">+{Math.min(argumentCount * 10, 100)}</div>
                  <div className="text-xs sm:text-sm text-gray-600">Bonus XP</div>
                </div>
                <div className="text-xs text-gray-500 text-center">
                  Max bonus: +100 XP (10 arguments)
                </div>
              </div>
            </div>

            {/* AI Status */}
            <div className={`rounded-xl p-4 ${aiConfigured ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center mb-2">
                <Zap className={`h-4 w-4 sm:h-5 sm:w-5 mr-2 ${aiConfigured ? 'text-green-600' : 'text-red-600'}`} />
                <h3 className={`font-medium text-sm sm:text-base ${aiConfigured ? 'text-green-800' : 'text-red-800'}`}>
                  {aiConfigured ? '🤖 Real-Time AI Active' : '⚠️ API Key Required'}
                </h3>
              </div>
              <p className={`text-xs ${aiConfigured ? 'text-green-700' : 'text-red-700'}`}>
                {aiConfigured 
                  ? 'Live Gemini AI responses and real-time feedback analysis enabled'
                  : 'Add your Gemini API key to enable real-time AI responses'
                }
              </p>
            </div>

            {/* Tips */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-4 sm:p-6">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-4">💡 Unlimited Debate Tips</h3>
              <ul className="text-xs sm:text-sm text-gray-700 space-y-2">
                <li>• Make multiple arguments quickly</li>
                <li>• Each argument earns +10 bonus XP</li>
                <li>• Quality over quantity still matters</li>
                <li>• Use specific examples and evidence</li>
                <li>• Address AI counterarguments directly</li>
                <li>• Stay focused on the topic</li>
                <li>• Avoid logical fallacies</li>
              </ul>
            </div>

            {/* Back Button (Mobile) */}
            <div className="lg:hidden">
              <button
                onClick={onBack}
                className="w-full bg-gray-600 text-white py-3 rounded-lg hover:bg-gray-700 transition-colors flex items-center justify-center text-sm"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Practice
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};