import { useCallback, useEffect, useRef } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useReactFlow,
  type Node,
  type Edge,
  type NodeChange,
  type NodeMouseHandler,
} from "@xyflow/react";
import { ModelNode } from "./ModelNode";
import { LoadMoreNode } from "./LoadMoreNode";
import type { RelationStub } from "../types";

const nodeTypes = {
  modelNode: ModelNode,
  loadMoreNode: LoadMoreNode,
};

interface InstanceGraphProps {
  nodes: Node[];
  edges: Edge[];
  onNodesChange: (changes: NodeChange[]) => void;
  onExpandRelation: (sourceKey: string, relation: RelationStub, page?: number) => Promise<void>;
  focusNodeKey: string | null;
  onFocusHandled: () => void;
}

export function InstanceGraph({
  nodes,
  edges,
  onNodesChange,
  onExpandRelation,
  focusNodeKey,
  onFocusHandled,
}: InstanceGraphProps) {
  const { setCenter, getZoom } = useReactFlow();
  const prevNodeCount = useRef(nodes.length);

  // When focusNodeKey changes, pan to that node
  useEffect(() => {
    if (!focusNodeKey) return;

    const timer = setTimeout(() => {
      const node = nodes.find((n) => n.id === focusNodeKey);
      if (node) {
        const height = Number(node.data?.estimatedHeight) || 180;
        setCenter(
          node.position.x + 140,
          node.position.y + height / 2,
          { zoom: Math.max(getZoom(), 0.6), duration: 400 }
        );
      }
      onFocusHandled();
    }, 100);

    return () => clearTimeout(timer);
  }, [focusNodeKey, nodes, setCenter, getZoom, onFocusHandled]);

  useEffect(() => {
    prevNodeCount.current = nodes.length;
  }, [nodes.length]);

  const handleNodeClick: NodeMouseHandler = useCallback(
    (event, node) => {
      // Check if user clicked on a relation item inside the model node
      const target = event.target as HTMLElement;
      const relationEl = target.closest?.("[data-relation]") as HTMLElement | null;

      if (relationEl && relationEl.classList.contains("relation-expandable")) {
        const relationName = relationEl.getAttribute("data-relation");
        const sourceKey = relationEl.getAttribute("data-source-key");

        if (relationName && sourceKey && node.type === "modelNode") {
          const relations = (node.data as { relations: RelationStub[] }).relations;
          const rel = relations.find((r: RelationStub) => r.name === relationName);
          if (rel) {
            onExpandRelation(sourceKey, rel);
          }
        }
        return;
      }

      // Handle load more node clicks
      if (node.type === "loadMoreNode") {
        const { sourceKey, relation, nextPage } = node.data as {
          sourceKey: string;
          relation: RelationStub;
          nextPage: number;
        };
        onExpandRelation(sourceKey, relation, nextPage);
      }
    },
    [onExpandRelation]
  );

  if (nodes.length === 0) {
    return (
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          height: "100%",
          color: "#94A3B8",
          fontSize: 14,
          flexDirection: "column",
          gap: 8,
        }}
      >
        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
          <circle cx="12" cy="12" r="3" />
          <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
        </svg>
        <div>Enter a model name and ID above to start exploring</div>
        <div style={{ fontSize: 12 }}>
          Or click a model on the left to browse records
        </div>
      </div>
    );
  }

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      onNodesChange={onNodesChange}
      onNodeClick={handleNodeClick}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      minZoom={0.1}
      maxZoom={2}
      proOptions={{ hideAttribution: true }}
      defaultEdgeOptions={{
        type: "smoothstep",
      }}
    >
      <Background gap={20} size={1} color="#f1f5f9" />
      <Controls position="bottom-right" />
      <MiniMap
        position="bottom-left"
        nodeColor={(node) => {
          if (node.type === "modelNode") return (node.data as { color: string }).color;
          return "#CBD5E1";
        }}
        style={{ width: 120, height: 80 }}
      />
    </ReactFlow>
  );
}
