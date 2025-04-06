import React, { useState, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { isToday, isYesterday } from 'date-fns';
import { chatPath } from '@/routes';
import { Button } from '@/components/ui/button';
import { PlusIcon } from 'lucide-react';
import {
  SidebarProvider,
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import consumer from '@/lib/cable/consumer';

interface Chat {
  id: number;
  model_id: string;
  created_at: string;
  title?: string;
  last_message_content?: string | null;
}

interface SimpleSidebarProps {
  chats: Chat[];
  currentChatId: number;
  onNewChat: () => void;
}

export function SimpleSidebar({ chats: initialChats, currentChatId, onNewChat }: SimpleSidebarProps) {
  // Use local state to track chats so we can update them without a full page reload
  const [chats, setChats] = useState<Chat[]>(initialChats);
  
  // When initialChats changes from parent, update our local state
  useEffect(() => {
    setChats(initialChats);
  }, [initialChats]);
  
  // Group chats by date
  const todayChats = chats.filter(chat => isToday(new Date(chat.created_at)));
  const yesterdayChats = chats.filter(chat => isYesterday(new Date(chat.created_at)));
  const olderChats = chats.filter(chat => !isToday(new Date(chat.created_at)) && !isYesterday(new Date(chat.created_at)));

  return (
    <div className="h-full w-[200px] flex flex-col bg-black border-r border-neutral-800">
      <div className="p-3 border-b border-neutral-800">
        <h1 className="text-lg font-semibold text-white mb-2">Your Chats</h1>
        <Button 
          onClick={onNewChat}
          className="w-full bg-neutral-800 hover:bg-neutral-700 text-white border-0"
          size="sm"
        >
          <PlusIcon className="mr-1 h-4 w-4" />
          New Chat
        </Button>
      </div>
      
      <div className="flex-1 overflow-y-auto py-2 px-1">
        {chats.length === 0 ? (
          <div className="text-center p-4 text-neutral-400">
            <p>No chats yet. Start a new conversation!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {todayChats.length > 0 && (
              <div>
                <h2 className="text-xs text-neutral-500 font-medium mb-1 px-2">Today</h2>
                <div className="space-y-1">
                  {todayChats.map(chat => (
                    <ChatMenuItem 
                      key={chat.id} 
                      chat={chat} 
                      isActive={chat.id === currentChatId} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {yesterdayChats.length > 0 && (
              <div>
                <h2 className="text-xs text-neutral-500 font-medium mb-1 px-2">Yesterday</h2>
                <div className="space-y-1">
                  {yesterdayChats.map(chat => (
                    <ChatMenuItem 
                      key={chat.id} 
                      chat={chat} 
                      isActive={chat.id === currentChatId} 
                    />
                  ))}
                </div>
              </div>
            )}
            
            {olderChats.length > 0 && (
              <div>
                <h2 className="text-xs text-neutral-500 font-medium mb-1 px-2">Older</h2>
                <div className="space-y-1">
                  {olderChats.map(chat => (
                    <ChatMenuItem 
                      key={chat.id} 
                      chat={chat} 
                      isActive={chat.id === currentChatId} 
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
      
      <div className="p-3 border-t border-neutral-800">
        <div className="text-xs text-neutral-500 flex items-center">
          Built by <a href="https://dscribeai.com" target="_blank" className="font-medium ml-1">dScribe AI</a>
        </div>
      </div>
    </div>
  );
}

function ChatMenuItem({ chat, isActive }: { chat: Chat; isActive: boolean }) {
  return (
    <Link 
      href={chatPath(chat.id)}
      className={cn(
        "block px-2 py-1.5 rounded text-sm",
        isActive 
          ? "bg-neutral-800 text-white" 
          : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
      )}
    >
      <div className="flex flex-col overflow-hidden">
        <div className="font-medium truncate">
          {chat.title || "New Chat"}
        </div>
        <div className="text-xs text-neutral-500 truncate">
          {chat.last_message_content ? (
            <span className="truncate">{chat.last_message_content}</span>
          ) : (
            <span className="italic">No messages yet</span>
          )}
        </div>
      </div>
    </Link>
  );
} 