import React, { useEffect, useRef, useState } from 'react';
import { useChat } from 'ai/react';
import { streamChatPath } from '@/routes';
import { toast } from 'sonner';

interface Message {
  id: string | number;
  role: string;
  content: string;
  created_at: string;
}

interface Chat {
  id: number;
  model_id: string;
  created_at: string;
}

interface ShowProps {
  chat: Chat;
  messages: Message[];
}

const MessageComponent: React.FC<{ message: {id: string, role: string, content: string} }> = ({ message }) => {
  const isUser = message.role === 'user';
  // Improved contrast with more distinct colors
  const bgColor = isUser ? 'bg-blue-200' : 'bg-gray-200';
  const textColor = 'text-gray-900'; // Ensure text is dark for readability

  return (
    <div className={`p-4 rounded-lg mb-4 ${bgColor} shadow-sm`}>
      <div className={`font-bold ${textColor}`}>{isUser ? 'You' : 'AI'}</div>
      <div className={`mt-1 whitespace-pre-wrap ${textColor}`}>{message.content}</div>
    </div>
  );
};

const Show: React.FC<ShowProps> = ({ chat, messages: initialMessages }) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hasError, setHasError] = useState(false);
  
  // Convert Rails format messages to AI SDK format
  const initialAIMessages = initialMessages.map(message => ({
    id: String(message.id),
    role: message.role as 'user' | 'assistant' | 'system' | 'data',
    content: message.content,
  }));
  
  // Get CSRF token from meta tag
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  
  // Use the AI SDK useChat hook
  const { messages, input, handleInputChange, handleSubmit, isLoading, error } = useChat({
    api: streamChatPath(chat.id), // Stream endpoint
    initialMessages: initialAIMessages,
    headers: {
      'X-CSRF-Token': csrfToken,
    },
    body: {
      chat_id: chat.id
    },
    // Explicitly set the stream protocol to 'data'
    streamProtocol: 'data',
    onResponse: (response) => {
      // Log the raw response for debugging
      console.log('Raw response:', response);
      
      if (!response.ok) {
        console.error(`Response error: ${response.status} ${response.statusText}`);
      }
    },
    onError: (error) => {
      console.error("Chat error details:", error);
      setHasError(true);
      toast.error('An error occurred. Please try again.');
    },
    onFinish: () => {
      // Reset error state on successful completion
      setHasError(false);
    }
  });
  
  // Log any errors for debugging
  useEffect(() => {
    if (error) {
      console.error("Chat error:", error);
      toast.error('An error occurred. Please try again.');
    }
  }, [error]);
  
  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Handle form submission with error state reset
  const handleSubmitWithErrorReset = (e: React.FormEvent) => {
    setHasError(false);
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <div className="bg-blue-600 text-white p-4 shadow-md">
        <h1 className="text-xl font-bold">Chat with {chat.model_id}</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
        {messages.length === 0 ? (
          <div className="text-center p-8 text-gray-500">
            <p>No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map(message => (
            <MessageComponent key={message.id} message={message} />
          ))
        )}
        
        {hasError && (
          <div className="p-4 bg-red-100 border border-red-300 rounded-lg text-red-700">
            <p>An error occurred while generating the response. Please try again or refresh the page.</p>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t bg-white shadow-md">
        <form onSubmit={handleSubmitWithErrorReset} className="flex">
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 p-3 border border-gray-300 rounded-l text-gray-900"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-6 py-3 rounded-r hover:bg-blue-700 disabled:bg-blue-300 font-medium"
            disabled={isLoading || !input.trim()}
          >
            {isLoading ? 'Sending...' : 'Send'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Show; 