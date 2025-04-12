/**
 * Service for interacting with the Grok AI API
 */
import axios from 'axios';

// We're making an assumption about the Grok API format based on the API key format
// We're using a ChatGPT-like interface since we don't have specific Grok API docs
// This can be adjusted once we have more information about the Grok API

/**
 * Sends a message to the Grok AI and gets a response
 * @param {string} message - User's message
 * @param {Array} history - Previous conversation history
 * @returns {Promise<string>} AI response text
 */
export const sendMessageToGrok = async (message, history = []) => {
  try {
    const apiKey = process.env.REACT_APP_GROK_API_KEY;
    const endpoint = process.env.REACT_APP_GROK_API_ENDPOINT;
    
    if (!apiKey || !endpoint) {
      throw new Error('Grok API configuration is missing');
    }
    
    // Convert message history to the expected format
    // This assumes a GPT-like API format, adjust as needed
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
        model: 'gpt-4-turbo', // This might need to be adjusted for the Grok API
        messages,
        max_tokens: 500,
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
    // This will need to be adjusted based on actual Grok API response format
    if (response.data && response.data.choices && response.data.choices.length > 0) {
      return response.data.choices[0].message.content;
    } else {
      throw new Error('Invalid response format from Grok API');
    }
    
  } catch (error) {
    console.error('Error calling Grok API:', error);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    
    // Return a user-friendly error message
    return "I'm sorry, I couldn't process your request right now. Please try again later.";
  }
};