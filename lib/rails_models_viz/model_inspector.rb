# frozen_string_literal: true

module RailsModelsViz
  class ModelInspector
    class ModelNotFound < StandardError; end
    class RecordNotFound < StandardError; end

    class << self
      def orm
        @orm ||= if defined?(Mongoid)
                   :mongoid
                 elsif defined?(ActiveRecord)
                   :active_record
                 else
                   raise "No supported ORM detected (ActiveRecord or Mongoid)"
                 end
      end

      # Returns all model class names
      def all_model_names
        models = if orm == :mongoid
                   mongoid_models
                 else
                   active_record_models
                 end

        excluded = RailsModelsViz.configuration.excluded_models.map(&:to_s)
        models.map(&:name).reject { |name| excluded.include?(name) }.sort
      end

      # Returns schema-level graph: all models with their relation definitions
      def schema
        model_names = all_model_names
        nodes = []
        edges = []
        seen_edges = Set.new

        model_names.each do |name|
          klass = name.constantize
          relations = relations_for(klass)

          nodes << {
            id: name,
            label: name,
            fields_count: fields_for(klass).size,
            relations_count: relations.size
          }

          relations.each do |rel|
            target = rel[:class_name]
            next unless model_names.include?(target)

            edge_key = [name, target, rel[:name]].join(":")
            next if seen_edges.include?(edge_key)

            seen_edges.add(edge_key)
            edges << {
              source: name,
              target: target,
              label: rel[:name],
              type: rel[:macro]
            }
          end
        end

        { nodes: nodes, edges: edges }
      end

      # Returns instance data with attributes and lazy relation stubs
      def inspect_instance(model_name, record_id)
        klass = resolve_model(model_name)
        record = find_record(klass, record_id)

        attributes = safe_attributes(record, klass)
        relations = relations_for(klass).map do |rel|
          build_relation_stub(record, rel)
        end

        {
          node: {
            key: "#{model_name}:#{record_id}",
            model: model_name,
            record_id: record_id.to_s,
            attributes: attributes,
            relations: relations
          }
        }
      end

      # Returns paginated records for table view
      def list_records(model_name, page: 1, per_page: 25)
        klass = resolve_model(model_name)
        offset = (page - 1) * per_page

        total = klass.count
        records = klass.order_by(_id: :desc).skip(offset).limit(per_page).to_a

        columns = fields_for(klass).keys.first(30) # Cap columns for table view
        columns.unshift("_id") unless columns.include?("_id")

        rows = records.map do |record|
          row = {}
          columns.each do |col|
            row[col] = serialize_value(record.attributes[col])
          end
          row
        end

        {
          model: model_name,
          columns: columns,
          rows: rows,
          total: total,
          page: page,
          per_page: per_page,
          total_pages: (total.to_f / per_page).ceil
        }
      end

      # Expands a specific relation on a record, paginated
      def expand_relation(model_name, record_id, relation_name, page: 1, per_page: nil)
        per_page ||= RailsModelsViz.configuration.relation_limit
        klass = resolve_model(model_name)
        record = find_record(klass, record_id)
        rel_meta = find_relation_meta(klass, relation_name)

        related_klass = rel_meta[:class_name].constantize
        items = fetch_related(record, rel_meta, page: page, per_page: per_page)

        nodes = items.map do |item|
          item_id = item_id_string(item)
          {
            key: "#{rel_meta[:class_name]}:#{item_id}",
            model: rel_meta[:class_name],
            record_id: item_id,
            attributes: safe_attributes(item, related_klass),
            relations: relations_for(related_klass).map { |r| build_relation_stub(item, r) }
          }
        end

        total = count_related(record, rel_meta)

        {
          source_key: "#{model_name}:#{record_id}",
          relation: relation_name,
          total: total,
          page: page,
          per_page: per_page,
          has_more: (page * per_page) < total,
          nodes: nodes
        }
      end

      private

      def mongoid_models
        ObjectSpace.each_object(Class).select do |klass|
          klass.included_modules.include?(Mongoid::Document) &&
            !klass.name.nil? &&
            !klass.embedded?
        rescue StandardError
          false
        end
      end

      def active_record_models
        ActiveRecord::Base.descendants.reject do |klass|
          klass.abstract_class? || klass.name.nil?
        end
      end

      def resolve_model(model_name)
        klass = model_name.safe_constantize
        raise ModelNotFound, "Model '#{model_name}' not found" unless klass
        klass
      end

      def find_record(klass, record_id)
        record = klass.find(record_id)
        raise RecordNotFound, "#{klass.name}##{record_id} not found" unless record
        record
      rescue StandardError => e
        raise RecordNotFound, "#{klass.name}##{record_id} not found: #{e.message}"
      end

      def fields_for(klass)
        if orm == :mongoid
          klass.fields.reject { |name, _| name.start_with?("_") }
        else
          klass.columns.reject { |c| c.name.start_with?("_") }
        end
      end

      def relations_for(klass)
        if orm == :mongoid
          mongoid_relations(klass)
        else
          active_record_relations(klass)
        end
      end

      def mongoid_relations(klass)
        klass.relations.filter_map do |name, meta|
          macro = meta.class.name.demodulize.underscore # e.g. "has_many", "belongs_to", "embeds_many"
          embedded = meta.class.name.include?("Embedded")

          # Skip embedded_in (inverse of embeds_many/embeds_one)
          next if macro == "embedded_in"

          # Embedded relations don't have foreign_key
          fk = embedded ? nil : (meta.foreign_key rescue nil)

          {
            name: name,
            class_name: meta.class_name,
            macro: macro,
            foreign_key: fk,
            inverse_of: meta.inverse_of&.to_s,
            embedded: embedded
          }
        end
      end

      def active_record_relations(klass)
        klass.reflections.map do |name, ref|
          {
            name: name,
            class_name: ref.class_name,
            macro: ref.macro.to_s, # belongs_to, has_many, has_one, has_and_belongs_to_many
            foreign_key: ref.foreign_key,
            inverse_of: ref.inverse_of&.to_s
          }
        end
      end

      def safe_attributes(record, klass)
        excluded = RailsModelsViz.configuration.excluded_attributes
        attrs = if orm == :mongoid
                  record.attributes.except(*excluded)
                else
                  record.attributes.except(*excluded)
                end

        # Stringify values for safe JSON serialization
        attrs.transform_values { |v| serialize_value(v) }
      end

      def serialize_value(value)
        case value
        when String, Integer, Float, TrueClass, FalseClass, NilClass
          value
        when Time, DateTime, Date
          value.iso8601
        when Array
          value.map { |v| serialize_value(v) }
        when Hash
          value.transform_values { |v| serialize_value(v) }
        when BSON::ObjectId
          value.to_s
        else
          value.to_s
        end
      rescue StandardError
        value.to_s
      end

      def build_relation_stub(record, rel_meta)
        stub = {
          name: rel_meta[:name],
          macro: rel_meta[:macro],
          class_name: rel_meta[:class_name],
          foreign_key: rel_meta[:foreign_key],
          embedded: rel_meta[:embedded] || false
        }

        case rel_meta[:macro]
        when "belongs_to"
          fk_value = begin; record.send(rel_meta[:foreign_key]); rescue; nil; end
          stub[:value] = fk_value&.to_s
          stub[:count] = fk_value.present? ? 1 : 0
        when "has_one", "embeds_one"
          begin
            related = record.send(rel_meta[:name])
            stub[:value] = related ? item_id_string(related) : nil
            stub[:count] = related ? 1 : 0
          rescue StandardError
            stub[:value] = nil
            stub[:count] = 0
          end
        when "has_many", "has_and_belongs_to_many"
          begin
            relation_proxy = record.send(rel_meta[:name])
            stub[:count] = relation_proxy.count
            limit = RailsModelsViz.configuration.relation_limit
            stub[:preview_ids] = relation_proxy.limit(limit).pluck(:_id).map(&:to_s)
          rescue StandardError
            stub[:count] = 0
            stub[:preview_ids] = []
          end
        when "embeds_many"
          begin
            embedded_docs = record.send(rel_meta[:name])
            stub[:count] = embedded_docs.size
            limit = RailsModelsViz.configuration.relation_limit
            stub[:preview_ids] = embedded_docs.first(limit).map { |d| item_id_string(d) }.compact
          rescue StandardError
            stub[:count] = 0
            stub[:preview_ids] = []
          end
        end

        stub
      end

      def fetch_related(record, rel_meta, page:, per_page:)
        case rel_meta[:macro]
        when "belongs_to"
          fk = record.send(rel_meta[:foreign_key])
          fk ? [rel_meta[:class_name].constantize.find(fk)].compact : []
        when "has_one", "embeds_one"
          related = record.send(rel_meta[:name])
          related ? [related] : []
        when "has_many", "has_and_belongs_to_many"
          offset = (page - 1) * per_page
          record.send(rel_meta[:name]).skip(offset).limit(per_page).to_a
        when "embeds_many"
          offset = (page - 1) * per_page
          record.send(rel_meta[:name]).to_a.slice(offset, per_page) || []
        else
          []
        end
      rescue StandardError
        []
      end

      def count_related(record, rel_meta)
        case rel_meta[:macro]
        when "belongs_to"
          record.send(rel_meta[:foreign_key]).present? ? 1 : 0
        when "has_one", "embeds_one"
          record.send(rel_meta[:name]).present? ? 1 : 0
        when "has_many", "has_and_belongs_to_many"
          record.send(rel_meta[:name]).count
        when "embeds_many"
          record.send(rel_meta[:name]).size
        else
          0
        end
      rescue StandardError
        0
      end

      def find_relation_meta(klass, relation_name)
        rel = relations_for(klass).find { |r| r[:name] == relation_name }
        raise ModelNotFound, "Relation '#{relation_name}' not found on #{klass.name}" unless rel
        rel
      end

      def item_id_string(item)
        (item.try(:_id) || item.try(:id))&.to_s
      end
    end
  end
end
