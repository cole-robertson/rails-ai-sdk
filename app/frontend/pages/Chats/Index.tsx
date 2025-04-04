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
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Chats</h1>
        <Link 
          href={createChatPath()} 
          method="post" 
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          New Chat
        </Link>
      </div>
      
      <div className="space-y-4">
        {chats.length === 0 ? (
          <div className="text-center p-8 bg-gray-100 rounded">
            <p>No chats yet. Start a new conversation!</p>
          </div>
        ) : (
          chats.map(chat => (
            <Link
              key={chat.id}
              href={chatPath(chat.id)}
              className="block p-4 border rounded hover:bg-gray-50"
            >
              <div className="flex justify-between">
                <div>
                  <h3 className="font-medium text-lg">{chat.model_id || 'Chat'}</h3>
                  <p className="text-sm text-gray-500">
                    {new Date(chat.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="text-gray-700">
                  {chat.last_message_content || 'No messages yet'}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};

export default Index; 