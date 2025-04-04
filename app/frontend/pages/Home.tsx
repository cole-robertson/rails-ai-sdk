import React from 'react';
import { Link } from '@inertiajs/react';
import { chatsPath, chatsPath as createChatPath } from '@/routes';

interface HomeProps {
  has_chats: boolean;
}

const Home: React.FC<HomeProps> = ({ has_chats }) => {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Inertia AI Chat</h1>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-semibold mb-4">Welcome to your AI Chat Assistant</h2>
        <p className="mb-4">
          Start a conversation with AI models like GPT-4 and Claude using RubyLLM integration.
        </p>
        
        <div className="flex gap-4 mt-6">
          <Link
            href={chatsPath()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            {has_chats ? 'View Your Chats' : 'Start Chatting'}
          </Link>
          
          <Link
            href={createChatPath()}
            method="post"
            className="px-4 py-2 border border-blue-600 text-blue-600 rounded hover:bg-blue-50"
          >
            New Chat
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home; 