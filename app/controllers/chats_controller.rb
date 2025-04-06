class ChatsController < ApplicationController
  include AiSdkStreamAdapter
  
  before_action :set_chat, only: [:show, :stream, :destroy]

  def index
    chats = Chat.order(created_at: :desc)
    
    render inertia: "Chats/Index", props: {
      chats: chats.as_json(only: [:id, :model_id, :created_at, :title], 
                           methods: [:last_message_content])
    }
  end

  def show
    messages = @chat.messages.order(:created_at)
    all_chats = Chat.order(created_at: :desc)
    
    render inertia: "Chats/Show", props: {
      chat: @chat.as_json(only: [:id, :model_id, :created_at, :title]),
      messages: messages.as_json(only: [:id, :role, :content, :created_at]),
      allChats: all_chats.as_json(only: [:id, :model_id, :created_at, :title], 
                                  methods: [:last_message_content])
    }
  end

  def create
    chat = Chat.create!(model_id: params[:model_id] || 'gpt-4o-mini')
    
    redirect_to chat_path(chat)
  end
  
  def stream
    messages = JSON.parse(request.body.read)["messages"]
    
    # Get the user message
    user_message = messages.last
    user_message_content = user_message["content"]
    
    # Use the adapter concern to handle streaming
    with_ai_sdk_stream do |stream|
      @chat.ask(user_message_content) do |chunk|
        stream.write_text_chunk(chunk.content)
      end
    end
  end

  def destroy
    @chat.destroy

    redirect_to chat_path(next_chat), notice: "Chat was successfully deleted."
  end

  private

  def set_chat
    @chat = Chat.find(params[:id])
  end

  def next_chat
    Chat.where.not(id: @chat.id).order(created_at: :desc).first || Chat.create!(model_id: 'gpt-4o-mini')
  end
end
