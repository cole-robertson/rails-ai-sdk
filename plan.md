Below is a detailed Markdown document outlining the final plan for integrating a Rails backend with streaming responses using RubyLLM, the AI SDK on the frontend with React, and Inertia.js for seamless page rendering. This plan includes setup instructions, code examples, and explanations tailored to your specific requirements.
Final Plan: Rails Streaming with RubyLLM, AI SDK, and Inertia.js Setup
This document outlines a complete setup for a chat application using Rails as the backend with RubyLLM for streaming responses, React with the AI SDK on the frontend, and Inertia.js for server-driven page rendering. The goal is to create a real-time chat interface where users can send messages, and the backend streams AI-generated responses back to the frontend.
Overview
Backend: Rails API with RubyLLM for streaming LLM responses.
Frontend: React with the AI SDK (useChat hook) for managing chat state and streaming.
Framework: Inertia.js for server-side rendering and navigation.
Communication: Rails serves Inertia pages and a separate streaming API endpoint (/api/chat).
Backend Setup (Rails with RubyLLM)
Prerequisites
Ruby 3.x and Rails 7.x installed.
RubyLLM gem installed (assumed available; adjust based on actual gem name).
Step 1: Create Rails Project
bash
rails new chat-app --api --skip-javascript
cd chat-app
Step 2: Install Dependencies
Add gems to Gemfile:
ruby
gem 'inertia_rails'
gem 'ruby_llm' # Replace with actual gem name if different
Install:
bash
bundle install
Step 3: Configure Inertia.js
Run the Inertia setup command:
bash
rails g inertia:install react
This sets up Inertia with React support.
Step 4: Define Routes
In config/routes.rb:
ruby
Rails.application.routes.draw do
  # Inertia page route
  root 'pages#chat'

  # API endpoint for streaming chat
  namespace :api do
    post 'chat', to: 'chat#create'
  end
end
Step 5: Create Pages Controller
In app/controllers/pages_controller.rb:
ruby
class PagesController < ApplicationController
  def chat
    render inertia: 'ChatPage', props: { initialMessage: 'Welcome to the chat!' }
  end
end
Step 6: Create Chat API Controller
In app/controllers/api/chat_controller.rb:
ruby
require 'securerandom'

class Api::ChatController < ApplicationController
  # Skip CSRF for API endpoint since it's streaming
  skip_before_action :verify_authenticity_token, only: [:create]

  def create
    # Set headers for Server-Sent Events (SSE) and AI SDK compatibility
    response.headers['Content-Type'] = 'text/event-stream'
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['x-vercel-ai-data-stream'] = 'v1'

    # Initialize RubyLLM Chat
    chat = RubyLLM::Chat.new(model_id: 'gpt-4o-mini') # Adjust model ID as needed

    # Populate chat history from request
    chat.messages = params[:messages].map do |msg|
      RubyLLM::Message.new(role: msg[:role], content: msg[:content])
    end

    # Generate a unique message ID
    message_id = SecureRandom.uuid

    # Stream response
    self.response_body = Enumerator.new do |yielder|
      # Stream message-start event
      yielder << "data: #{JSON.dump({
        type: 'message-start',
        message: { id: message_id, role: 'assistant', content: '' }
      })}\n\n"

      # Stream text deltas from RubyLLM
      chat.ask do |chunk|
        yielder << "data: #{JSON.dump({
          type: 'text-delta',
          'text-delta': chunk.content
        })}\n\n"
      end

      # Stream message-stop event
      yielder << "data: #{JSON.dump({ type: 'message-stop' })}\n\n"
    end
  rescue StandardError => e
    # Stream error event if something fails
    self.response_body = Enumerator.new do |yielder|
      yielder << "data: #{JSON.dump({ type: 'error', error: e.message })}\n\n"
    end
  end
end
Step 7: Configure RubyLLM (Optional)
If RubyLLM requires API keys or configuration, add an initializer in config/initializers/ruby_llm.rb:
ruby
RubyLLM.configure do |config|
  config.api_key = ENV['RUBYLLM_API_KEY']
end
Step 8: Start Rails Server
bash
rails server
Runs on http://localhost:3000.
Frontend Setup (React with AI SDK and Inertia.js)
Prerequisites
Node.js and npm/yarn installed.
Step 1: Install AI SDK
In the Rails project root:
bash
npm install ai
# or
yarn add ai
Step 2: Create Chat Page Component
In app/javascript/Pages/ChatPage.jsx:
jsx
import { useChat } from 'ai/react';

export default function ChatPage({ initialMessage }) {
  const { messages, input, handleInputChange, handleSubmit } = useChat({
    api: '/api/chat', // Relative URL to Rails API endpoint
  });

  return (
    <div style={{ maxWidth: '600px', margin: '20px auto' }}>
      <h1>Chat with AI</h1>
      <p>{initialMessage}</p>
      <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
        {messages.map((msg, index) => (
          <div
            key={index}
            style={{
              margin: '10px 0',
              padding: '8px',
              borderRadius: '4px',
              backgroundColor: msg.role === 'user' ? '#e3f2fd' : '#f5f5f5',
              textAlign: msg.role === 'user' ? 'right' : 'left',
            }}
          >
            <strong>{msg.role === 'user' ? 'You' : 'AI'}:</strong> {msg.content}
          </div>
        ))}
      </div>
      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', gap: '10px', marginTop: '20px' }}
      >
        <input
          value={input}
          onChange={handleInputChange}
          placeholder="Type your message..."
          style={{ flexGrow: 1, padding: '8px' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>
          Send
        </button>
      </form>
    </div>
  );
}
Step 3: Update Inertia Entry Point
Ensure app/javascript/app.jsx (or similar) is set up correctly by the Inertia installer. It should look like:
jsx
import { createRoot } from 'react-dom/client';
import { createInertiaApp } from '@inertiajs/react';

createInertiaApp({
  resolve: (name) => {
    const pages = import.meta.glob('./Pages/**/*.jsx', { eager: true });
    return pages[`./Pages/${name}.jsx`];
  },
  setup({ el, App, props }) {
    createRoot(el).render(<App {...props} />);
  },
});
Step 4: Compile Assets
Run the asset compilation:
bash
npm run dev
# or
yarn dev
How It Works
User Interaction:
Visit http://localhost:3000 (root route).
The PagesController#chat action renders the ChatPage component via Inertia.js.
User types a message and submits the form.
Frontend Processing:
The useChat hook sends a POST request to /api/chat with the messages array (conversation history).
It listens for streaming responses and updates the UI incrementally.
Backend Processing:
The Api::ChatController#create action receives the request.
RubyLLM generates a streaming response based on the chat history.
Responses are streamed back as SSE with AI SDK-compatible events:
message-start
text-delta (for each chunk)
message-stop
Result:
The chat UI displays messages in real-time as they stream from the backend.
Example Interaction
User: Types "Hello, how are you?" and submits.
Request: POST /api/chat with messages: [{ role: 'user', content: 'Hello, how are you?' }].
Response Stream:
data: {"type": "message-start", "message": {"id": "uuid", "role": "assistant", "content": ""}}
data: {"type": "text-delta", "text-delta": "Hi! "}
data: {"type": "text-delta", "text-delta": "I'm doing great, "}
data: {"type": "text-delta", "text-delta": "thanks for asking!"}
data: {"type": "message-stop"}
UI: Displays "You: Hello, how are you?" followed by "AI: Hi! I'm doing great, thanks for asking!" incrementally.
Additional Notes
CSRF: The skip_before_action ensures the streaming endpoint works without CSRF issues, which is fine for an API but consider security in production (e.g., API token authentication).
RubyLLM: Adjust the chat.ask call if it requires a prompt instead of using message history implicitly.
Production: Use a server like Puma that supports streaming, and configure CORS if deploying frontend and backend on separate domains.
Styling: The inline styles in ChatPage.jsx are basic; enhance with CSS modules or a library like Tailwind CSS.
This plan provides a fully functional setup for your chat application with Rails, RubyLLM, the AI SDK, and Inertia.js. Let me know if you need further adjustments or have specific RubyLLM details to refine the implementation!