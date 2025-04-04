class ChatsController < ApplicationController
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
end
