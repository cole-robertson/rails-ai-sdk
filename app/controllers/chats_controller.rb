class ChatsController < ApplicationController
  # Enable streaming
  include ActionController::Live
  
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
    begin
      messages = JSON.parse(request.body.read)["messages"]
      
      message_id = SecureRandom.uuid
      
      # Get the user message
      user_message = messages.last
      user_message_content = user_message["content"]
      
      # Create the user message (needed for the LLM to have context)
      @chat.messages.create(role: user_message["role"], content: user_message_content)
      
      # Start streaming with the exact format from the Vercel example
      # First message is the frame message with messageId
      response.stream.write "f:{\"messageId\":\"#{message_id}\"}\n"
      
      # Accumulate the complete response for saving later
      complete_response = ""
      
      # Now stream the chunks
      @chat.ask(user_message_content) do |chunk|
        # Skip empty content
        next if chunk.nil? || chunk.try(:content).nil?
        delta_text = chunk.content.to_s
        next if delta_text.empty?
        
        # Add to the complete response
        complete_response += delta_text
        
        # Send the chunk to the client with the proper text format
        response.stream.write "0:#{delta_text.to_json}\n"
      end
      
      # Create the assistant message in the database with the complete response
      @chat.messages.create(role: 'assistant', content: complete_response)
      
      # Send the end message with finish reason
      response.stream.write "e:{\"finishReason\":\"stop\",\"usage\":{\"promptTokens\":0,\"completionTokens\":0},\"isContinued\":false}\n"
      # Send the finish message part
      response.stream.write "d:{\"finishReason\":\"stop\",\"usage\":{\"promptTokens\":0,\"completionTokens\":0}}\n"
      
    rescue => e
      # Log the error for debugging
      Rails.logger.error("Chat streaming error: #{e.message}\n#{e.backtrace.join("\n")}")
      
      # Send error message in the proper format (type 3)
      begin
        response.stream.write "3:#{e.message.to_json}\n"
        # Still send finish messages with error reason
        response.stream.write "e:{\"finishReason\":\"error\",\"usage\":{\"promptTokens\":0,\"completionTokens\":0},\"isContinued\":false}\n"
        response.stream.write "d:{\"finishReason\":\"error\",\"usage\":{\"promptTokens\":0,\"completionTokens\":0}}\n"
      rescue => nested_e
        Rails.logger.error("Failed to send error message: #{nested_e.message}")
      end
    ensure
      # Always close the stream
      response.stream.close
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
