class ChatChannel < ApplicationCable::Channel
  def subscribed
    stop_all_streams
    
    if params[:id].present?
      stream_from "chat_#{params[:id]}"
    elsif params[:chat_id].present?
      stream_from "chat_#{params[:chat_id]}"
    end
  end

  def unsubscribed
    stop_all_streams
  end
end
