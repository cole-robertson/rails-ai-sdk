require 'net/http'
require 'json'
require 'uri'
require 'securerandom'

class Weather < RubyLLM::Tool
  description "Gets current weather for a location based on latitude and longitude"
  param :latitude, type: :number, desc: "Latitude coordinate", required: true
  param :longitude, type: :number, desc: "Longitude coordinate", required: true
  param :temperature_unit, type: :string, desc: "Temperature unit (celsius or fahrenheit) default is fahrenheit", required: true

  def initialize(stream)
    @stream = stream
  end

  def execute(latitude:, longitude:, temperature_unit: 'fahrenheit')
    uri = URI("https://api.open-meteo.com/v1/forecast?latitude=#{latitude}&longitude=#{longitude}&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto&temperature_unit=#{temperature_unit}")
    
    response = Net::HTTP.get_response(uri)
    
    if response.is_a?(Net::HTTPSuccess)
      weather_data = JSON.parse(response.body)
      
      # Notify the stream about the tool call and its result
      # Assuming the stream needs the tool call info before returning the final result.
      # Adjust the arguments and result structure as needed for your specific LLM integration.
      tool_call_id = SecureRandom.uuid # Generate a unique ID for the tool call
      @stream.write_tool_call(tool_call_id, 'weather', { latitude: latitude, longitude: longitude, temperature_unit: temperature_unit })
      @stream.write_tool_result(tool_call_id, weather_data) 

      # Return the parsed data, or format a specific string if preferred.
      # Example: Extracting current temperature
      # current_temp = weather_data.dig('current', 'temperature_2m')
      # unit_symbol = temperature_unit == 'fahrenheit' ? '°F' : '°C' # Get correct unit symbol
      # return "Current temperature is #{current_temp}#{unit_symbol}"
      
      return "Weather data fetched successfully" # Return the full parsed JSON data
    else
      # Handle API errors (e.g., log the error, return an error message)
      # For now, returning a simple error string.
      error_message = "Failed to fetch weather data: #{response.code} #{response.message}"
      @stream.write_text_chunk(error_message) # Or handle errors differently
      return error_message 
    end
  end
end