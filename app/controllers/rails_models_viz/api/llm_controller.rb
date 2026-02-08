# frozen_string_literal: true

require "open3"

module RailsModelsViz
  module Api
    class LlmController < ApplicationController
      skip_forgery_protection

      # POST /api/llm
      def create
        input = params[:input].to_s
        if input.blank?
          return render json: { error: "input is required" }, status: :unprocessable_entity
        end

        cmd = RailsModelsViz.configuration.llm_command
        # Expand PATH to include common user bin directories
        env = { "PATH" => [
          File.expand_path("~/.local/bin"),
          File.expand_path("~/bin"),
          "/usr/local/bin",
          ENV["PATH"]
        ].compact.join(":") }

        stdout, status = Open3.capture2(env, cmd, stdin_data: input , chdir: Rails.root.to_s)

        if status.success?
          render json: { response: stdout.strip }
        else
          render json: { error: "LLM command failed (exit #{status.exitstatus})" }, status: :internal_server_error
        end
      rescue Errno::ENOENT
        render json: { error: "#{cmd} not found in PATH" }, status: :internal_server_error
      rescue StandardError => e
        render json: { error: e.message }, status: :internal_server_error
      end
    end
  end
end
