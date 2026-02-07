# frozen_string_literal: true

module RailsModelsViz
  class Configuration
    attr_accessor :relation_limit, :excluded_models, :excluded_attributes

    def initialize
      @relation_limit = 5
      @excluded_models = []
      @excluded_attributes = %w[_id created_at updated_at]
    end
  end
end
