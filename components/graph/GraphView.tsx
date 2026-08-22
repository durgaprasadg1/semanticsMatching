"use client";

import { useEffect, useState, useMemo } from "react";
import dynamic from "next/dynamic";
import { toForceGraphData } from "./graphTransform";
import type { GraphNode, GraphEdge } from "@/types/db";

// react-force-graph touches window at import time — must be client-only.
const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), { ssr: false });

export function GraphView() {
  const [data, setData] = useState<{ nodes: GraphNode[]; edges: GraphEdge[] } | null>(null);

  useEffect(() => {
    fetch("/api/graph")
      .then((r) => r.json())
      .then(setData);
  }, []);

  const graphData = useMemo(
    () => (data ? toForceGraphData(data.nodes, data.edges) : { nodes: [], links: [] }),
    [data]
  );

  if (!data) return <div className="flex h-full items-center justify-center text-neutral-400">Loading graph…</div>;

  if (data.nodes.length === 0) {
    return (
      <div className="flex h-full items-center justify-center text-neutral-400">
        Nothing to graph yet — create some files and folders first.
      </div>
    );
  }

  return (
    <div className="h-full w-full">
      <ForceGraph2D
        graphData={graphData}
        nodeLabel="name"
        nodeColor={(n: any) => n.color}
        linkColor={(l: any) => l.color}
        linkWidth={(l: any) => (l.linkType === "semantic" ? 2 : 1)}
        nodeRelSize={5}
      />
      <div className="pointer-events-none absolute bottom-4 left-4 flex gap-4 text-xs text-neutral-500">
        <span><span className="inline-block h-2 w-2 rounded-full bg-blue-600" /> file</span>
        <span><span className="inline-block h-2 w-2 rounded-full bg-purple-600" /> folder</span>
        <span><span className="inline-block h-2 w-4 bg-gray-300 align-middle" /> structural link</span>
        <span><span className="inline-block h-2 w-4 bg-amber-500 align-middle" /> semantic link</span>
      </div>
    </div>
  );
}
