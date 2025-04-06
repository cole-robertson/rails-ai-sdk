class Chat < ApplicationRecord
  acts_as_chat
  
  has_many :messages, after_add: :check_for_title_generation
  
  def last_message_content
    last_message = messages.order(created_at: :desc).first
    return nil unless last_message
    
    # Truncate message if it's too long
    content = last_message.content.to_s
    content.length > 100 ? "#{content[0..100]}..." : content
  end
  
  private
  
  def check_for_title_generation(message)
    return unless message.role == 'user'
    return unless title.blank?
    return unless first_user_message?(message)
    
    GenerateChatTitleJob.perform_later(id)
  end
  
  def first_user_message?(message)
    messages.where(role: 'user').count == 1
  end
end