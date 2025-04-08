class Message < ApplicationRecord
  require 'securerandom'
  
  acts_as_message
  
  has_many :tool_calls, dependent: :destroy
  
  def self.to_ai_sdk_format(messages)
    formatted_messages = []
    i = 0
    
    while i < messages.length
      current_message = messages[i]
      
      case current_message.role
      when "user"
        # Format user message
        formatted_message = {
          "id" => current_message.id.to_s,
          "createdAt" => current_message.created_at.utc.iso8601,
          "role" => "user",
          "content" => current_message.content,
          "parts" => [
            {
              "type" => "text",
              "text" => current_message.content
            }
          ]
        }
        formatted_messages << formatted_message
        i += 1
        
      when "assistant"
        # Check if the assistant message has tool calls
        tool_calls_data = current_message.tool_calls.to_a
        
        if tool_calls_data.present?
          # This assistant message has tool calls
          tool_call = tool_calls_data.first
          
          # Find the next message, which might be a tool result
          next_message = i + 1 < messages.length ? messages[i + 1] : nil
          tool_result = nil
          message_content = current_message.content
          
          # If the next message is a tool result, use its content
          if next_message && next_message.role == "tool"
            # Parse tool result data from content
            begin
              tool_result = JSON.parse(next_message.content.gsub(/=>/, ':'))
            rescue
              # If parsing fails, use as-is
              tool_result = next_message.content
            end
          end
          
          # Check for a subsequent assistant message that contains text content
          next_text_message = nil
          if next_message && next_message.role == "tool" && i + 2 < messages.length && messages[i + 2].role == "assistant"
            next_text_message = messages[i + 2]
            if next_text_message.content.present?
              message_content = next_text_message.content
            end
          end
          
          # Create tool invocation structure
          tool_invocation = {
            "state" => "result",
            "step" => 0,
            "toolCallId" => tool_call.tool_call_id || SecureRandom.uuid,
            "toolName" => tool_call.name || "unknown",
            "args" => tool_call.arguments.is_a?(Hash) ? tool_call.arguments : JSON.parse(tool_call.arguments.to_s),
            "result" => tool_result
          }
          
          # Format assistant message with tool invocation
          formatted_message = {
            "id" => current_message.id.to_s,
            "createdAt" => current_message.created_at.utc.iso8601,
            "role" => "assistant",
            "content" => message_content,
            "parts" => [
              { "type" => "step-start" },
              { 
                "type" => "tool-invocation",
                "toolInvocation" => tool_invocation
              },
              {
                "type" => "text",
                "text" => message_content
              }
            ],
            "toolInvocations" => [tool_invocation],
            "revisionId" => SecureRandom.hex(8)
          }
          
          formatted_messages << formatted_message
          
          # Skip the tool message and the subsequent assistant message if it exists
          if next_message && next_message.role == "tool"
            i += next_text_message ? 3 : 2
          else
            i += 1
          end
        else
          # Regular assistant message without tools
          formatted_message = {
            "id" => current_message.id.to_s,
            "createdAt" => current_message.created_at.utc.iso8601,
            "role" => "assistant",
            "content" => current_message.content,
            "parts" => [
              {
                "type" => "text",
                "text" => current_message.content
              }
            ]
          }
          
          formatted_messages << formatted_message
          i += 1
        end
      when "tool"
        # If we encounter a tool message directly, check if it was missed by the logic above
        # This can happen if the association between assistant and tool messages isn't captured
        if i > 0 && messages[i-1].role == "assistant"
          # We've already processed this as part of the previous assistant message
          i += 1
        else
          # This is an orphaned tool message
          # Just skip it since tool messages aren't displayed directly in AI SDK
          i += 1
        end
      else
        # Skip any other message types
        i += 1
      end
    end
    
    formatted_messages
  end
end 