# frozen_string_literal: true

module RailsModelsViz
  class Engine < ::Rails::Engine
    isolate_namespace RailsModelsViz

    initializer "rails_models_viz.assets" do |app|
      # Serve the frontend static files from the engine's public directory
      engine_public = root.join("public")
      if engine_public.exist?
        app.middleware.use(
          ::ActionDispatch::Static,
          engine_public.to_s
        )
      end
    end

    initializer "rails_models_viz.eager_load_models" do
      config.after_initialize do
        # Eager load all models so we can inspect them
        Rails.application.eager_load! unless Rails.application.config.eager_load
      end
    end
  end
end
