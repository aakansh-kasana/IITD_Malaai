import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  MessageCircle, 
  Send, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX, 
  Trophy, 
  Target, 
  Clock,
  ArrowLeft,
  Zap,
  Brain,
  AlertCircle,
  CheckCircle,
  Plus,
  Shuffle
} from 'lucide-react';
import { DebateMessage, Feedback } from '../types';
import { geminiService } from '../services/geminiService';

interface PracticeDebateProps {
  onComplete: (xpGained: number) => void;
  onBack: () => void;
}

const predefinedTopics = [
  "Social media does more harm than good",
  "School uniforms should be mandatory",
  "Homework should be banned in elementary schools",
  "Video games cause violence in teenagers",
  "Climate change is the most pressing issue of our time",
  "Artificial intelligence will replace most human jobs",
  "Online learning is better than traditional classroom education",
  "Standardized testing should be eliminated",
  "The voting age should be lowered to 16",
  "Fast food restaurants should be banned near schools"
];

export const PracticeDebate: React.FC<PracticeDebateProps> = ({ onComplete, onBack }) => {
  // Topic selection state
  const [showTopicSelection, setShowTopicSelection] = useState(true);
  const [selectedTopic, setSelectedTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [useCustomTopic, setUseCustomTopic] = useState(false);
  
  // Debate state
  const [userSide, setUserSide] = useState<'pro' | 'con' | null>(null);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [round, setRound] = useState(1);
  const [score, setScore] = useState(0);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [debateEnded, setDebateEnded] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  
  // Audio state
  const [isRecording, setIsRecording] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  
  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setUseCustomTopic(false);
    setCustomTopic('');
  };

  const handleCustomTopicSubmit = () => {
    if (customTopic.trim()) {
      setSelectedTopic(customTopic.trim());
      setUseCustomTopic(true);
    }
  };

  const startDebate = (side: 'pro' | 'con') => {
    if (!selectedTopic) return;
    
    setUserSide(side);
    setShowTopicSelection(false);
    setRound(1);
    setMessages([]);
    setConversationHistory([]);
    setScore(0);
    setError(null);
    
    // Add initial system message
    const systemMessage: DebateMessage = {
      id: 'system-start',
      speaker: 'ai',
      content: `Welcome to the debate! The topic is: "${selectedTopic}". You are arguing ${side === 'pro' ? 'FOR' : 'AGAINST'} this statement. I'll be taking the ${side === 'pro' ? 'AGAINST' : 'FOR'} position. Please present your opening argument.`,
      timestamp: new Date()
    };
    
    setMessages([systemMessage]);
    setConversationHistory([systemMessage.content]);
  };

  const sendMessage = async () => {
    if (!currentMessage.trim() || isAiTyping || !userSide) return;

    const userMessage: DebateMessage = {
      id: `user-${Date.now()}`,
      speaker: 'user',
      content: currentMessage.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setConversationHistory(prev => [...prev, `Human: ${currentMessage.trim()}`]);
    setCurrentMessage('');
    setIsAiTyping(true);
    setError(null);

    try {
      // Get AI feedback for user's argument
      const userFeedback = await geminiService.analyzeFeedback(
        currentMessage.trim(),
        selectedTopic,
        userSide,
        round
      );

      // Generate AI response
      const aiSide = userSide === 'pro' ? 'con' : 'pro';
      const aiResponse = await geminiService.generateDebateResponse(
        selectedTopic,
        currentMessage.trim(),
        aiSide,
        round,
        conversationHistory
      );

      const aiMessage: DebateMessage = {
        id: `ai-${Date.now()}`,
        speaker: 'ai',
        content: aiResponse,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, { ...userMessage, feedback: userFeedback }, aiMessage]);
      setConversationHistory(prev => [...prev, `AI: ${aiResponse}`]);
      setFeedback(userFeedback);
      setScore(prev => prev + userFeedback.score);
      setShowFeedback(true);

      // Check if debate should end
      if (round >= 3) {
        setTimeout(() => {
          endDebate();
        }, 3000);
      } else {
        setRound(prev => prev + 1);
      }

    } catch (error) {
      console.error('Error in debate:', error);
      setError(error instanceof Error ? error.message : 'An error occurred during the debate');
    } finally {
      setIsAiTyping(false);
    }
  };

  const endDebate = () => {
    setDebateEnded(true);
    const finalScore = Math.round(score / round);
    const xpGained = Math.max(50, finalScore);
    
    setTimeout(() => {
      onComplete(xpGained);
    }, 2000);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const resetDebate = () => {
    setShowTopicSelection(true);
    setSelectedTopic('');
    setCustomTopic('');
    setUseCustomTopic(false);
    setUserSide(null);
    setMessages([]);
    setCurrentMessage('');
    setRound(1);
    setScore(0);
    setFeedback(null);
    setShowFeedback(false);
    setDebateEnded(false);
    setConversationHistory([]);
    setError(null);
  };

  // Topic Selection Screen
  if (showTopicSelection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Back to Dashboard
            </button>
            <div className="flex items-center space-x-2">
              <Brain className="h-6 w-6 text-purple-600" />
              <h1 className="text-2xl font-bold text-gray-900">Practice Debate</h1>
            </div>
          </div>

          <div className="bg-white rounded-2xl shadow-xl p-8">
            <div className="text-center mb-8">
              <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-4 rounded-2xl w-20 h-20 mx-auto mb-4">
                <MessageCircle className="h-12 w-12 text-white" />
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-2">Choose Your Debate Topic</h2>
              <p className="text-gray-600 text-lg">
                Select from our curated topics or create your own custom debate topic
              </p>
            </div>

            {/* Custom Topic Input */}
            <div className="mb-8 p-6 bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl border border-blue-200">
              <div className="flex items-center mb-4">
                <Plus className="h-5 w-5 text-blue-600 mr-2" />
                <h3 className="text-lg font-semibold text-gray-900">Create Your Own Topic</h3>
              </div>
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={customTopic}
                  onChange={(e) => setCustomTopic(e.target.value)}
                  placeholder="Type your custom debate topic here..."
                  className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  onKeyPress={(e) => e.key === 'Enter' && handleCustomTopicSubmit()}
                />
                <button
                  onClick={handleCustomTopicSubmit}
                  disabled={!customTopic.trim()}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Use This Topic
                </button>
              </div>
              {useCustomTopic && selectedTopic && (
                <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-center">
                    <CheckCircle className="h-5 w-5 text-green-600 mr-2" />
                    <span className="text-green-800 font-medium">✓ Custom topic ready: "{selectedTopic}"</span>
                  </div>
                </div>
              )}
            </div>

            {/* Predefined Topics */}
            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Or Choose from Popular Topics</h3>
                <button
                  onClick={() => {
                    const randomTopic = predefinedTopics[Math.floor(Math.random() * predefinedTopics.length)];
                    handleTopicSelect(randomTopic);
                  }}
                  className="flex items-center text-blue-600 hover:text-blue-700 font-medium"
                >
                  <Shuffle className="h-4 w-4 mr-1" />
                  Random Topic
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {predefinedTopics.map((topic, index) => (
                  <motion.button
                    key={index}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleTopicSelect(topic)}
                    className={`p-4 text-left rounded-xl border-2 transition-all ${
                      selectedTopic === topic && !useCustomTopic
                        ? 'border-blue-500 bg-blue-50 text-blue-900'
                        : 'border-gray-200 hover:border-blue-300 hover:bg-blue-50'
                    }`}
                  >
                    <div className="font-medium text-gray-900">{topic}</div>
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Side Selection */}
            {selectedTopic && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="border-t border-gray-200 pt-8"
              >
                <h3 className="text-lg font-semibold text-gray-900 mb-4 text-center">
                  Choose Your Position on: "{selectedTopic}"
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startDebate('pro')}
                    className="bg-gradient-to-r from-green-500 to-green-600 text-white p-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
                  >
                    <div className="text-center">
                      <CheckCircle className="h-8 w-8 mx-auto mb-3" />
                      <div className="text-xl font-bold mb-2">Argue FOR</div>
                      <div className="text-green-100">Support this statement</div>
                    </div>
                  </motion.button>
                  
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => startDebate('con')}
                    className="bg-gradient-to-r from-red-500 to-red-600 text-white p-6 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                  >
                    <div className="text-center">
                      <Target className="h-8 w-8 mx-auto mb-3" />
                      <div className="text-xl font-bold mb-2">Argue AGAINST</div>
                      <div className="text-red-100">Oppose this statement</div>
                    </div>
                  </motion.button>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Debate Completion Screen
  if (debateEnded) {
    const finalScore = Math.round(score / round);
    const xpGained = Math.max(50, finalScore);

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4"
      >
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-2xl w-full text-center">
          <Trophy className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Debate Complete!</h2>
          <p className="text-gray-600 mb-6">Great job on completing the debate on "{selectedTopic}"</p>
          
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{finalScore}</div>
              <div className="text-sm text-gray-600">Average Score</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">+{xpGained}</div>
              <div className="text-sm text-gray-600">XP Gained</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{round}</div>
              <div className="text-sm text-gray-600">Rounds</div>
            </div>
          </div>

          <div className="flex space-x-4">
            <button
              onClick={resetDebate}
              className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Debate Again
            </button>
            <button
              onClick={onBack}
              className="flex-1 bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Main Debate Interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
      {/* Header */}
      <div className="bg-white shadow-lg border-b border-gray-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={onBack}
              className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
            >
              <ArrowLeft className="h-5 w-5 mr-2" />
              Exit Debate
            </button>
            <div className="border-l border-gray-300 pl-4">
              <h1 className="text-lg font-bold text-gray-900 truncate max-w-md">
                {selectedTopic}
              </h1>
              <p className="text-sm text-gray-600">
                You are arguing {userSide === 'pro' ? 'FOR' : 'AGAINST'} • Round {round}/3
              </p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="text-center">
              <div className="text-lg font-bold text-blue-600">{Math.round(score / round) || 0}</div>
              <div className="text-xs text-gray-600">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-purple-600">{round}</div>
              <div className="text-xs text-gray-600">Round</div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-hidden flex flex-col max-w-6xl mx-auto w-full">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${message.speaker === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-3xl ${message.speaker === 'user' ? 'order-2' : 'order-1'}`}>
                <div
                  className={`p-4 rounded-2xl ${
                    message.speaker === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white border border-gray-200 text-gray-900'
                  }`}
                >
                  <div className="flex items-start space-x-3">
                    <div className="flex-1">
                      <div className={`text-sm font-medium mb-2 ${
                        message.speaker === 'user' ? 'text-blue-100' : 'text-gray-600'
                      }`}>
                        {message.speaker === 'user' ? 'You' : 'AI Opponent'}
                      </div>
                      <div className="text-base leading-relaxed whitespace-pre-wrap">
                        {message.content}
                      </div>
                    </div>
                  </div>
                </div>
                
                {/* Feedback Display */}
                {message.feedback && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="mt-3 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl border border-green-200"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold text-gray-900 flex items-center">
                        <Zap className="h-4 w-4 mr-2 text-blue-600" />
                        AI Feedback
                      </h4>
                      <div className="bg-blue-600 text-white px-3 py-1 rounded-full text-sm font-bold">
                        {message.feedback.score}/100
                      </div>
                    </div>
                    
                    {message.feedback.strengths.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-green-800 mb-1">Strengths:</h5>
                        <ul className="text-sm text-green-700 space-y-1">
                          {message.feedback.strengths.map((strength, index) => (
                            <li key={index} className="flex items-start">
                              <CheckCircle className="h-3 w-3 mr-2 mt-0.5 text-green-600 flex-shrink-0" />
                              {strength}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {message.feedback.improvements.length > 0 && (
                      <div className="mb-3">
                        <h5 className="font-medium text-blue-800 mb-1">Areas for Improvement:</h5>
                        <ul className="text-sm text-blue-700 space-y-1">
                          {message.feedback.improvements.map((improvement, index) => (
                            <li key={index} className="flex items-start">
                              <Target className="h-3 w-3 mr-2 mt-0.5 text-blue-600 flex-shrink-0" />
                              {improvement}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {message.feedback.fallaciesDetected.length > 0 && (
                      <div>
                        <h5 className="font-medium text-red-800 mb-1">Logical Fallacies Detected:</h5>
                        <ul className="text-sm text-red-700 space-y-1">
                          {message.feedback.fallaciesDetected.map((fallacy, index) => (
                            <li key={index} className="flex items-start">
                              <AlertCircle className="h-3 w-3 mr-2 mt-0.5 text-red-600 flex-shrink-0" />
                              {fallacy}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </motion.div>
                )}
              </div>
            </motion.div>
          ))}
          
          {/* AI Typing Indicator */}
          {isAiTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-white border border-gray-200 p-4 rounded-2xl">
                <div className="flex items-center space-x-2">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  </div>
                  <span className="text-gray-600 text-sm">AI is thinking...</span>
                </div>
              </div>
            </motion.div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Error Display */}
        {error && (
          <div className="mx-4 mb-4 p-4 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-center">
              <AlertCircle className="h-5 w-5 text-red-600 mr-2" />
              <span className="text-red-800">{error}</span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="border-t border-gray-200 bg-white p-4">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-end space-x-4">
              <div className="flex-1">
                <div className="relative">
                  <input
                    ref={inputRef}
                    type="text"
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder={`Present your ${userSide === 'pro' ? 'supporting' : 'opposing'} argument...`}
                    disabled={isAiTyping || debateEnded}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                    <button
                      onClick={() => setIsRecording(!isRecording)}
                      disabled={isAiTyping}
                      className={`p-1.5 rounded-full transition-colors ${
                        isRecording
                          ? 'bg-red-100 text-red-600 hover:bg-red-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      } disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </div>
              
              <button
                onClick={sendMessage}
                disabled={!currentMessage.trim() || isAiTyping || debateEnded}
                className="bg-blue-600 text-white p-3 rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            
            <div className="flex items-center justify-between mt-3 text-sm text-gray-600">
              <div className="flex items-center space-x-4">
                <span>Round {round} of 3</span>
                <span>•</span>
                <span>Current score: {Math.round(score / round) || 0}/100</span>
              </div>
              
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => setAudioEnabled(!audioEnabled)}
                  className={`p-1 rounded transition-colors ${
                    audioEnabled ? 'text-blue-600' : 'text-gray-400'
                  }`}
                >
                  {audioEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                </button>
                <span className="text-xs">Press Enter to send</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};