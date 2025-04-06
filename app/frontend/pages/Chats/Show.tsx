import React, { useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { streamChatPath, chatsPath } from '@/routes';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { SimpleChat } from '@/components/chat/simple-chat';
import { SimpleSidebar } from '@/components/chat/simple-sidebar';

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
  title?: string;
  last_message_content?: string | null;
}

interface ShowProps {
  chat: Chat;
  messages: Message[];
  allChats: Chat[]; // All user chats for the sidebar
}

const Show: React.FC<ShowProps> = ({ chat, messages: initialMessages, allChats }) => {
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
  const { 
    messages, 
    input, 
    handleInputChange, 
    handleSubmit,
    isLoading, 
    error 
  } = useChat({
    api: streamChatPath(chat.id), // Stream endpoint
    initialMessages: initialAIMessages,
    headers: {
      'X-CSRF-Token': csrfToken,
    },
    body: {
      chat_id: chat.id
    },
    streamProtocol: 'data',
    onResponse: (response) => {
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

  const handleNewChat = () => {
    // Create a new chat using POST request via Inertia
    router.post(chatsPath(), {}, {
      onSuccess: () => {
        // The server will handle the redirect to the new chat
      },
      onError: () => {
        toast.error('Failed to create a new chat');
      }
    });
  };

  return (
    <div className="flex h-screen bg-black">
      <SimpleSidebar 
        chats={allChats} 
        currentChatId={chat.id} 
        onNewChat={handleNewChat} 
      />
      
      <div className="flex-1 flex flex-col">
        {hasError && (
          <div className="p-4 bg-red-900 border border-red-800 rounded-lg text-white absolute top-4 right-4 z-50">
            <p>An error occurred while generating the response. Please try again.</p>
          </div>
        )}
        
        <SimpleChat
          chatId={chat.id}
          modelId={chat.model_id}
          messages={messages}
          input={input}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
          isLoading={isLoading}
          chat={chat}
        />
      </div>
    </div>
  );
};

export default Show; 