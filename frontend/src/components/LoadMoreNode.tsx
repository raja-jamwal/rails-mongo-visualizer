import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { RelationStub } from "../types";

interface LoadMoreNodeData {
  sourceKey: string;
  relation: RelationStub;
  nextPage: number;
  remaining: number;
  color: string;
  onLoadMore?: (sourceKey: string, relation: RelationStub, page: number) => void;
}

export const LoadMoreNode = memo(
  ({ data }: { data: LoadMoreNodeData }) => {
    return (
      <div
        style={{
          background: "#f1f5f9",
          border: "1.5px dashed #94A3B8",
          borderRadius: 6,
          padding: "6px 14px",
          fontSize: 11,
          cursor: "pointer",
          textAlign: "center",
          opacity: 0.6,
          transition: "opacity 0.2s",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = "0.6";
        }}
        title="Click to load more"
      >
        <Handle type="target" position={Position.Top} style={{ background: "#94A3B8" }} />
        <div style={{ color: "#64748B", fontWeight: 500 }}>
          +{data.remaining} more {data.relation.class_name}
        </div>
        <div style={{ color: "#94A3B8", fontSize: 10 }}>Click to load</div>
      </div>
    );
  }
);

LoadMoreNode.displayName = "LoadMoreNode";
