# frozen_string_literal: true

module RailsModelsViz
  class Configuration
    attr_accessor :relation_limit, :excluded_models, :excluded_attributes, :llm_command

    def initialize
      @relation_limit = 5
      @excluded_models = []
      @excluded_attributes = %w[_id created_at updated_at]
      @llm_command = "llm.sh"
    end
  end
end
