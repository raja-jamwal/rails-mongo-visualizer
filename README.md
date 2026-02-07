# Rails Models Viz

Interactive model relationship visualizer for Rails applications. Explore your data models as a graph — see attributes, traverse relations, and understand your schema visually.

Supports **Mongoid** and **ActiveRecord**.

## Installation

Add to your Gemfile:

```ruby
gem "rails_models_viz", path: "../rails-models-viz"  # local dev
# gem "rails_models_viz", github: "yourorg/rails-models-viz"  # from git
```

Mount the engine in `config/routes.rb`:

```ruby
Rails.application.routes.draw do
  mount RailsModelsViz::Engine, at: "/rails_models_viz"
  # ...
end
```

Visit `http://localhost:3000/rails_models_viz` to start exploring.

## Features

- **Schema Map**: Overview of all models and relationships (left sidebar)
- **Instance Explorer**: Enter a model name + ID to explore a document's attributes and relations
- **Lazy Expansion**: Click relation stubs to expand — has_many relations load 5 at a time
- **Node Deduplication**: Same record from different paths shares one node in the graph
- **Top-down BFS Layout**: Vertical layout with fog-of-war for depth
- **Save/Load**: Export the current graph as JSON, reload it later

## Configuration

```ruby
# config/initializers/rails_models_viz.rb
RailsModelsViz.configure do |config|
  config.relation_limit = 5                    # Records per page for has_many
  config.excluded_models = ["InternalModel"]   # Hide specific models
  config.excluded_attributes = %w[_id created_at updated_at]  # Hide attributes
end
```

## API Endpoints

All endpoints are relative to the mount path (e.g., `/rails_models_viz`):

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/models` | List all model names |
| GET | `/api/schema` | Full schema graph (class-level nodes + edges) |
| GET | `/api/models/:name/:id` | Instance node with attributes + lazy relation stubs |
| GET | `/api/models/:name/:id/relations/:rel?page=1&per_page=5` | Expand a specific relation (paginated) |

## Development

### Frontend

```bash
cd frontend
npm install
npm run dev      # Dev server on port 3100, proxies API to localhost:3000
npm run build    # Builds to ../public/rails_models_viz/
```

### Security Note

This gem exposes model data through an API. In production, protect the mount with authentication:

```ruby
authenticate :user, ->(u) { u.admin? } do
  mount RailsModelsViz::Engine, at: "/rails_models_viz"
end
```

## License

MIT
