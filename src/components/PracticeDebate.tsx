import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Clock, Trophy, Target, AlertCircle, Zap, Key, ArrowLeft, Mic, Volume2 } from 'lucide-react';
import { DebateMessage, Feedback } from '../types';
import { geminiService } from '../services/geminiService';
import Waveform from './Waveform';

interface PracticeDebateProps {
  onComplete: (xpGained: number) => void;
  onBack: () => void;
}

type DebateFormat = 'text-speech' | 'direct-speech';

// Add debounce utility
function debounce<T extends (...args: any[]) => void>(fn: T, delay: number) {
  let timer: any;
  return (...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), delay);
  };
}

export const PracticeDebate: React.FC<PracticeDebateProps> = ({ onComplete, onBack }) => {
  const [topic, setTopic] = useState('');
  const [userSide, setUserSide] = useState<'pro' | 'con'>('pro');
  const [debateStarted, setDebateStarted] = useState(false);
  const [messages, setMessages] = useState<DebateMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(300);
  const [argumentCount, setArgumentCount] = useState(0);
  const [userTurn, setUserTurn] = useState(true);
  const [debateEnded, setDebateEnded] = useState(false);
  const [finalFeedback, setFinalFeedback] = useState<Feedback | null>(null);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [aiConfigured, setAiConfigured] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);
  const [speakingId, setSpeakingId] = useState<string | null>(null);
  const synthRef = useRef<SpeechSynthesis | null>(null);
  const [speechLang] = useState('en-IN');
  const [debateFormat, setDebateFormat] = useState<DebateFormat>('text-speech');
  const [directSpeechTurn, setDirectSpeechTurn] = useState<'user' | 'ai'>('user');
  const [showFirstInstruction, setShowFirstInstruction] = useState(true);
  const [isDirectRecording, setIsDirectRecording] = useState(false);
  const directRecognitionRef = useRef<any>(null);
  const [aiSpeech, setAiSpeech] = useState<string>('');
  const [aiSpeaking, setAiSpeaking] = useState(false);
  const [aiSpeechSpeed, setAiSpeechSpeed] = useState(1);
  const [aiSpeechUtter, setAiSpeechUtter] = useState<SpeechSynthesisUtterance | null>(null);

  const DEFAULT_TOPICS = [
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
  const [suggestedTopics, setSuggestedTopics] = useState<string[]>(DEFAULT_TOPICS);
  const [topicInput, setTopicInput] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [fetchingTopics, setFetchingTopics] = useState(false);
  const [topicValidation, setTopicValidation] = useState<{valid: boolean, reason: string} | null>(null);
  const [validatingTopic, setValidatingTopic] = useState(false);
  const [fetchingCompletions, setFetchingCompletions] = useState(false);
  const [rephrasedSuggestions, setRephrasedSuggestions] = useState<string[]>([]);
  const [fetchingRephrased, setFetchingRephrased] = useState(false);

  // Debounced Gemini validation
  const debouncedValidate = useRef(
    debounce(async (input: string) => {
      setValidatingTopic(true);
      try {
        const result = await geminiService.validateDebateTopic(input);
        setTopicValidation(result);
      } catch (e: any) {
        setTopicValidation({ valid: false, reason: e.message || 'Validation failed' });
      } finally {
        setValidatingTopic(false);
      }
    }, 400)
  ).current;

  // Debounced Gemini completions
  const debouncedCompletions = useRef(
    debounce(async (input: string) => {
      if (!aiConfigured || input.length < 4) return;
      setFetchingCompletions(true);
      try {
        const completions = await geminiService.suggestDebateCompletions(input);
        // Merge, dedupe, and filter
        const merged = Array.from(new Set([
          ...completions,
          ...suggestedTopics,
          ...DEFAULT_TOPICS
        ])).filter(t =>
          t.toLowerCase().includes(input.toLowerCase()) && t.toLowerCase() !== input.toLowerCase()
        ).slice(0, 10);
        setSuggestedTopics(merged);
      } catch {
        // fallback: keep current suggestions
      } finally {
        setFetchingCompletions(false);
      }
    }, 400)
  ).current;

  // On topic input change
  useEffect(() => {
    if (topicInput.length > 3) {
      debouncedValidate(topicInput);
      debouncedCompletions(topicInput);
    } else {
      setTopicValidation(null);
      setSuggestedTopics(DEFAULT_TOPICS);
    }
    setTopic(topicInput);
  }, [topicInput]);

  // Show suggestions when input is focused
  const handleInputFocus = () => {
    setShowSuggestions(true);
    fetchTopics();
  };

  // Filter suggestions as user types (already filtered in completions, but keep for fallback)
  const filteredSuggestions = suggestedTopics.filter(t =>
    t.toLowerCase().includes(topicInput.toLowerCase()) && t.toLowerCase() !== topicInput.toLowerCase()
  ).slice(0, 10);

  // Only allow starting debate if Gemini says topic is valid
  const canStartDebate = topicValidation && topicValidation.valid;

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
    setAiConfigured(!!apiKey);
    if (apiKey) {
      geminiService.reinitialize();
    }
  }, []);

  useEffect(() => {
    if (messages.length > 0 && messagesContainerRef.current) {
      const container = messagesContainerRef.current;
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

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.onerror = null;
        recognitionRef.current.onresult = null;
        recognitionRef.current.stop();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (synthRef.current) {
        synthRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    return () => {
      if (directRecognitionRef.current) {
        directRecognitionRef.current.onend = null;
        directRecognitionRef.current.onerror = null;
        directRecognitionRef.current.onresult = null;
        directRecognitionRef.current.stop();
      }
      window.speechSynthesis.cancel();
    };
  }, []);

  const startDebate = () => {
    if (!topic) return;
    if (!aiConfigured) {
      setApiError('Gemini API key required for AI debate responses. Please add your API key first.');
      return;
    }
    setDebateStarted(true);
    setMessages([]);
    setArgumentCount(0);
    setUserTurn(userSide === 'pro');
    setApiError(null);
    if (userSide === 'con') {
      setTimeout(() => {
        generateAIResponse("", 1, []);
      }, 1000);
    }
  };

  const generateAIResponse = async (userArgument: string, currentArgument: number, history: string[]) => {
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
      const aiFeedback: Feedback = {
        score: Math.floor(Math.random() * 10) + 90,
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
      setApiError(error.message || 'Failed to generate AI response');
      setUserTurn(true);
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
    setUserTurn(false);
    setApiError(null);
    const newArgumentCount = argumentCount + 1;
    setArgumentCount(newArgumentCount);
    try {
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
        return newMessages;
      });
      const messageHistory = [...messages.map(m => `${m.speaker}: ${m.content}`), `user: ${currentMessage}`];
      const currentUserMessage = currentMessage;
      setCurrentMessage('');
      setTimeout(() => {
        generateAIResponse(currentUserMessage, newArgumentCount, messageHistory);
      }, 1500);
    } catch (error: any) {
      setApiError(error.message || 'Failed to analyze your message');
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
    setDebateEnded(true);
    setUserTurn(false);
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
    const baseXP = Math.floor(avgScore * 2.5);
    const argumentBonus = Math.min(userMessages.length * 10, 100);
    const totalXP = baseXP + argumentBonus;
    setTimeout(() => onComplete(totalXP), 3000);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

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

  const handleMicClick = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const startRecording = () => {
    setRecordingError(null);
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      setRecordingError('Speech recognition is not supported in this browser.');
      return;
    }
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setCurrentMessage((prev) => prev ? prev + ' ' + transcript : transcript);
    };
    recognition.onerror = (event: any) => {
      setRecordingError('Speech recognition error: ' + event.error);
      setIsRecording(false);
    };
    recognition.onend = () => {
      setIsRecording(false);
    };
    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsRecording(false);
  };

  const handleSpeak = (messageId: string, text: string) => {
    if (speakingId === messageId) {
      window.speechSynthesis.cancel();
      setSpeakingId(null);
      return;
    }
    if (window.speechSynthesis.speaking) {
      window.speechSynthesis.cancel();
    }
    setSpeakingId(messageId);
    const utter = new window.SpeechSynthesisUtterance(text);
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(v => v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN'));
    if (preferredVoices.length > 0) {
      utter.voice = preferredVoices[0];
    }
    utter.onend = () => setSpeakingId(null);
    utter.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(utter);
  };

  const handleDirectMicClick = () => {
    if (isDirectRecording) {
      stopDirectRecording();
    } else {
      startDirectRecording();
    }
  };

  const startDirectRecording = () => {
    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }
    setIsDirectRecording(true);
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.lang = speechLang;
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;
    recognition.onresult = async (event: any) => {
      const transcript = event.results[0][0].transcript;
      setIsDirectRecording(false);
      setShowFirstInstruction(false);
      setDirectSpeechTurn('ai');
      const aiResponse = await geminiService.generateDebateResponse(
        topic,
        transcript,
        userSide === 'pro' ? 'con' : 'pro',
        argumentCount + 1,
        []
      );
      setAiSpeech(aiResponse);
      setArgumentCount((prev) => prev + 1);
      playAiSpeech(aiResponse, aiSpeechSpeed);
    };
    recognition.onerror = (event: any) => {
      setIsDirectRecording(false);
      alert('Speech recognition error: ' + event.error);
    };
    recognition.onend = () => {
      setIsDirectRecording(false);
    };
    directRecognitionRef.current = recognition;
    recognition.start();
  };

  const stopDirectRecording = () => {
    if (directRecognitionRef.current) {
      directRecognitionRef.current.stop();
    }
    setIsDirectRecording(false);
  };

  const playAiSpeech = (text: string, speed: number) => {
    window.speechSynthesis.cancel();
    setAiSpeaking(true);
    const utter = new window.SpeechSynthesisUtterance(text);
    utter.rate = speed;
    const voices = window.speechSynthesis.getVoices();
    const preferredVoices = voices.filter(v => v.lang.startsWith('en-IN') || v.lang.startsWith('hi-IN'));
    if (preferredVoices.length > 0) {
      utter.voice = preferredVoices[0];
    }
    utter.onend = () => {
      setAiSpeaking(false);
      setDirectSpeechTurn('user');
      setAiSpeechUtter(null);
    };
    utter.onerror = () => {
      setAiSpeaking(false);
      setDirectSpeechTurn('user');
      setAiSpeechUtter(null);
    };
    setAiSpeechUtter(utter);
    window.speechSynthesis.speak(utter);
  };

  const handleAiSpeedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newSpeed = parseFloat(e.target.value);
    setAiSpeechSpeed(newSpeed);
    if (aiSpeaking && aiSpeechUtter) {
      window.speechSynthesis.cancel();
      playAiSpeech(aiSpeech, newSpeed);
    }
  };

  const handleAiReplay = () => {
    if (aiSpeech) {
      playAiSpeech(aiSpeech, aiSpeechSpeed);
    }
  };

  // Fetch topics from Gemini when selector opens
  const fetchTopics = async () => {
    if (!aiConfigured) {
      setSuggestedTopics(DEFAULT_TOPICS);
      return;
    }
    setFetchingTopics(true);
    try {
      const aiTopics = await geminiService.suggestDebateTopics();
      const merged = Array.from(new Set([...aiTopics, ...DEFAULT_TOPICS]));
      setSuggestedTopics(merged);
    } catch (e) {
      setSuggestedTopics(DEFAULT_TOPICS);
    } finally {
      setFetchingTopics(false);
    }
  };

  // Fetch rephrased suggestions when topic is invalid
  useEffect(() => {
    if (topicValidation && !topicValidation.valid && topicInput.length > 3) {
      setFetchingRephrased(true);
      geminiService.getRephrasedDebateTopics(topicInput)
        .then(suggestions => setRephrasedSuggestions(suggestions))
        .catch(() => setRephrasedSuggestions([]))
        .finally(() => setFetchingRephrased(false));
    } else {
      setRephrasedSuggestions([]);
      setFetchingRephrased(false);
    }
  }, [topicValidation, topicInput]);

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
                <div className="relative">
                  <input
                    type="text"
                    className="w-full p-3 sm:p-4 rounded-lg border-2 text-sm sm:text-base focus:outline-none focus:border-blue-500"
                    placeholder="Type or select a topic..."
                    value={topicInput}
                    onChange={e => {
                      setTopicInput(e.target.value);
                      setShowSuggestions(true);
                    }}
                    onFocus={handleInputFocus}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  />
                  {(fetchingTopics || fetchingCompletions) && (
                    <div className="absolute right-3 top-3 text-blue-400 animate-spin">⏳</div>
                  )}
                  {showSuggestions && filteredSuggestions.length > 0 && (
                    <div className="absolute z-10 w-full bg-white border border-gray-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-y-auto">
                      {filteredSuggestions.map((s, idx) => (
                        <button
                          key={s + idx}
                          type="button"
                          className="block w-full text-left px-4 py-2 hover:bg-blue-50 text-sm sm:text-base"
                          onMouseDown={() => {
                            setTopicInput(s);
                            setShowSuggestions(false);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                {validatingTopic && (
                  <div className="text-blue-500 text-xs mt-2">Checking topic validity...</div>
                )}
                {topicValidation && (
                  <div className={
                    topicValidation.valid
                      ? 'text-green-600 text-xs mt-2'
                      : 'text-red-500 text-xs mt-2'
                  }>
                    {topicValidation.valid ? '✓ Valid debate topic!' : `✗ ${topicValidation.reason}`}
                  </div>
                )}
                {/* Show rephrased suggestions if topic is invalid */}
                {(!topicValidation?.valid && rephrasedSuggestions.length > 0) && (
                  <div className="mt-2">
                    <div className="text-xs text-gray-600 mb-1">Try one of these instead:</div>
                    <div className="flex flex-col gap-1">
                      {rephrasedSuggestions.map((s, idx) => (
                        <button
                          key={s + idx}
                          type="button"
                          className="text-left px-3 py-2 rounded bg-gray-100 hover:bg-blue-50 border border-gray-200 text-sm"
                          onClick={() => {
                            setTopicInput(s);
                            setShowSuggestions(false);
                          }}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                {fetchingRephrased && !topicValidation?.valid && (
                  <div className="text-blue-400 text-xs mt-2 flex items-center gap-1"><span className="animate-spin">⏳</span> Getting better topic suggestions...</div>
                )}
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

              <div>
                <label className="block text-base sm:text-lg font-medium text-gray-900 mb-4">
                  Choose debate format:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <button
                    onClick={() => setDebateFormat('text-speech')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      debateFormat === 'text-speech'
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-blue-300'
                    }`}
                  >
                    <div className="text-base sm:text-lg font-semibold text-blue-700">Text + Speech</div>
                    <div className="text-xs sm:text-sm text-gray-600">Type or speak your arguments</div>
                  </button>
                  <button
                    onClick={() => setDebateFormat('direct-speech')}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      debateFormat === 'direct-speech'
                        ? 'border-purple-500 bg-purple-50'
                        : 'border-gray-200 hover:border-purple-300'
                    }`}
                  >
                    <div className="text-base sm:text-lg font-semibold text-purple-700">Direct Speech</div>
                    <div className="text-xs sm:text-sm text-gray-600">Voice-only debate</div>
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
                disabled={!topic || !aiConfigured || !canStartDebate}
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

  if (debateFormat === 'direct-speech') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-2 sm:p-4 flex flex-col items-center">
        <div className="max-w-4xl w-full mx-auto flex flex-col lg:flex-row gap-6">
          <div className="flex-1 bg-white rounded-xl shadow-lg p-6 flex flex-col items-center justify-center">
            <h2 className="text-xl sm:text-2xl font-bold text-purple-700 mb-6">Direct Speech Debate</h2>
            <button
              onClick={() => setDebateFormat('text-speech')}
              className="mb-6 px-6 py-2 rounded-lg bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors"
            >
              Switch to Text+Speech
            </button>
            {showFirstInstruction && (
              <div className="mb-4 text-gray-400 text-sm animate-fade-in">
                Press your mic button to speak every time
              </div>
            )}
            <div className="flex flex-row gap-12 items-center justify-center mt-4">
              <div className="flex flex-col items-center">
                <button
                  className={`rounded-full w-20 h-20 flex items-center justify-center border-4 transition-all text-2xl font-bold mb-2 ${directSpeechTurn === 'user' ? 'border-purple-500 bg-purple-100 animate-pulse' : 'border-gray-300 bg-gray-100'}`}
                  disabled={directSpeechTurn !== 'user' || isDirectRecording}
                  onClick={handleDirectMicClick}
                >
                  <Mic className={`h-10 w-10 ${directSpeechTurn === 'user' ? 'text-purple-700' : 'text-gray-400'}`} />
                </button>
                <div className={`mt-1 text-sm font-medium ${directSpeechTurn === 'user' ? 'text-purple-700' : 'text-gray-500'}`}>Your Turn</div>
                {directSpeechTurn === 'user' && isDirectRecording && (
                  <Waveform active={true} className="mt-2" />
                )}
              </div>
              <div className="flex flex-col items-center">
                <div className="relative">
                  <button
                    className={`rounded-full w-20 h-20 flex items-center justify-center border-4 transition-all text-2xl font-bold mb-2 ${directSpeechTurn === 'ai' ? 'border-blue-500 bg-blue-100 animate-pulse' : 'border-gray-300 bg-gray-100'}`}
                    disabled={directSpeechTurn !== 'ai'}
                    onClick={handleAiReplay}
                  >
                    <Mic className={`h-10 w-10 ${directSpeechTurn === 'ai' ? 'text-blue-700' : 'text-gray-400'}`} />
                  </button>
                </div>
                <div className={`mt-1 text-sm font-medium ${directSpeechTurn === 'ai' ? 'text-blue-700' : 'text-gray-500'}`}>AI</div>
                {directSpeechTurn === 'ai' && aiSpeaking && (
                  <Waveform active={true} className="mt-2" />
                )}
                {directSpeechTurn === 'ai' && aiSpeech && (
                  <div className="mt-2 flex items-center space-x-2">
                    <Volume2 className="h-4 w-4 text-blue-500" />
                    <select
                      className="border border-gray-300 rounded px-2 py-1 text-sm focus:outline-none"
                      value={aiSpeechSpeed}
                      onChange={handleAiSpeedChange}
                    >
                      {[0.5, 1, 1.5, 2, 2.5, 3, 3.5, 4].map((speed) => (
                        <option key={speed} value={speed}>{speed}x</option>
                      ))}
                    </select>
                    <button
                      className="ml-2 px-4 py-1 rounded bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors text-sm"
                      onClick={handleAiReplay}
                      disabled={directSpeechTurn !== 'ai'}
                    >
                      Replay
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="w-full lg:w-80 flex-shrink-0 space-y-4">
            <div className="bg-white rounded-xl shadow-lg p-4 flex items-center justify-between">
              <span className="font-semibold text-gray-700">Time Left</span>
              <span className="font-mono text-lg text-blue-600">{formatTime(timeRemaining)}</span>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-xl p-4">
              <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-2">XP & Feedback</h3>
              <div className="flex flex-col items-center">
                <div className="text-2xl sm:text-3xl font-bold text-purple-600">{argumentCount}</div>
                <div className="text-xs sm:text-sm text-gray-600 mb-2">Arguments Made</div>
                <div className="text-xl sm:text-2xl font-bold text-green-600">+{Math.min(argumentCount * 10, 100)}</div>
                <div className="text-xs sm:text-sm text-gray-600">Bonus XP</div>
              </div>
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
          <div className="lg:col-span-3">
            <div className="bg-white rounded-xl shadow-lg overflow-hidden">
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
                <div className="flex justify-center mt-4">
                  <button
                    onClick={() => setDebateFormat('direct-speech')}
                    className="mb-4 px-6 py-2 rounded-lg bg-purple-600 text-white font-semibold hover:bg-purple-700 transition-colors"
                  >
                    Switch to Direct Speech
                  </button>
                </div>
              </div>

              {apiError && (
                <div className="bg-red-50 border-b border-red-200 p-3 sm:p-4">
                  <div className="flex items-start">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-600 mr-2 flex-shrink-0 mt-0.5" />
                    <span className="text-red-800 text-xs sm:text-sm">{apiError}</span>
                  </div>
                </div>
              )}

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
                        <div className={`max-w-xs sm:max-w-md lg:max-w-lg xl:max-w-xl p-3 sm:p-4 rounded-lg relative flex flex-col ${
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
                            <button
                              type="button"
                              className={`ml-2 p-1 rounded-full border transition-colors flex-shrink-0 ${speakingId && speakingId !== message.id ? 'bg-gray-200 border-gray-300 text-gray-400 cursor-not-allowed' : 'bg-white border-gray-300 hover:bg-purple-50 text-purple-700'}`}
                              aria-label={speakingId === message.id ? 'Stop playback' : 'Play message'}
                              onClick={() => speakingId && speakingId !== message.id ? undefined : handleSpeak(message.id, message.content)}
                              disabled={!!speakingId && speakingId !== message.id}
                            >
                              <Volume2 className={`h-4 w-4 ${speakingId === message.id ? 'text-purple-600 animate-pulse' : ''}`} />
                            </button>
                            {speakingId === message.id && (
                              <Waveform active={true} className="ml-1" />
                            )}
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
                  <div ref={messagesEndRef} />
                </div>
              </div>

              <div className="border-t border-gray-200 p-3 sm:p-4">
                <div className="flex space-x-2 sm:space-x-3 items-center">
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
                    type="button"
                    onClick={handleMicClick}
                    disabled={!userTurn || isAiThinking}
                    className={`p-2 sm:p-3 rounded-lg border transition-colors flex-shrink-0 ${isRecording ? 'bg-purple-100 border-purple-400' : 'bg-white border-gray-300 hover:bg-purple-50'}`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    <Mic className={`h-5 w-5 ${isRecording ? 'text-purple-600 animate-pulse' : 'text-gray-700'}`} />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!userTurn || !currentMessage.trim()}
                    className="bg-blue-600 text-white p-2 sm:p-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                  >
                    <Send className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                  {isRecording && (
                    <Waveform active={true} className="ml-2" />
                  )}
                </div>
                {recordingError && (
                  <div className="text-xs text-red-600 mt-1">{recordingError}</div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 sm:space-y-6">
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
