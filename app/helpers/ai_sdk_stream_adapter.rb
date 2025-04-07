require 'securerandom'

module AiSdkStreamAdapter
  class StreamWriter
    def initialize(response)
      @response = response
      @sequence_id = 0
      @message_id = SecureRandom.hex(8)
      @start_time = Time.now.utc
    end

    def write_text_chunk(text)
      data = {
        id: @message_id,
        role: "assistant",
        createdAt: @start_time.iso8601,
        content: text,
        parts: [
          { type: "text", text: text }
        ]
      }
      
      write_chunk(data)
    end
    
    def write_tool_call(tool_call_id, tool_name, args)
      data = {
        id: @message_id,
        role: "assistant",
        createdAt: @start_time.iso8601,
        parts: [
          { type: "step-start" },
          { 
            type: "tool-invocation",
            toolInvocation: {
              state: "calling",
              step: 0,
              toolCallId: tool_call_id,
              toolName: tool_name,
              args: args
            }
          }
        ]
      }
      
      write_chunk(data)
    end
    
    def write_tool_result(tool_call_id, result)
      data = {
        id: @message_id,
        role: "assistant", 
        createdAt: @start_time.iso8601,
        parts: [
          { type: "step-start" },
          { 
            type: "tool-invocation",
            toolInvocation: {
              state: "result",
              step: 0,
              toolCallId: tool_call_id,
              result: result
            }
          }
        ]
      }
      
      write_chunk(data)
    end
    
    private
    
    def write_chunk(data)
      response_chunk = {
        sequence: @sequence_id,
        data: data
      }
      
      @sequence_id += 1
      
      # Write to the response stream
      @response.write("#{response_chunk.to_json}\n")
    end
  end
  
  def with_ai_sdk_stream
    # Set headers for streaming
    response.headers['Content-Type'] = 'text/plain; charset=utf-8'
    response.headers['Transfer-Encoding'] = 'chunked'
    response.headers['X-Accel-Buffering'] = 'no'

    # Create a new stream writer
    stream = StreamWriter.new(response)
    
    # Yield the stream to the caller
    yield(stream)
    
    # Make sure the response is complete
    response.stream.close
  end
end 