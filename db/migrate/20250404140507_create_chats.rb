class CreateChats < ActiveRecord::Migration[8.0]
  def change
    create_table :chats do |t|
      t.string :model_id

      t.timestamps
    end
    
    add_index :chats, :model_id
  end
end
