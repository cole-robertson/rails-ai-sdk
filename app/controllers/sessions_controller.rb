# frozen_string_literal: true

class SessionsController < InertiaController
  skip_before_action :authenticate, only: %i[ new create ]
  before_action :require_no_authentication, only: %i[ new create ]
  before_action :set_session, only: :destroy

  def index
    @sessions = Current.user.sessions.order(created_at: :desc)
  end

  def new
  end

  def create
    if user = User.authenticate_by(email: params[:email], password: params[:password])
      @session = user.sessions.create!
      cookies.signed.permanent[:session_token] = {value: @session.id, httponly: true}

      # Check if user has any chats, redirect to index if they do, create a new one if not
      if Chat.exists?
        redirect_to chats_path, notice: "Signed in successfully"
      else
        # Create new chat and redirect to it
        chat = Chat.create!(model_id: 'gpt-4o-mini')
        redirect_to chat_path(chat), notice: "Signed in successfully"
      end
    else
      redirect_to sign_in_path, alert: "That email or password is incorrect"
    end
  end

  def destroy
    @session.destroy!
    Current.session = nil
    redirect_to settings_sessions_path, notice: "That session has been logged out", inertia: {clear_history: true}
  end

  private

  def set_session
    @session = Current.user.sessions.find(params[:id])
  end
end
