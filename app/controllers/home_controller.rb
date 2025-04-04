# frozen_string_literal: true

class HomeController < InertiaController
  skip_before_action :authenticate
  before_action :perform_authentication

  def index
    render inertia: "Home", props: {
      has_chats: Chat.exists?
    }
  end
end
