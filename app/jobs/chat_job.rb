class ChatJob < ApplicationJob
  queue_as :default

  def perform(chat_id, message_content, user_id)
    chat = Chat.find(chat_id)
    
    # Create a temporary placeholder message for immediate feedback
    ActionCable.server.broadcast(
      "chat_#{chat_id}",
      {
        type: "message_start",
        message: {
          id: "temp_#{Time.now.to_i}",
          role: "assistant",
          content: "",
          created_at: Time.now
        }
      }
    )
    
    # Ask the question and stream the response
    chat.ask(message_content) do |chunk|
      ActionCable.server.broadcast(
        "chat_#{chat_id}",
        {
          type: "message_chunk",
          content: chunk.content
        }
      )
    end
    
    # When complete, send the final message with the real ID
    last_message = chat.messages.where(role: "assistant").order(created_at: :desc).first
    
    ActionCable.server.broadcast(
      "chat_#{chat_id}",
      {
        type: "message_complete",
        message: {
          id: last_message.id,
          role: last_message.role,
          content: last_message.content,
          created_at: last_message.created_at
        }
      }
    )
  end
end
