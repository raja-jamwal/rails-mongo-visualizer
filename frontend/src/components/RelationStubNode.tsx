import { memo } from "react";
import { Handle, Position } from "@xyflow/react";
import type { RelationStub } from "../types";

interface RelationStubNodeData {
  relation: RelationStub;
  sourceKey: string;
  color: string;
  onExpand?: (sourceKey: string, relation: RelationStub) => void;
}

export const RelationStubNode = memo(
  ({ data }: { data: RelationStubNodeData }) => {
    const { relation, color } = data;

    return (
      <div
        style={{
          background: "#f8fafc",
          border: `1.5px dashed ${color}`,
          borderRadius: 6,
          padding: "8px 14px",
          fontSize: 12,
          cursor: "pointer",
          opacity: 0.7,
          transition: "opacity 0.2s, transform 0.2s",
          minWidth: 140,
          textAlign: "center",
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = "1";
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.05)";
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.opacity = "0.7";
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
        }}
        title={`Click to expand ${relation.name} (${relation.class_name})`}
      >
        <Handle type="target" position={Position.Top} style={{ background: color }} />

        <div style={{ fontWeight: 600, color }}>
          {relation.class_name}
        </div>
        <div style={{ color: "#94A3B8", fontSize: 10, marginTop: 2 }}>
          {relation.name} · {relation.macro.replace("_", " ")}
          {relation.count > 0 && ` · ${relation.count}`}
        </div>
        <div
          style={{
            marginTop: 4,
            fontSize: 10,
            color: "#64748B",
            background: "#e2e8f0",
            borderRadius: 3,
            padding: "1px 6px",
            display: "inline-block",
          }}
        >
          Click to expand
        </div>

        <Handle type="source" position={Position.Bottom} style={{ background: color }} />
      </div>
    );
  }
);

RelationStubNode.displayName = "RelationStubNode";
