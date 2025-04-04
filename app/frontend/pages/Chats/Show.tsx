import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import consumer from '@/channels/consumer';
import { askChatPath } from '@/routes';

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

interface ActionCableData {
  type: string;
  message?: Message;
  content?: string;
}

const MessageComponent: React.FC<{ message: Message }> = ({ message }) => {
  const isUser = message.role === 'user';
  const bgColor = isUser ? 'bg-blue-100' : 'bg-gray-100';

  return (
    <div className={`p-4 rounded-lg mb-4 ${bgColor}`}>
      <div className="font-bold">{isUser ? 'You' : 'AI'}</div>
      <div className="mt-1 whitespace-pre-wrap">{message.content}</div>
    </div>
  );
};

const Show: React.FC<ShowProps> = ({ chat, messages: initialMessages }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [newMessage, setNewMessage] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamedContent, setStreamedContent] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const subscription = consumer.subscriptions.create(
      { channel: 'ChatChannel', chat_id: chat.id },
      {
        received(data: ActionCableData) {
          if (data.type === 'message_start') {
            // Start streaming, create placeholder
            setStreamedContent('');
          } else if (data.type === 'message_chunk' && data.content) {
            // Update streamed content
            setStreamedContent(prev => prev + data.content);
          } else if (data.type === 'message_complete' && data.message) {
            // Complete message received, update with final version
            setMessages(prevMessages => {
              // Find if we already have a temporary message to replace
              const tempIndex = prevMessages.findIndex(m => String(m.id).includes('temp_'));
              if (tempIndex >= 0 && data.message) {
                // Replace temp message
                const updatedMessages = [...prevMessages];
                updatedMessages[tempIndex] = data.message;
                return updatedMessages;
              } else if (data.message) {
                // No temp message, just append
                return [...prevMessages, data.message];
              }
              // Fall back to returning unchanged messages
              return prevMessages;
            });
            setStreamedContent('');
            setIsLoading(false);
          }
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [chat.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streamedContent]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || isLoading) return;

    const userMessage: Message = {
      id: `temp_user_${Date.now()}`,
      role: 'user',
      content: newMessage,
      created_at: new Date().toISOString()
    };

    setMessages([...messages, userMessage]);
    setIsLoading(true);
    
    router.post(askChatPath(chat.id), { 
      message: newMessage 
    });
    
    setNewMessage('');
  };

  return (
    <div className="flex flex-col h-screen">
      <div className="bg-white border-b p-4">
        <h1 className="text-xl font-bold">Chat with {chat.model_id}</h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map(message => (
          <MessageComponent key={String(message.id)} message={message} />
        ))}
        
        {streamedContent && (
          <div className="p-4 rounded-lg mb-4 bg-gray-100">
            <div className="font-bold">AI</div>
            <div className="mt-1 whitespace-pre-wrap">{streamedContent}</div>
          </div>
        )}
        
        {isLoading && !streamedContent && (
          <div className="p-4 rounded-lg mb-4 bg-gray-100 animate-pulse">
            <div className="font-bold">AI</div>
            <div className="mt-1">Thinking...</div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-4 border-t">
        <form onSubmit={handleSubmit} className="flex">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message..."
            className="flex-1 p-2 border rounded-l"
            disabled={isLoading}
          />
          <button 
            type="submit" 
            className="bg-blue-600 text-white px-4 py-2 rounded-r hover:bg-blue-700 disabled:bg-blue-300"
            disabled={isLoading || !newMessage.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
};

export default Show; 