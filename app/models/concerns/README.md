# Tool Streaming Feedback Concern

This concern provides automatic streaming feedback for RubyLLM Tools. It wraps the tool execution logic with standardized stream communication.

## Usage

1. Include the concern in your RubyLLM::Tool class:

```ruby
class MyTool < RubyLLM::Tool
  include ToolStreamingFeedback
  
  description "My custom tool description"
  
  param :parameter1, desc: "Parameter description", required: true
  # ...other parameters...
  
  def perform(**args)
    # Implement your tool logic here
    # This replaces the normal `execute` method
    
    # Return the result as a hash or other serializable object
    { result: "Success", data: some_data }
    
    # Or return an error
    { error: "Something went wrong" }
  end
end
```

## How It Works

The concern:
1. Provides a standard `initialize(stream)` method that stores the stream
2. Implements the `execute(**args)` method required by RubyLLM
3. Automatically generates a unique tool_call_id
4. Writes the tool call to the stream at the beginning of execution
5. Calls your `perform` method and captures the result
6. Writes the result to the stream
7. Handles errors automatically

## Benefits

- Keep your tool implementations clean and focused on core logic
- Standardize error handling and stream communication
- Remove boilerplate code from individual tool classes 