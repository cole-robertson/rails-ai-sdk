class ChatsController < ApplicationController
  # Enable streaming
  include ActionController::Live
  include AiSdkStreamAdapter
  
  # Skip CSRF protection for streaming endpoint
  skip_before_action :verify_authenticity_token, only: [:stream]
  before_action :set_headers, only: [:stream]
  before_action :set_chat, only: [:stream]

  # Required libraries
  require 'securerandom'
  
  def index
    chats = Chat.order(created_at: :desc)
    
    render inertia: "Chats/Index", props: {
      chats: chats.as_json(only: [:id, :model_id, :created_at], 
                           methods: [:last_message_content])
    }
  end

  def show
    chat = Chat.find(params[:id])
    messages = chat.messages.order(:created_at)
    
    render inertia: "Chats/Show", props: {
      chat: chat.as_json(only: [:id, :model_id, :created_at]),
      messages: messages.as_json(only: [:id, :role, :content, :created_at])
    }
  end

  def create
    chat = Chat.create!(model_id: params[:model_id] || 'gpt-4o-mini')
    
    redirect_to chat_path(chat)
  end
  
  def ask
    chat = Chat.find(params[:id])
    
    # Enqueue background job to handle AI request
    ChatJob.perform_later(chat.id, params[:message], current_user.id)
    
    # Return immediately with a placeholder response for Inertia
    render json: { status: "processing" }
  end
  
  def stream
    messages = JSON.parse(request.body.read)["messages"]
    
    # Get the user message
    user_message = messages.last
    user_message_content = user_message["content"]
    
    # Create the user message (needed for the LLM to have context)
    @chat.messages.create(role: user_message["role"], content: user_message_content)
    
    # Use the adapter concern to handle streaming
    with_ai_sdk_stream do |stream|
      @chat.ask(user_message_content) do |chunk|
        stream.write_text_chunk(chunk.content)
      end
    end
  end

  private

  # Set headers for Server-Sent Events (SSE) and AI SDK compatibility
  def set_headers
    response.headers['Content-Type'] = 'text/event-stream'
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Connection'] = 'keep-alive'
    response.headers['x-vercel-ai-data-stream'] = 'v1'
  end

  def set_chat
    @chat = Chat.find(params[:id])
  end
end
