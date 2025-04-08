class MessageSerializer < ApplicationSerializer
  typelize_from Message
  
  typelize role: {type: :string, nullable: false}, 
          content: {type: :string, nullable: false}
  attributes :id, :role, :content, :created_at
end 