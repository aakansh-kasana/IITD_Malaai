import { GoogleGenerativeAI } from '@google/generative-ai';
import { Feedback } from '../types';

class GeminiService {
  private genAI: GoogleGenerativeAI | null = null;
  private model: any = null;
  private apiKeyValid: boolean = false;
  private callCount: number = 0;

  constructor() {
    this.initializeAPI();
  }

  private initializeAPI() {
    // Check both environment variable and localStorage
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY || localStorage.getItem('gemini_api_key');
    
    if (apiKey) {
      try {
        this.genAI = new GoogleGenerativeAI(apiKey);
        this.model = this.genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
        this.apiKeyValid = true;
        console.log('🔑 AI initialized with key:', apiKey.substring(0, 15) + '...');
        console.log('🔧 GoogleGenerativeAI instance created:', !!this.genAI);
        console.log('🤖 Model instance created:', !!this.model);
      } catch (error) {
        console.error('❌ Failed to initialize AI:', error);
        this.genAI = null;
        this.model = null;
        this.apiKeyValid = false;
      }
    } else {
      console.log('⚠️ No AI API key found - AI responses disabled');
      this.apiKeyValid = false;
    }
  }

  // Method to reinitialize after API key is added
  public reinitialize() {
    this.initializeAPI();
  }

  private isConfigured(): boolean {
    return this.genAI !== null && this.model !== null && this.apiKeyValid;
  }

  // Method to get API call statistics
  public getStats() {
    return {
      callCount: this.callCount,
      isConfigured: this.isConfigured(),
      hasGenAI: !!this.genAI,
      hasModel: !!this.model,
      apiKeyValid: this.apiKeyValid
    };
  }

  async generateDebateResponse(
    topic: string,
    userArgument: string,
    aiSide: 'pro' | 'con',
    round: number,
    conversationHistory: string[]
  ): Promise<string> {
    this.callCount++;
    const callId = `CALL-${this.callCount}-${Date.now()}`;
    
    console.log(`🚀 [${callId}] STARTING AI CALL #${this.callCount}`);
    console.log(`📊 [${callId}] API Stats:`, this.getStats());
    console.log(`📝 [${callId}] Request Details:`, { 
      topic, 
      userArgument: userArgument.substring(0, 50) + '...', 
      aiSide, 
      round,
      historyLength: conversationHistory.length,
      timestamp: new Date().toISOString()
    });
    
    if (!this.isConfigured()) {
      throw new Error(`[${callId}] AI API not configured. Please add your API key to enable AI responses.`);
    }

    try {
      const prompt = this.buildAdvancedDebatePrompt(topic, userArgument, aiSide, round, conversationHistory, callId);
      
      console.log(`📤 [${callId}] SENDING TO AI API...`);
      console.log(`📤 [${callId}] Prompt length: ${prompt.length} characters`);
      console.log(`📤 [${callId}] Model: gemini-1.5-flash`);
      console.log(`📤 [${callId}] Request timestamp: ${new Date().toISOString()}`);
      
      // ACTUAL AI API CALL
      const startTime = Date.now();
      const result = await this.model.generateContent(prompt);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ [${callId}] API Response time: ${responseTime}ms`);
      
      const response = await result.response;
      const text = response.text();
      
      console.log(`✅ [${callId}] AI API RESPONSE RECEIVED!`);
      console.log(`📥 [${callId}] Response length: ${text.length} characters`);
      console.log(`📥 [${callId}] Response preview: "${text.substring(0, 100)}..."`);
      console.log(`📥 [${callId}] Full response:`, text);
      console.log(`📊 [${callId}] Total API calls made: ${this.callCount}`);
      
      if (!text || text.trim().length === 0) {
        throw new Error(`[${callId}] Empty response from AI API`);
      }
      
      // Log success metrics
      console.log(`🎯 [${callId}] SUCCESS - AI API call completed in ${responseTime}ms`);
      
      return text.trim();
    } catch (error: any) {
      console.error(`❌ [${callId}] AI API ERROR:`, error);
      console.error(`❌ [${callId}] Error type:`, error.constructor.name);
      console.error(`❌ [${callId}] Error message:`, error.message);
      console.error(`❌ [${callId}] Full error:`, error);
      
      // Handle specific API errors
      if (error?.message?.includes('API key not valid') || error?.message?.includes('API_KEY_INVALID')) {
        this.apiKeyValid = false;
        this.genAI = null;
        this.model = null;
        throw new Error(`[${callId}] Invalid API key. Please check your API key and try again.`);
      }
      
      if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
        throw new Error(`[${callId}] API quota exceeded. Please check your API usage limits.`);
      }
      
      if (error?.message?.includes('network') || error?.message?.includes('fetch')) {
        throw new Error(`[${callId}] Network error connecting to API. Please check your internet connection.`);
      }
      
      throw new Error(`[${callId}] AI API error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  private buildAdvancedDebatePrompt(
    topic: string,
    userArgument: string,
    aiSide: 'pro' | 'con',
    round: number,
    conversationHistory: string[],
    callId: string
  ): string {
    const sideDescription = aiSide === 'pro' ? 'FOR (supporting the topic)' : 'AGAINST (opposing the topic)';
    const timestamp = new Date().toISOString();
    
    let prompt = `AI DEBATE RESPONSE - Call ID: ${callId}
Generated at: ${timestamp}
This is a LIVE API call to the AI service.

DEBATE TOPIC: "${topic}"
YOUR POSITION: ${sideDescription}
CURRENT ROUND: ${round}
CALL ID: ${callId}
TIMESTAMP: ${timestamp}

INSTRUCTIONS FOR AI:
1. You are responding to a REAL human in a LIVE debate
2. This is call #${this.callCount} to the AI API
3. Respond naturally and authentically to what they said
4. If they test if you're real, acknowledge you're an AI assistant but redirect to debate
5. Make contextual arguments specific to their points
6. Keep responses 2-3 sentences for natural flow
7. Use current examples and reasoning
8. Reference the call ID ${callId} if they ask about technical details

`;

    if (conversationHistory.length > 0) {
      prompt += `CONVERSATION HISTORY (last 4 messages):
${conversationHistory.slice(-4).map((msg, i) => `${i + 1}. ${msg}`).join('\n')}

`;
    }

    if (userArgument && userArgument.trim()) {
      prompt += `HUMAN JUST SAID: "${userArgument}"

Respond to this specific message. If they're testing if you're real, briefly acknowledge you're an AI assistant (call ${callId}) but redirect to the debate topic "${topic}". If they made a debate argument, counter it with your ${aiSide} position using specific reasoning.

Your AI response (Call ${callId}):`;
    } else {
      prompt += `This is your opening statement for call ${callId}. Present your ${aiSide} position on "${topic}" with a strong, specific argument.

Your AI response (Call ${callId}):`;
    }

    return prompt;
  }

  async analyzeFeedback(
    userArgument: string,
    topic: string,
    userSide: 'pro' | 'con',
    round: number
  ): Promise<Feedback> {
    this.callCount++;
    const callId = `FEEDBACK-${this.callCount}-${Date.now()}`;
    
    console.log(`🔍 [${callId}] STARTING AI FEEDBACK ANALYSIS #${this.callCount}`);
    console.log(`📊 [${callId}] API Stats:`, this.getStats());
    console.log(`📝 [${callId}] Analysis Details:`, {
      argumentLength: userArgument.length,
      topic,
      userSide,
      round,
      timestamp: new Date().toISOString()
    });
    
    if (!this.isConfigured()) {
      throw new Error(`[${callId}] AI API not configured. Please add your API key to enable AI feedback analysis.`);
    }

    try {
      const timestamp = new Date().toISOString();
      const prompt = `AI FEEDBACK ANALYSIS - Call ID: ${callId}
Generated at: ${timestamp}
This is a LIVE API call to the AI service for argument analysis.

DEBATE TOPIC: "${topic}"
STUDENT'S POSITION: ${userSide === 'pro' ? 'FOR' : 'AGAINST'}
ROUND: ${round}
CALL ID: ${callId}
TIMESTAMP: ${timestamp}
STUDENT'S ARGUMENT: "${userArgument}"

CRITICAL SCORING INSTRUCTIONS:
- Analyze the argument quality, relevance, structure, and evidence
- Score based on actual content quality, not predetermined ranges
- Be fair and accurate in assessment
- Consider the argument's strength relative to the debate topic
- Don't artificially inflate or deflate scores

Provide AI analysis in this EXACT JSON format (no extra text, no markdown):
{
  "score": [ACTUAL_SCORE_BASED_ON_ANALYSIS],
  "strengths": ["Specific strength 1", "Specific strength 2", "Specific strength 3"],
  "improvements": ["Specific improvement 1", "Specific improvement 2", "Specific improvement 3"],
  "fallaciesDetected": ["Any logical fallacies found"],
  "suggestions": ["Actionable suggestion 1", "Actionable suggestion 2", "Actionable suggestion 3"]
}

SCORING CRITERIA (0-100):
- Relevance to topic (0-25 points): How well does the argument address the debate topic?
- Clarity and structure (0-25 points): Is the argument well-organized and easy to follow?
- Evidence and reasoning (0-25 points): Does the argument provide solid evidence and logical reasoning?
- Debate technique (0-25 points): Does it use effective debate strategies and avoid fallacies?

SCORING GUIDELINES:
- 90-100: Exceptional argument with strong evidence, clear structure, and excellent reasoning
- 80-89: Strong argument with good evidence and clear reasoning
- 70-79: Good argument with adequate support and structure
- 60-69: Acceptable argument but lacks depth or has minor issues
- 50-59: Weak argument with significant problems in logic or evidence
- 40-49: Poor argument with major flaws
- 30-39: Very poor argument, mostly irrelevant or illogical
- 20-29: Extremely poor, barely addresses topic
- 10-19: Almost completely irrelevant or nonsensical
- 0-9: No meaningful argument content

Be specific and educational. Analyze the actual content quality. If the argument is off-topic, casual conversation, or very weak, score accordingly. If it's strong and well-reasoned, score it highly.

This is call ${callId} to AI.

RESPOND WITH ONLY THE JSON OBJECT:`;

      console.log(`📤 [${callId}] SENDING FEEDBACK REQUEST TO AI API...`);
      console.log(`📤 [${callId}] Prompt length: ${prompt.length} characters`);
      
      // ACTUAL AI API CALL FOR FEEDBACK
      const startTime = Date.now();
      const result = await this.model.generateContent(prompt);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      console.log(`⏱️ [${callId}] Feedback API Response time: ${responseTime}ms`);
      
      const response = await result.response;
      const text = response.text().trim();
      
      console.log(`✅ [${callId}] AI FEEDBACK RESPONSE RECEIVED!`);
      console.log(`📥 [${callId}] Raw feedback response:`, text);
      console.log(`📊 [${callId}] Total API calls made: ${this.callCount}`);
      
      try {
        // Clean the response to extract JSON
        let jsonText = text;
        if (text.includes('```json')) {
          jsonText = text.split('```json')[1].split('```')[0].trim();
        } else if (text.includes('```')) {
          jsonText = text.split('```')[1].split('```')[0].trim();
        }
        
        console.log(`🔧 [${callId}] Parsing JSON:`, jsonText);
        const feedback = JSON.parse(jsonText);
        
        // Validate and sanitize the feedback - DO NOT artificially constrain scores
        const validatedFeedback: Feedback = {
          score: Math.max(0, Math.min(100, Number(feedback.score) || 0)), // Allow full 0-100 range
          strengths: Array.isArray(feedback.strengths) ? feedback.strengths.slice(0, 3) : [],
          improvements: Array.isArray(feedback.improvements) ? feedback.improvements.slice(0, 3) : [],
          fallaciesDetected: Array.isArray(feedback.fallaciesDetected) ? feedback.fallaciesDetected : [],
          suggestions: Array.isArray(feedback.suggestions) ? feedback.suggestions.slice(0, 3) : []
        };
        
        console.log(`✅ [${callId}] AI FEEDBACK PROCESSED:`, validatedFeedback);
        console.log(`🎯 [${callId}] SUCCESS - AI feedback analysis completed in ${responseTime}ms`);
        console.log(`📊 [${callId}] ACTUAL SCORE GIVEN: ${validatedFeedback.score}/100`);
        
        return validatedFeedback;
      } catch (parseError) {
        console.error(`❌ [${callId}] Error parsing AI feedback JSON:`, parseError);
        console.error(`❌ [${callId}] Raw text that failed to parse:`, text);
        throw new Error(`[${callId}] Failed to parse feedback from AI API. Please try again.`);
      }
    } catch (error: any) {
      console.error(`❌ [${callId}] AI FEEDBACK API ERROR:`, error);
      console.error(`❌ [${callId}] Error type:`, error.constructor.name);
      console.error(`❌ [${callId}] Error message:`, error.message);
      
      // Handle specific API errors
      if (error?.message?.includes('API key not valid') || error?.message?.includes('API_KEY_INVALID')) {
        this.apiKeyValid = false;
        this.genAI = null;
        this.model = null;
        throw new Error(`[${callId}] Invalid API key. Please check your API key and try again.`);
      }
      
      if (error?.message?.includes('quota') || error?.message?.includes('limit')) {
        throw new Error(`[${callId}] API quota exceeded. Please check your API usage limits.`);
      }
      
      if (error?.message?.includes('parse') || error?.message?.includes('JSON')) {
        throw new Error(`[${callId}] Failed to parse feedback from AI API. Please try again.`);
      }
      
      throw new Error(`[${callId}] AI API feedback error: ${error.message || 'Unknown error occurred'}`);
    }
  }

  // Method to test if API is working with detailed logging
  async testConnection(): Promise<boolean> {
    if (!this.isConfigured()) {
      console.log('🧪 Cannot test connection - API not configured');
      return false;
    }

    this.callCount++;
    const callId = `TEST-${this.callCount}-${Date.now()}`;

    try {
      console.log(`🧪 [${callId}] Testing AI API connection...`);
      console.log(`🧪 [${callId}] API Stats:`, this.getStats());
      
      const testPrompt = `This is a connection test for call ID ${callId} at ${new Date().toISOString()}. Respond with exactly: "AI WORKING - Call ${callId}"`;
      
      console.log(`🧪 [${callId}] Sending test prompt:`, testPrompt);
      
      const startTime = Date.now();
      const result = await this.model.generateContent(testPrompt);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      const response = await result.response;
      const text = response.text().trim();
      
      console.log(`🧪 [${callId}] Test response received in ${responseTime}ms:`, text);
      console.log(`🧪 [${callId}] Expected to contain: "AI WORKING - Call ${callId}"`);
      
      const isWorking = text.includes('AI WORKING') && text.includes(callId);
      
      if (isWorking) {
        console.log(`✅ [${callId}] AI API connection test PASSED!`);
      } else {
        console.log(`❌ [${callId}] AI API connection test FAILED - unexpected response`);
      }
      
      return isWorking;
    } catch (error) {
      console.error(`🧪 [${callId}] AI API test failed:`, error);
      return false;
    }
  }

  // Method to clear call count (for debugging)
  public resetStats() {
    this.callCount = 0;
    console.log('📊 API call statistics reset');
  }
}

export const geminiService = new GeminiService();

// Expose service to window for debugging
if (typeof window !== 'undefined') {
  (window as any).geminiService = geminiService;
  console.log('🔧 GeminiService exposed to window.geminiService for debugging');
}