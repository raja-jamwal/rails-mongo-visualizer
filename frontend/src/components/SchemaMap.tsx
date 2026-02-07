import { useEffect, useMemo, useState } from "react";
import {
  ReactFlow,
  Background,
  type Node,
  type Edge,
} from "@xyflow/react";
import type { SchemaData } from "../types";
import { fetchSchema } from "../api";
import { applySchemaLayout } from "../utils/layout";
import { SchemaMapNode } from "./SchemaMapNode";

const nodeTypes = { schemaNode: SchemaMapNode };

interface SchemaMapProps {
  highlightedModel?: string;
  onModelClick?: (modelName: string) => void;
}

export function SchemaMap({ highlightedModel, onModelClick }: SchemaMapProps) {
  const [schema, setSchema] = useState<SchemaData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchema()
      .then(setSchema)
      .catch((e) => setError(e.message));
  }, []);

  const { nodes, edges } = useMemo(() => {
    if (!schema) return { nodes: [], edges: [] };

    const flowNodes: Node[] = schema.nodes.map((n) => ({
      id: `schema:${n.id}`,
      type: "schemaNode",
      position: { x: 0, y: 0 },
      data: {
        ...n,
        highlighted: n.id === highlightedModel,
      },
    }));

    const flowEdges: Edge[] = schema.edges.map((e, i) => ({
      id: `schema-edge:${i}`,
      source: `schema:${e.source}`,
      target: `schema:${e.target}`,
      type: "smoothstep",
      style: {
        stroke: e.source === highlightedModel || e.target === highlightedModel
          ? "#4F46E5"
          : "#CBD5E1",
        strokeWidth: e.source === highlightedModel || e.target === highlightedModel ? 1.5 : 0.5,
      },
    }));

    const layouted = applySchemaLayout(flowNodes, flowEdges);
    return { nodes: layouted, edges: flowEdges };
  }, [schema, highlightedModel]);

  if (error) {
    return (
      <div style={{ padding: 8, color: "#EF4444", fontSize: 11 }}>
        Schema error: {error}
      </div>
    );
  }

  if (!schema) {
    return (
      <div style={{ padding: 8, color: "#94A3B8", fontSize: 11 }}>
        Loading schema...
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      fitView
      panOnDrag
      zoomOnScroll
      minZoom={0.1}
      maxZoom={1}
      proOptions={{ hideAttribution: true }}
      onNodeClick={(_event, node) => {
        const modelName = node.id.replace("schema:", "");
        onModelClick?.(modelName);
      }}
    >
      <Background gap={16} size={0.5} color="#f1f5f9" />
    </ReactFlow>
  );
}
