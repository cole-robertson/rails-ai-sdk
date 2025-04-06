class GenerateChatTitleJob < ApplicationJob
  queue_as :default

  retry_on StandardError, wait: :exponentially_longer, attempts: 3

  GENERATE_TITLE_PROMPT = <<~PROMPT
    You will generate a short title based on the first message a user begins a conversation with. 
    Ensure it is not more than 80 characters long. 
    The title should be a summary of the user's message. 
    Do not use quotes or colons. 
    Return only the title text with no additional explanation.
  PROMPT

  def perform(chat_id)
    chat = Chat.find_by(id: chat_id)
    return unless chat
    return if chat.title.present?

    first_message = first_message(chat)
    return unless first_message

    # Generate the title using the first message
    response = title_generator.ask(first_message.content)
    title = response.content.strip

    chat.update!(title:)
    broadcast_title_update(chat, title)
  end

  private

  def title_generator
    @title_generator ||= RubyLLM.chat.with_instructions(GENERATE_TITLE_PROMPT)
  end

  def first_message(chat)
    chat.messages.where(role: 'user').order(created_at: :asc).first
  end
  
  def broadcast_title_update(chat, title)
    ActionCable.server.broadcast("chat_#{chat.id}", { 
      chat_id: chat.id,
      title: title 
    })
  end
end
