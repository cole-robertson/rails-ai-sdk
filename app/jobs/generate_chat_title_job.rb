class GenerateChatTitleJob < ApplicationJob
  queue_as :default

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

    first_message = chat.messages.where(role: 'user').order(created_at: :asc).first
    return unless first_message

    title_generator = RubyLLM.chat.with_instructions(GENERATE_TITLE_PROMPT)
    
    # Generate the title using the first message
    response = title_generator.ask(first_message.content)
    
    title = response.content.strip
    chat.update!(title:)

    ActionCable.server.broadcast("chat_#{chat.id}", { 
      chat_id: chat.id,
      title: title 
    })
  end
end
