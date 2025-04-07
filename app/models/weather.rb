require 'faraday'
require 'json'
require 'securerandom'

class Weather < RubyLLM::Tool
  description "Gets current weather for a location based on latitude and longitude"
  # Simplified param descriptions, type/required handled by validation
  param :latitude, desc: "Latitude (e.g., 52.5200)", required: true
  param :longitude, desc: "Longitude (e.g., 13.4050)", required: true
  param :temperature_unit, desc: "Temperature unit (fahrenheit or celsius), assume fahrenheit if not specified by the user"

  def initialize(stream)
    @stream = stream
  end

  def execute(latitude:, longitude:, temperature_unit: 'fahrenheit')
    # Validate inputs first
    validation_error = validate_coordinates(latitude, longitude) || validate_temperature_unit(temperature_unit)
    
    tool_call_id = SecureRandom.uuid
    arguments = { latitude: latitude, longitude: longitude, temperature_unit: temperature_unit }
    @stream.write_tool_call(tool_call_id, 'weather', arguments)

    if validation_error
      @stream.write_tool_result(tool_call_id, validation_error)
      return validation_error # Return validation errors to the LLM
    end

    begin
      response = Faraday.get(weather_api_url(latitude, longitude, temperature_unit))

      case response.status
      when 200
        begin
          weather_data = JSON.parse(response.body)
          @stream.write_tool_result(tool_call_id, weather_data)
          return weather_data
        rescue JSON::ParserError => e
          error_result = { error: "Failed to parse weather API response: #{e.message}" }
          @stream.write_tool_result(tool_call_id, error_result)
          return error_result
        end
      when 429 # Rate limit or other retryable error
        error_result = { error: "API request failed (Status #{response.status}): Rate limit likely exceeded. Please try again later." } 
        @stream.write_tool_result(tool_call_id, error_result)
        return error_result
      else
        raise "Weather API error: #{response.status} - #{response.body}"
      end
    rescue Faraday::Error => e # Catch Faraday connection errors, timeouts, etc.
       error_result = { error: "Weather API request failed: #{e.message}" }
       @stream.write_tool_result(tool_call_id, error_result)
       return error_result
    end
  end

  private

  def validate_coordinates(lat_str, long_str)
    begin
      lat = Float(lat_str)
      long = Float(long_str)

      if lat.abs > 90 || long.abs > 180
        return { error: "Invalid coordinates. Latitude must be between -90 and 90, longitude between -180 and 180." }
      end
    rescue ArgumentError, TypeError
      return { error: "Invalid coordinates. Latitude and Longitude must be numbers." }
    end
    nil # Return nil if valid
  end

  def validate_temperature_unit(unit)
    unless ['celsius', 'fahrenheit'].include?(unit.to_s.downcase)
      return { error: "Invalid temperature unit. Must be 'celsius' or 'fahrenheit'." }
    end
    nil # Return nil if valid
  end

  def weather_api_url(latitude, longitude, temperature_unit)
    lat_f = Float(latitude)
    long_f = Float(longitude)
    unit = temperature_unit.to_s.downcase
    
    "https://api.open-meteo.com/v1/forecast?latitude=%.4f&longitude=%.4f&current=temperature_2m&hourly=temperature_2m&daily=sunrise,sunset&timezone=auto&temperature_unit=%s" % [lat_f, long_f, unit]
  end
end