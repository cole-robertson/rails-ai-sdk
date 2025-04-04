# frozen_string_literal: true

class HomeController < InertiaController
  skip_before_action :authenticate
  before_action :perform_authentication

  def index
    # If user is authenticated, redirect to chats
    if Current.user.present?
      if Chat.exists?
        redirect_to chats_path
      else
        # Create new chat and redirect to it
        chat = Chat.create!(model_id: 'gpt-4o-mini')
        redirect_to chat_path(chat)
      end
    else
      render inertia: "Home", props: {
        has_chats: Chat.exists?
      }
    end
  end
end
