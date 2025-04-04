import React from 'react';
import { Link } from '@inertiajs/react';
import { chatsPath as createChatPath, chatPath } from '@/routes';

interface Chat {
  id: number;
  model_id: string;
  created_at: string;
  last_message_content: string | null;
}

interface IndexProps {
  chats: Chat[];
}

const Index: React.FC<IndexProps> = ({ chats }) => {
  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Your Conversations</h1>
          <Link 
            href={createChatPath()} 
            method="post" 
            className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
          >
            New Chat
          </Link>
        </div>
        
        <div className="space-y-4">
          {chats.length === 0 ? (
            <div className="text-center p-12 bg-white rounded-lg shadow border border-gray-200">
              <h3 className="text-xl font-medium text-gray-700 mb-2">No chats yet</h3>
              <p className="text-gray-600 mb-6">Start your first conversation with AI!</p>
              <Link 
                href={createChatPath()} 
                method="post" 
                className="px-5 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 inline-block"
              >
                Start a New Chat
              </Link>
            </div>
          ) : (
            chats.map(chat => (
              <Link
                key={chat.id}
                href={chatPath(chat.id)}
                className="block p-5 bg-white border border-gray-200 rounded-lg hover:bg-blue-50 transition-colors shadow-sm"
              >
                <div className="flex justify-between">
                  <div>
                    <h3 className="font-semibold text-lg text-gray-900">{chat.model_id || 'Chat'}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {new Date(chat.created_at).toLocaleString()}
                    </p>
                  </div>
                  <div className="text-gray-800 max-w-md truncate">
                    {chat.last_message_content ? (
                      <span className="truncate block">{chat.last_message_content}</span>
                    ) : (
                      <span className="text-gray-500 italic">No messages yet</span>
                    )}
                  </div>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Index; 