# Typelizer configuration
Typelizer.configure do |config|
  # Directories where our serializers are located
  config.dirs = [Rails.root.join("app", "serializers")]
  
  # Output directory for TypeScript interfaces
  config.output_dir = Rails.root.join("app/frontend/types/serializers")
  
  # Import path for TypeScript interfaces
  config.types_import_path = "@/types"
  
  # Enable comments in generated TypeScript interfaces
  config.comments = true
  
  # Use :nullable_and_optional for null values
  config.null_strategy = :nullable_and_optional
  
  # Explicitly set to use Oj::Serializer
  config.serializer_plugin = Typelizer::SerializerPlugins::OjSerializers
end

# Enable automatic watching in development
if Rails.env.development? && !ENV["DISABLE_TYPELIZER"]
  Rails.application.config.after_initialize do
    Typelizer.listen = true
  end
end 