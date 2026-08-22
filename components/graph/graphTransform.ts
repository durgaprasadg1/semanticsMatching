import type { GraphNode, GraphEdge } from "@/types/db";

// Shapes the API payload into what react-force-graph-2d expects.
export function toForceGraphData(nodes: GraphNode[], edges: GraphEdge[]) {
  return {
    nodes: nodes.map((n) => ({
      id: n.id,
      name: n.label,
      type: n.type,
      color: n.type === "folder" ? "#9333ea" : "#2563eb",
    })),
    links: edges.map((e) => ({
      source: e.source,
      target: e.target,
      linkType: e.link_type,
      color: e.link_type === "semantic" ? "#f59e0b" : "#d1d5db",
    })),
  };
}
