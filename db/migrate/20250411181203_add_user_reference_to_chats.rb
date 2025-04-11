class AddUserReferenceToChats < ActiveRecord::Migration[8.0]
  def change
    add_reference :chats, :user, null: true, foreign_key: true
  end
end
