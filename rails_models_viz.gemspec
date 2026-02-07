# frozen_string_literal: true

require_relative "lib/rails_models_viz/version"

Gem::Specification.new do |spec|
  spec.name = "rails_models_viz"
  spec.version = RailsModelsViz::VERSION
  spec.authors = ["LeadGenie"]
  spec.summary = "Interactive model relationship visualizer for Rails applications"
  spec.description = "A mountable Rails engine that provides an interactive graph visualization of your models, their attributes, and relationships. Supports both ActiveRecord and Mongoid."
  spec.homepage = "https://github.com/leadgenie/rails-models-viz"
  spec.license = "MIT"
  spec.required_ruby_version = ">= 3.0"

  spec.files = Dir[
    "lib/**/*",
    "app/**/*",
    "config/**/*",
    "public/**/*",
    "LICENSE",
    "README.md"
  ]

  spec.add_dependency "rails", ">= 6.1"
end
