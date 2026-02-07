# frozen_string_literal: true

require_relative "rails_models_viz/version"
require_relative "rails_models_viz/configuration"
require_relative "rails_models_viz/model_inspector"
require_relative "rails_models_viz/engine"

module RailsModelsViz
  class << self
    def configuration
      @configuration ||= Configuration.new
    end

    def configure
      yield(configuration)
    end
  end
end
