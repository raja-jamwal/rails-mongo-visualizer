import { useCallback, useRef, useState } from "react";
import type { Node, Edge } from "@xyflow/react";
import type {
  InstanceNode,
  RelationStub,
  SavedGraph,
} from "../types";
import {
  fetchInstance,
  expandRelation as expandRelationApi,
} from "../api";
import { applyDagreLayout } from "../utils/layout";

// Refs for current snapshot access inside callbacks
let nodesSnapshot: Node[] = [];
let edgesSnapshot: Edge[] = [];

export interface GraphNodes {
  flowNodes: Node[];
  flowEdges: Edge[];
  loading: boolean;
  error: string | null;
  rootKey: string | null;
  focusNodeKey: string | null;
  expandedRelations: Set<string>;
  loadRootNode: (model: string, id: string) => Promise<void>;
  expandRelation: (
    sourceKey: string,
    relation: RelationStub,
    page?: number
  ) => Promise<void>;
  expandNode: (nodeKey: string) => Promise<void>;
  onNodesChange: (changes: unknown[]) => void;
  exportGraph: () => SavedGraph;
  importGraph: (saved: SavedGraph) => string | null;
  clearGraph: () => void;
  clearFocus: () => void;
}

const NODE_COLORS: Record<string, string> = {};
const PALETTE = [
  "#4F46E5", "#0891B2", "#059669", "#D97706", "#DC2626",
  "#7C3AED", "#DB2777", "#2563EB", "#65A30D", "#EA580C",
  "#6D28D9", "#0D9488", "#CA8A04", "#E11D48", "#1D4ED8",
];

function getModelColor(model: string): string {
  if (!NODE_COLORS[model]) {
    const idx = Object.keys(NODE_COLORS).length % PALETTE.length;
    NODE_COLORS[model] = PALETTE[idx];
  }
  return NODE_COLORS[model];
}

function estimateNodeHeight(node: InstanceNode): number {
  const attrCount = Math.min(Object.keys(node.attributes).length, 8);
  // Relations are collapsed by default, just a toggle row
  const hasRelations = node.relations.some((r) => r.count > 0);
  return 60 + attrCount * 22 + (hasRelations ? 30 : 0) + 20;
}

function instanceToFlowNode(
  instance: InstanceNode,
  depth: number,
  expandedRelNames: string[] = []
): Node {
  const opacity = Math.max(0.4, 1 - depth * 0.15);
  return {
    id: instance.key,
    type: "modelNode",
    position: { x: 0, y: 0 },
    data: {
      ...instance,
      expandedRelations: expandedRelNames,
      depth,
      color: getModelColor(instance.model),
      opacity,
      estimatedHeight: estimateNodeHeight(instance),
    },
  };
}

export function useGraphState(): GraphNodes {
  const [flowNodes, setFlowNodes] = useState<Node[]>([]);
  const [flowEdges, setFlowEdges] = useState<Edge[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [focusNodeKey, setFocusNodeKey] = useState<string | null>(null);
  const [rootKey, setRootKey] = useState<string | null>(null);
  const [expandedRelations, setExpandedRelations] = useState<Set<string>>(
    new Set()
  );

  // Track all instance data for export
  const instanceDataRef = useRef<Map<string, InstanceNode>>(new Map());
  const depthMapRef = useRef<Map<string, number>>(new Map());

  const relayout = useCallback((nodes: Node[], edges: Edge[]) => {
    const layouted = applyDagreLayout(nodes, edges);
    nodesSnapshot = layouted;
    edgesSnapshot = edges;
    setFlowNodes(layouted);
    setFlowEdges(edges);
  }, []);

  const loadRootNode = useCallback(
    async (model: string, id: string) => {
      setLoading(true);
      setError(null);
      try {
        const { node } = await fetchInstance(model, id);
        instanceDataRef.current = new Map([[node.key, node]]);
        depthMapRef.current = new Map([[node.key, 0]]);
        setExpandedRelations(new Set());
        setRootKey(node.key);

        const flowNode = instanceToFlowNode(node, 0);

        relayout([flowNode], []);
        setFocusNodeKey(node.key);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [relayout]
  );

  const expandRelation = useCallback(
    async (sourceKey: string, relation: RelationStub, page = 1) => {
      const relKey = `${sourceKey}:${relation.name}`;
      setLoading(true);
      setError(null);
      try {
        const [model, id] = splitKey(sourceKey);
        const result = await expandRelationApi(
          model,
          id,
          relation.name,
          page
        );

        const sourceDepth = depthMapRef.current.get(sourceKey) ?? 0;
        const newDepth = sourceDepth + 1;

        setExpandedRelations((prev) => {
          const next = new Set(prev);
          next.add(relKey);
          return next;
        });

        // Work with snapshots directly (avoids nested setState)
        let nodes = [...nodesSnapshot];
        let edges = [...edgesSnapshot];

        // Remove any prior "load more" nodes for this relation
        const loadMorePrefix = `more:${sourceKey}:${relation.name}:`;
        nodes = nodes.filter((n) => !n.id.startsWith(loadMorePrefix));
        edges = edges.filter((e) => !e.target.startsWith(loadMorePrefix));

        // Update the source node's expandedRelations data
        const sourceIdx = nodes.findIndex((n) => n.id === sourceKey);
        if (sourceIdx !== -1) {
          const sourceNode = nodes[sourceIdx];
          const prevExpanded: string[] = (sourceNode.data as { expandedRelations?: string[] }).expandedRelations || [];
          nodes[sourceIdx] = {
            ...sourceNode,
            data: {
              ...sourceNode.data,
              expandedRelations: [...prevExpanded, relation.name],
            },
          };
        }

        result.nodes.forEach((instanceNode) => {
          instanceDataRef.current.set(instanceNode.key, instanceNode);

          const existingDepth = depthMapRef.current.get(instanceNode.key);
          const nodeDepth =
            existingDepth !== undefined
              ? Math.min(existingDepth, newDepth)
              : newDepth;
          depthMapRef.current.set(instanceNode.key, nodeDepth);

          // Check for node deduplication
          const existingIdx = nodes.findIndex(
            (n) => n.id === instanceNode.key
          );
          if (existingIdx === -1) {
            // New node — no stubs, relations live inside the card
            const flowNode = instanceToFlowNode(instanceNode, nodeDepth);
            nodes.push(flowNode);
          }

          // Add edge from source to this node (deduplicated)
          const edgeId = `e:${sourceKey}->${instanceNode.key}:${relation.name}`;
          if (!edges.some((e) => e.id === edgeId)) {
            edges.push({
              id: edgeId,
              source: sourceKey,
              target: instanceNode.key,
              label: `${relation.name}`,
              type: "smoothstep",
              animated: true,
              style: {
                stroke: getModelColor(relation.class_name),
                strokeWidth: 2,
              },
            });
          }
        });

        // Add "load more" node if there are more pages
        if (result.has_more) {
          const moreId = `more:${sourceKey}:${relation.name}:${result.page + 1}`;
          nodes.push({
            id: moreId,
            type: "loadMoreNode",
            position: { x: 0, y: 0 },
            data: {
              sourceKey,
              relation,
              nextPage: result.page + 1,
              remaining: result.total - result.page * result.per_page,
              color: getModelColor(relation.class_name),
              estimatedHeight: 40,
            },
          });
          edges.push({
            id: `e:${sourceKey}->${moreId}`,
            source: sourceKey,
            target: moreId,
            type: "smoothstep",
            style: { stroke: "#94A3B8", strokeDasharray: "5,5" },
          });
        }

        relayout(nodes, edges);

        // Focus on the first expanded node
        if (result.nodes.length > 0) {
          setFocusNodeKey(result.nodes[0].key);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : "Unknown error");
      } finally {
        setLoading(false);
      }
    },
    [relayout]
  );

  const expandNode = useCallback(
    async (nodeKey: string) => {
      const instance = instanceDataRef.current.get(nodeKey);
      if (!instance) return;

      for (const rel of instance.relations) {
        if (rel.count === 0) continue;
        const relKey = `${nodeKey}:${rel.name}`;
        if (expandedRelations.has(relKey)) continue;
        await expandRelation(nodeKey, rel, 1);
      }
    },
    [expandRelation, expandedRelations]
  );

  const onNodesChange = useCallback(
    (changes: unknown[]) => {
      setFlowNodes((nds) => {
        // Handle position changes from dragging
        const updated = [...nds];
        (changes as Array<{ type: string; id: string; position?: { x: number; y: number }; dragging?: boolean }>).forEach((change) => {
          if (change.type === "position" && change.position) {
            const idx = updated.findIndex((n) => n.id === change.id);
            if (idx !== -1) {
              updated[idx] = { ...updated[idx], position: change.position };
            }
          }
        });
        return updated;
      });
    },
    []
  );

  const exportGraph = useCallback((): SavedGraph => {
    const nodesList = flowNodes
      .filter((n) => n.type === "modelNode")
      .map((n) => {
        const instance = instanceDataRef.current.get(n.id);
        return {
          ...(instance || {
            key: n.id,
            model: "",
            record_id: "",
            attributes: {},
            relations: [],
          }),
          position: n.position,
        };
      });

    const edgesList = flowEdges
      .filter((e) => !e.id.startsWith("e:stub:") && !e.target.startsWith("stub:") && !e.target.startsWith("more:"))
      .map((e) => ({
        source: e.source,
        target: e.target,
        relation: (e.label as string) || "",
        macro: "",
      }));

    const root = rootKey ? { model: splitKey(rootKey)[0], id: splitKey(rootKey)[1] } : null;

    return {
      version: 1,
      timestamp: new Date().toISOString(),
      root,
      nodes: nodesList,
      expandedRelations: Array.from(expandedRelations),
      edges: edgesList,
    };
  }, [flowNodes, flowEdges, rootKey, expandedRelations]);

  const importGraph = useCallback(
    (saved: SavedGraph) => {
      instanceDataRef.current = new Map();
      depthMapRef.current = new Map();

      const nodes: Node[] = saved.nodes.map((n, i) => {
        const instance: InstanceNode = {
          key: n.key,
          model: n.model,
          record_id: n.record_id,
          attributes: n.attributes,
          relations: n.relations,
        };
        instanceDataRef.current.set(n.key, instance);
        depthMapRef.current.set(n.key, i === 0 ? 0 : 1);
        return {
          ...instanceToFlowNode(instance, i === 0 ? 0 : 1),
          position: n.position,
        };
      });

      const edges: Edge[] = saved.edges.map((e) => ({
        id: `e:${e.source}->${e.target}:${e.relation}`,
        source: e.source,
        target: e.target,
        label: e.relation,
        type: "smoothstep",
        animated: true,
        style: { strokeWidth: 2 },
      }));

      nodesSnapshot = nodes;
      edgesSnapshot = edges;
      setFlowNodes(nodes);
      setFlowEdges(edges);
      const rk = saved.root ? `${saved.root.model}:${saved.root.id}` : null;
      setRootKey(rk);
      setExpandedRelations(new Set(saved.expandedRelations));
      return rk;
    },
    []
  );

  const clearGraph = useCallback(() => {
    setFlowNodes([]);
    setFlowEdges([]);
    setRootKey(null);
    setExpandedRelations(new Set());
    setFocusNodeKey(null);
    instanceDataRef.current = new Map();
    depthMapRef.current = new Map();
    nodesSnapshot = [];
    edgesSnapshot = [];
    setError(null);
  }, []);

  const clearFocus = useCallback(() => {
    setFocusNodeKey(null);
  }, []);

  return {
    flowNodes,
    flowEdges,
    loading,
    error,
    rootKey,
    focusNodeKey,
    expandedRelations,
    loadRootNode,
    expandRelation,
    expandNode,
    onNodesChange,
    exportGraph,
    importGraph,
    clearGraph,
    clearFocus,
  };
}

function splitKey(key: string): [string, string] {
  const idx = key.indexOf(":");
  return [key.substring(0, idx), key.substring(idx + 1)];
}
