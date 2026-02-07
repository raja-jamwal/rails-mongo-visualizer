# frozen_string_literal: true

RailsModelsViz::Engine.routes.draw do
  root to: "ui#index"

  namespace :api do
    get "models", to: "models#index"
    get "schema", to: "models#schema"
    get "models/:model_name/records", to: "models#records", as: :model_records
    get "models/:model_name/:id", to: "models#show", as: :model_instance
    get "models/:model_name/:id/relations/:relation_name", to: "models#relation", as: :model_relation
  end
end
