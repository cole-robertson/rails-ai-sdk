class ChatsController < ApplicationController
  include AiSdkStreamAdapter
  
  before_action :set_chat, only: [:show, :stream, :destroy]

  def index
    @chat = next_chat
    redirect_to chat_path(@chat)
  end

  def show
    messages = @chat.messages.order(:created_at)
    all_chats = Current.user.chats.order(created_at: :desc)
    
    render inertia: "Chats/Show", props: {
      chat: ChatSerializer.one(@chat),
      messages: Message.to_ai_sdk_format(messages),
      allChats: ChatSerializer.many(all_chats)
    }
  end

  def create
    chat = Chat.create!(
      model_id: params[:model_id] || 'gpt-4o-mini',
      user: Current.user
    )
    
    redirect_to chat_path(chat)
  end
  
  def stream
    messages = JSON.parse(request.body.read)["messages"]
    
    user_message = messages.last
    user_message_content = user_message["content"]

    with_ai_sdk_stream do |stream|
      weather_tool = Weather.new(stream)
      transcribe_tool = Transcribe.new(stream)

      @chat.with_tools(weather_tool, transcribe_tool)
      
      @chat.ask(user_message_content) do |chunk|
        puts "Chunk: #{chunk}"
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
    @chat = Current.user.chats.find(params[:id])
  end

  def next_chat
    query = Current.user.chats.order(created_at: :desc)
    query = query.where.not(id: @chat.id) if @chat.present?
    
    query.first || Chat.create!(model_id: 'gpt-4o-mini', user: Current.user)
  end
end
