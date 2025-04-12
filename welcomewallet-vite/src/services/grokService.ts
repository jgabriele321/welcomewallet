/**
 * Service for interacting with the Grok AI API
 */
import axios from 'axios';

// Message interface for chat
export interface ChatMessage {
  text: string;
  isUser: boolean;
}

/**
 * Sends a message to the Grok AI and gets a response
 * @param message - User's message
 * @param history - Previous conversation history
 * @returns AI response text
 */
export const sendMessageToGrok = async (
  message: string, 
  history: ChatMessage[] = []
): Promise<string> => {
  try {
    const apiKey = import.meta.env.VITE_GROK_API_KEY;
    const endpoint = import.meta.env.VITE_GROK_API_ENDPOINT;
    
    if (!apiKey || !endpoint) {
      throw new Error('Grok API configuration is missing');
    }
    
    // Convert message history to the expected format
    const messages = [
      {
        role: 'system',
        content: 'You are a helpful AI assistant specialized in cryptocurrency and blockchain topics. Provide concise and accurate information to help users understand crypto concepts, market trends, and how to use their assets safely.'
      },
      ...history.map(msg => ({
        role: msg.isUser ? 'user' : 'assistant',
        content: msg.text
      })),
      {
        role: 'user',
        content: message
      }
    ];
    
    const response = await axios.post(
      endpoint,
      {
        model: 'grok-3-latest', // X.AI's Grok model
        messages,
        stream: false,
        temperature: 0.7,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        }
      }
    );
    
    // Extract the AI response based on API response structure
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from Grok API');
    }
    
  } catch (error) {
    console.error('Error calling Grok API:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    // Return a user-friendly error message
    return "I'm sorry, I couldn't process your request right now. Please try again later.";
  }
};