import React, { useState, useRef, useEffect } from 'react';
import { sendMessageToGrok, ChatMessage } from '../services/grokService';

const ChatBox: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when expanded
  useEffect(() => {
    if (isExpanded && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isExpanded]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;
    
    const userMessage = input.trim();
    setInput('');
    
    // Ensure chat is expanded when sending a message
    setIsExpanded(true);
    
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

  // Toggle expanded state
  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div 
      className={`chat-container fixed bottom-0 left-0 right-0 flex flex-col transition-all duration-300 ease-in-out z-10 shadow-lg ${
        isExpanded ? 'h-96 sm:h-80' : 'h-14'
      }`}
      style={{ maxHeight: isExpanded ? '80vh' : '56px' }}
    >
      {/* Chat header - always visible */}
      <div 
        className="border-b border-white border-opacity-10 p-3 flex justify-between items-center cursor-pointer"
        onClick={toggleExpanded}
      >
        <div className="flex items-center gap-2">
          <h3 className="font-medium">AI Assistant</h3>
          {!isExpanded && messages.length > 0 && (
            <span className="text-xs bg-welcome-accent rounded-full w-5 h-5 flex items-center justify-center">
              {messages.length}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                setMessages([]);
              }}
              className="text-xs py-1 px-2 rounded bg-black bg-opacity-20 hover:bg-opacity-30"
            >
              Clear
            </button>
          )}
          
          <button 
            onClick={(e) => {
              e.stopPropagation();
              toggleExpanded();
            }}
            className="text-gray-300 hover:text-white focus:outline-none"
            aria-label={isExpanded ? "Minimize chat" : "Expand chat"}
          >
            {isExpanded ? (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        </div>
      </div>
      
      {/* Chat content - only visible when expanded */}
      {isExpanded && (
        <>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="text-center text-gray-400 my-4">
                Ask about crypto, blockchain, or how to use your wallet.
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
                ref={inputRef}
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading}
                placeholder="Ask a question about crypto..."
                className="flex-1 bg-black bg-opacity-20 rounded-lg px-4 py-2 focus:outline-none focus:ring-1 focus:ring-welcome-accent min-h-[44px]"
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="bg-welcome-accent hover:bg-opacity-80 p-2 rounded-lg disabled:opacity-50 min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Send message"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                </svg>
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ChatBox;