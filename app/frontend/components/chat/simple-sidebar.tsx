import React, { useState, useEffect } from 'react';
import { Link, router } from '@inertiajs/react';
import { isToday, isYesterday } from 'date-fns';
import { chatPath } from '@/routes';
import { Button } from '@/components/ui/button';
import { PlusIcon, MoreVertical, Trash } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
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
      
      <div className="p-6.5 border-t border-neutral-800">
        <div className="text-sm text-neutral-500 flex items-center">
          Built by <a href="https://dscribeai.com" target="_blank" className="font-medium ml-1 text-purple-700">dScribe AI</a>
        </div>
      </div>
    </div>
  );
}

function ChatMenuItem({ chat, isActive }: { chat: Chat; isActive: boolean }) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  
  const handleDelete = () => {
    router.delete(chatPath(chat.id));
  };

  return (
    <div 
      className={cn(
        "block px-2 py-1.5 rounded text-sm relative group",
        isActive 
          ? "bg-neutral-800 text-white" 
          : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
      )}
    >
      <Link 
        href={chatPath(chat.id)}
        className="flex flex-col overflow-hidden"
      >
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
      </Link>
      
      <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 p-0 text-neutral-400 hover:text-white hover:bg-neutral-700"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-40">
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem
                  onSelect={(e) => {
                    e.preventDefault();
                    setShowDeleteDialog(true);
                  }}
                  className="text-red-500 focus:text-red-500"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Chat</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete this chat? This action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-red-500 hover:bg-red-600">
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
} 