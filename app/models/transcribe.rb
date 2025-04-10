require 'faraday'
require 'json'

class Transcribe < RubyLLM::Tool
  include ToolStreamingFeedback
  
  description "Transcribes videos from URLs using dScribe AI"
  
  param :post_url, desc: "URL of the video/post to transcribe", required: true

  def perform(post_url:)
    payload = {
      post_url:
    }

    begin
      # Make API request to dScribe
      response = Faraday.post(dscribe_api_url) do |req|
        req.headers['Content-Type'] = 'application/json'
        req.headers['Authorization'] = "Bearer #{api_token}"
        req.body = payload.to_json
      end

      case response.status
      when 200
        begin
          result = JSON.parse(response.body)
          # Format the response for better readability
          format_transcription_result(result)
        rescue JSON::ParserError => e
          { error: "Failed to parse dScribe API response: #{e.message}" }
        end
      when 429
        { error: "API request failed (Status #{response.status}): Rate limit likely exceeded. Please try again later." }
      when 404
        { error: "Video not found or couldn't be transcribed." }
      when 400
        { error: "Bad request: #{response.body}" }
      else
        { error: "dScribe API error: #{response.status} - #{response.body}" }
      end
    rescue Faraday::Error => e
      { error: "dScribe API request failed: #{e.message}" }
    end
  end

  private

  def dscribe_api_url
    "https://api.scribesocial.ai/v1/transcribe?includeMetadata=true"
  end

  def api_token
    ENV['DSCRIBE_API_TOKEN'] || Rails.application.credentials.dscribe_ai[:api_key] || raise("DSCRIBE_API_TOKEN environment variable is not set")
  end

  def format_transcription_result(result)
    if result["markdown"].present?
      resultData = result["data"][0]
      {
        markdown: result["markdown"],
        comment_count: resultData["metadata"]["comment_count"],
        like_count: resultData["metadata"]["like_count"],
        retweet_count: resultData["metadata"]["retweet_count"],
        quote_count: resultData["metadata"]["quote_count"],
        thumbnail: resultData["metadata"]["thumbnail"],
        upload_time: resultData["metadata"]["upload_time"],
        title: resultData["title"],
        total_duration: resultData["total_duration"],
        video_url: resultData["video_url"],
      }
    else
      {
        error: "No transcription available"
      }
    end
  end
end 