module ToolStreamingFeedback
  extend ActiveSupport::Concern

  included do
    attr_accessor :stream
  end

  def initialize(stream)
    @stream = stream
  end

  # Override this method in your tool to implement core logic
  def perform(**args)
    raise NotImplementedError, "#{self.class} must implement #perform"
  end

  # This is the method called by RubyLLM
  def execute(**args)
    tool_call_id = SecureRandom.uuid
    
    # Write the tool call to the stream
    @stream.write_tool_call(tool_call_id, self.class.name.underscore, args)
    
    # Call the core implementation
    result = begin
      perform(**args)
    rescue StandardError => e
      { error: "Tool execution failed: #{e.message}" }
    end
    
    # Write the result to the stream
    @stream.write_tool_result(tool_call_id, result)
    
    # Return the result to the LLM
    result
  end
end 