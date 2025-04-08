class ChatSerializer < ApplicationSerializer
  typelize_from Chat
  
  typelize model_id: {type: :string, nullable: false},
          title: {type: :string, optional: true, nullable: false}
  attributes :id, :model_id, :created_at, :title, :last_message_content
end 