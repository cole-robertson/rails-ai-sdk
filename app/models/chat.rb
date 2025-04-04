require 'ostruct'

class Chat < ApplicationRecord
  acts_as_chat
  
  # Add custom methods as needed
  def last_message_content
    last_message = messages.order(created_at: :desc).first
    return nil unless last_message
    
    # Truncate message if it's too long
    content = last_message.content.to_s
    content.length > 100 ? "#{content[0..100]}..." : content
  end
end 