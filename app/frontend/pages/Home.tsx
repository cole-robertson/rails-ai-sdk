import React from 'react';
import { Link } from '@inertiajs/react';
import { chatsPath, chatsPath as createChatPath } from '@/routes';

interface HomeProps {
  has_chats: boolean;
}

const Home: React.FC<HomeProps> = ({ has_chats }) => {
  return (
    <div className="min-h-screen bg-gray-100 text-gray-900 p-6">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 text-blue-700">Inertia AI Chat</h1>
        
        <div className="bg-white p-8 rounded-lg shadow-lg border border-gray-200">
          <h2 className="text-2xl font-semibold mb-5 text-gray-800">Welcome to your AI Chat Assistant</h2>
          <p className="mb-6 text-lg text-gray-700">
            Start a conversation with AI models like GPT-4 and Claude using RubyLLM integration.
          </p>
          
          <div className="flex gap-4 mt-8">
            <Link
              href={chatsPath()}
              className="px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 shadow-sm transition-colors"
            >
              {has_chats ? 'View Your Chats' : 'Start Chatting'}
            </Link>
            
            <Link
              href={createChatPath()}
              method="post"
              className="px-6 py-3 border-2 border-blue-600 text-blue-700 font-medium rounded-lg hover:bg-blue-50 transition-colors"
            >
              New Chat
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home; 