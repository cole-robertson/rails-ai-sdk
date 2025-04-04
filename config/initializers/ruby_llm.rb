require 'ruby_llm'

RubyLLM.configure do |config|
  credentials = Rails.application.credentials
  
  # Set API keys from Rails credentials
  config.openai_api_key = credentials.dig(:openai, :api_key)
  config.anthropic_api_key = credentials.dig(:anthropic, :api_key)
  config.gemini_api_key = credentials.dig(:gemini, :api_key)
  config.deepseek_api_key = credentials.dig(:deepseek, :api_key)
end 