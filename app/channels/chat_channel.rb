class ChatChannel < ApplicationCable::Channel
  def subscribed
    stop_all_streams
    
    if params[:chat_id].present?
      stream_from "chat_#{params[:chat_id]}"
    end
  end

  def unsubscribed
    stop_all_streams
  end
end
