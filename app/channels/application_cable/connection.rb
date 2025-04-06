module ApplicationCable
  class Connection < ActionCable::Connection::Base
    identified_by :current_user

    def connect
      self.current_user = find_verified_user
    end

    private
      def find_verified_user
        if (user_id = cookies.encrypted[:user_id])
          User.find_by(id: user_id)
        else
          # Allow unauthenticated connections
          # But still identify them as nil
          nil
        end
      end
  end
end
