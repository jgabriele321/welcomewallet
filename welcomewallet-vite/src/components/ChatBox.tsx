import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGrok, ChatMessage } from '../services/grokService';

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Add user message to chat
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setLoading(true);
    
    try {
      // Get AI response
      const aiResponse = await sendMessageToGrok(userMessage, messages);
      
      // Add AI response to chat
      setMessages(prev => [...prev, { text: aiResponse, isUser: false }]);
    } catch (error) {
      console.error('Error sending message:', error);
      setMessages(prev => [
        ...prev, 
        { 
          text: "Sorry, I couldn't process your request right now. Please try again later.", 
          isUser: false 
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-container fixed bottom-0 left-0 right-0 h-64 flex flex-col">
      <div className="border-b border-white border-opacity-10 p-3 flex justify-between items-center">
        <h3 className="font-medium">Grok AI Assistant</h3>
        <button 
          onClick={() => setMessages([])}
          className="text-xs py-1 px-2 rounded bg-black bg-opacity-20 hover:bg-opacity-30"
        >
          Clear Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 ? (
          <div className="text-center text-gray-400 my-4">
            Ask Grok about crypto, blockchain, or how to use your wallet.
          </div>
        ) : (
          messages.map((msg, index) => (
            <div 
              key={index} 
              className={`chat-message ${msg.isUser ? 'user-message' : 'assistant-message'}`}
            >
              {msg.text}
            </div>
          ))
        )}
        {loading && (
          <div className="chat-message assistant-message">
            <div className="flex space-x-2">
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      <form onSubmit={handleSendMessage} className="p-3 border-t border-white border-opacity-10">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={loading}
            placeholder="Ask a question about crypto..."
            className="flex-1 bg-black bg-opacity-20 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-welcome-accent"
          />
          <button
            type="submit"
            disabled={loading || !input.trim()}
            className="bg-welcome-accent hover:bg-opacity-80 p-2 rounded-lg disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatBox;