import Dagre from "@dagrejs/dagre";
import type { Node, Edge } from "@xyflow/react";

interface LayoutOptions {
  direction?: "TB" | "LR";
  nodeWidth?: number;
  nodeHeight?: number;
  rankSep?: number;
  nodeSep?: number;
}

export function applyDagreLayout(
  nodes: Node[],
  edges: Edge[],
  options: LayoutOptions = {}
): Node[] {
  const {
    direction = "TB",
    nodeWidth = 280,
    nodeHeight = 180,
    rankSep = 80,
    nodeSep = 40,
  } = options;

  const g = new Dagre.graphlib.Graph().setDefaultEdgeLabel(() => ({}));
  g.setGraph({ rankdir: direction, ranksep: rankSep, nodesep: nodeSep });

  nodes.forEach((node) => {
    const h = Number(node.data?.estimatedHeight) || nodeHeight;
    g.setNode(node.id, { width: nodeWidth, height: h });
  });

  edges.forEach((edge) => {
    g.setEdge(edge.source, edge.target);
  });

  Dagre.layout(g);

  return nodes.map((node) => {
    const pos = g.node(node.id);
    const h = Number(node.data?.estimatedHeight) || nodeHeight;
    return {
      ...node,
      position: {
        x: pos.x - nodeWidth / 2,
        y: pos.y - h / 2,
      },
    };
  });
}

export function applySchemaLayout(
  nodes: Node[],
  edges: Edge[]
): Node[] {
  return applyDagreLayout(nodes, edges, {
    direction: "TB",
    nodeWidth: 140,
    nodeHeight: 50,
    rankSep: 60,
    nodeSep: 30,
  });
}
