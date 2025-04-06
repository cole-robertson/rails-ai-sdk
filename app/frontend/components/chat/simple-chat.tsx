import type { Message } from 'ai';
import React, { useRef, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SendIcon, SparklesIcon } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Messages } from './messages';
import consumer from '@/lib/cable/consumer';
import { router } from '@inertiajs/react';

interface SimpleChatProps {
  chatId: string | number;
  modelId: string;
  messages: Message[];
  input: string;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  chat?: any;
}

export function SimpleChat({
  chatId,
  modelId,
  messages,
  input,
  handleInputChange,
  handleSubmit,
  isLoading,
  chat,
}: SimpleChatProps) {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  // Set up ActionCable subscription for title updates
  useEffect(() => {
    const chatChannel = consumer.subscriptions.create(
      { channel: "ChatChannel", id: chatId },
      {
        received(data: any) {
          if (data.title && data.title !== chat?.title) {
            router.reload();
          }
        }
      }
    );

    return () => chatChannel.unsubscribe();
  }, [chatId, chat]);

  return (
    <div className="flex flex-col h-full bg-black text-white">
      <div className="bg-black text-white p-4 border-b border-neutral-800">
        <h1 className="text-xl font-bold flex items-center gap-2">
          <SparklesIcon className="h-5 w-5" />
          {chat.title ? chat.title : "Chat with Ruby LLM"}
        </h1>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-black">
        {messages.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <Card className="p-8 max-w-md text-center bg-neutral-900 border-neutral-800">
              <SparklesIcon className="h-12 w-12 mx-auto mb-4 text-white" />
              <h2 className="text-lg font-medium mb-2 text-white">Start a conversation</h2>
              <p className="text-neutral-400">
                This is an open source chatbot template built with Rails, Inertia.js, React, AI SDK, and Ruby LLM.
              </p>
            </Card>
          </div>
        ) : (
          <div className="space-y-6">
            <Messages chatId={chatId.toString()} messages={messages} isLoading={isLoading} votes={[]} setMessages={() => {}} reload={() => Promise.resolve(null)} isReadonly={false} isBlockVisible={false} />
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
      
      <div className="p-4 border-t border-neutral-800 bg-black">
        <form onSubmit={handleSubmit} className="flex gap-2 items-center">
          <Input
            value={input}
            onChange={handleInputChange}
            placeholder="Type your message..."
            className="flex-1 bg-neutral-800 border-neutral-700 text-white placeholder:text-neutral-400 focus-visible:ring-neutral-700"
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            disabled={isLoading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 text-white rounded-full w-10 h-10 p-0 flex items-center justify-center"
          >
            {isLoading ? 
              <div className="h-4 w-4 border-t-2 border-blue-300 border-solid rounded-full animate-spin"></div> :
              <SendIcon className="h-5 w-5" />
            }
          </Button>
        </form>
      </div>
    </div>
  );
} 