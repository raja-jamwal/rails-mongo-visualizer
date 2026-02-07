# frozen_string_literal: true

module RailsModelsViz
  module Api
    class ModelsController < ApplicationController
      # GET /api/models - list all model names
      def index
        render json: { models: ModelInspector.all_model_names }
      end

      # GET /api/schema - full schema graph (class-level)
      def schema
        render json: ModelInspector.schema
      end

      # GET /api/models/:model_name/:id - instance node with lazy relations
      def show
        data = ModelInspector.inspect_instance(params[:model_name], params[:id])
        render json: data
      end

      # GET /api/models/:model_name/:id/relations/:relation_name - expand a relation
      def relation
        data = ModelInspector.expand_relation(
          params[:model_name],
          params[:id],
          params[:relation_name],
          page: (params[:page] || 1).to_i,
          per_page: (params[:per_page] || RailsModelsViz.configuration.relation_limit).to_i
        )
        render json: data
      end

      rescue_from ModelInspector::ModelNotFound do |e|
        render json: { error: e.message }, status: :not_found
      end

      rescue_from ModelInspector::RecordNotFound do |e|
        render json: { error: e.message }, status: :not_found
      end

      rescue_from StandardError do |e|
        render json: { error: e.message }, status: :internal_server_error
      end
    end
  end
end
