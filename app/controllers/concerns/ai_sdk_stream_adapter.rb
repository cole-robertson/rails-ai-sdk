# Adapter for Vercel AI SDK data stream protocol
# Documentation: https://sdk.vercel.ai/docs/ai-sdk-ui/stream-protocol#data-stream-protocol
module AiSdkStreamAdapter
  extend ActiveSupport::Concern
  
  included do
    # Make sure ActionController::Live is included
    include ActionController::Live
  end
  
  # Sets the required headers for the AI SDK streaming protocol
  # This should be called before starting a stream
  def set_ai_sdk_headers
    response.headers['Content-Type'] = 'text/event-stream'
    response.headers['Cache-Control'] = 'no-cache'
    response.headers['Connection'] = 'keep-alive'
    response.headers['x-vercel-ai-data-stream'] = 'v1'
  end
  
  # Creates a new AI SDK stream and yields it to the block
  # The stream will be automatically closed after the block
  # 
  # @example Using with RubyLLM Chat
  #   with_ai_sdk_stream do |stream|
  #     @chat.ask(message_content) do |chunk|
  #       stream.write_text_chunk(chunk.content)
  #     end
  #   end
  #
  def with_ai_sdk_stream(stream = response.stream)
    # Set required headers
    set_ai_sdk_headers
    
    adapter = StreamHelper.new(stream)
    begin
      adapter.start_frame
      yield adapter if block_given?
      adapter.finish_stream
    rescue => e
      Rails.logger.error("AI SDK stream error: #{e.message}\n#{e.backtrace.join("\n")}")
      begin
        adapter.write_error(e.message)
        adapter.finish_stream_with_error
      rescue => nested_e
        Rails.logger.error("Failed to send error message: #{nested_e.message}")
      end
    ensure
      stream.close
    end
  end
  
  # Helper class that implements the Vercel AI SDK streaming protocol
  class StreamHelper
    require 'securerandom'
    
    def initialize(stream)
      @stream = stream
      @message_id = SecureRandom.uuid
    end
    
    # Start a new stream frame with a unique message ID
    def start_frame
      @stream.write "f:{\"messageId\":\"#{@message_id}\"}\n"
    end
    
    # Write a text chunk to the stream
    # Format: 0:string\n
    def write_text_chunk(text)
      return if text.nil? || text.empty?
      @stream.write "0:#{text.to_json}\n"
    end
    
    # Write an error message to the stream
    # Format: 3:string\n
    def write_error(error_message)
      @stream.write "3:#{error_message.to_json}\n"
    end
    
    # Write a data part (JSON object) to the stream
    # Format: 2:Array<JSONValue>\n
    def write_data(data)
      @stream.write "2:#{data.to_json}\n"
    end
    
    # Write a tool call part to the stream
    # Format: 9:{toolCallId:string; toolName:string; args:object}\n
    def write_tool_call(tool_call_id, tool_name, args)
      tool_call = {
        toolCallId: tool_call_id, 
        toolName: tool_name, 
        args: args
      }
      @stream.write "9:#{tool_call.to_json}\n"
    end
    
    # Write a tool result part to the stream
    # Format: a:{toolCallId:string; result:object}\n
    def write_tool_result(tool_call_id, result)
      tool_result = {
        toolCallId: tool_call_id, 
        result: result
      }
      @stream.write "a:#{tool_result.to_json}\n"
    end
    
    # Finish the stream with success status
    def finish_stream
      # Send the end message with finish reason
      # Format: e:{finishReason:string; usage:{promptTokens:number; completionTokens:number}, isContinued:boolean}\n
      @stream.write "e:{\"finishReason\":\"stop\",\"usage\":{\"promptTokens\":0,\"completionTokens\":0},\"isContinued\":false}\n"
      
      # Send the finish message part
      # Format: d:{finishReason:string; usage:{promptTokens:number; completionTokens:number}}\n
      @stream.write "d:{\"finishReason\":\"stop\",\"usage\":{\"promptTokens\":0,\"completionTokens\":0}}\n"
    end
    
    # Finish the stream with error status
    def finish_stream_with_error
      # Send the end message with error reason
      @stream.write "e:{\"finishReason\":\"error\",\"usage\":{\"promptTokens\":0,\"completionTokens\":0},\"isContinued\":false}\n"
      
      # Send the finish message part with error reason
      @stream.write "d:{\"finishReason\":\"error\",\"usage\":{\"promptTokens\":0,\"completionTokens\":0}}\n"
    end
  end
end 