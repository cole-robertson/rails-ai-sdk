# frozen_string_literal: true

class DashboardController < InertiaController
  def index
    redirect_to chats_path
  end
end
