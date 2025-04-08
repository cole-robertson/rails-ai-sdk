import React, { useState } from 'react';
import { useChat,  } from '@ai-sdk/react';
import { streamChatPath, chatsPath } from '@/routes';
import { router } from '@inertiajs/react';
import { toast } from 'sonner';
import { SimpleChat } from '@/components/chat/simple-chat';
import { SimpleSidebar } from '@/components/chat/simple-sidebar';
import type { Chat, Message } from '@/types';

interface ShowProps {
  chat: Chat;
  messages: Message[];
  allChats: Chat[]; // All user chats for the sidebar
}

const Show: React.FC<ShowProps> = ({ chat, messages: initialMessages, allChats }) => {
  const [hasError, setHasError] = useState(false);
  // Get CSRF token from meta tag
  const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '';
  
  // Use the AI SDK useChat hook
  const { 
    messages,
    input, 
    handleInputChange, 
    handleSubmit,
    status
  } = useChat({
    api: streamChatPath(chat.id),
    initialMessages: initialMessages as any,
    headers: {
      'X-CSRF-Token': csrfToken,
    },
    body: {
      chat_id: chat.id
    },
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

  console.log('messages', messages);
  
  const handleNewChat = () => {
    router.post(chatsPath(), {}, {
      onError: () => toast.error('Failed to create a new chat')
    });
  };

  const isLoading = status === 'streaming' || status === 'submitted';

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