export interface SchemaNode {
  id: string;
  label: string;
  fields_count: number;
  relations_count: number;
}

export interface SchemaEdge {
  source: string;
  target: string;
  label: string;
  type: string;
}

export interface SchemaData {
  nodes: SchemaNode[];
  edges: SchemaEdge[];
}

export interface RelationStub {
  name: string;
  macro: "belongs_to" | "has_one" | "has_many" | "has_and_belongs_to_many";
  class_name: string;
  foreign_key: string;
  value?: string | null;
  count: number;
  preview_ids?: string[];
}

export interface InstanceNode {
  key: string; // "ModelName:id"
  model: string;
  record_id: string;
  attributes: Record<string, unknown>;
  relations: RelationStub[];
}

export interface InstanceResponse {
  node: InstanceNode;
}

export interface ExpandRelationResponse {
  source_key: string;
  relation: string;
  total: number;
  page: number;
  per_page: number;
  has_more: boolean;
  nodes: InstanceNode[];
}

export interface GraphState {
  nodes: Map<string, InstanceNode>;
  expandedRelations: Set<string>; // "sourceKey:relationName"
  nodePositions: Map<string, { x: number; y: number }>;
  rootKey: string | null;
}

export interface SavedGraph {
  version: 1;
  timestamp: string;
  root: { model: string; id: string } | null;
  nodes: Array<InstanceNode & { position: { x: number; y: number } }>;
  expandedRelations: string[];
  edges: Array<{
    source: string;
    target: string;
    relation: string;
    macro: string;
  }>;
}

declare global {
  interface Window {
    __RAILS_MODELS_VIZ__: {
      apiBase: string;
    };
  }
}
