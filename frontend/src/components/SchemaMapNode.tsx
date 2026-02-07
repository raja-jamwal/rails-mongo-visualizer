import { memo } from "react";
import { Handle, Position } from "@xyflow/react";

interface SchemaMapNodeData {
  label: string;
  fields_count: number;
  relations_count: number;
  highlighted?: boolean;
}

export const SchemaMapNode = memo(
  ({ data }: { data: SchemaMapNodeData }) => {
    return (
      <div
        style={{
          background: data.highlighted ? "#4F46E5" : "#fff",
          color: data.highlighted ? "#fff" : "#334155",
          border: data.highlighted
            ? "2px solid #4F46E5"
            : "1px solid #CBD5E1",
          borderRadius: 4,
          padding: "3px 8px",
          fontSize: 9,
          fontWeight: 500,
          textAlign: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          lineHeight: 1.3,
          whiteSpace: "nowrap",
        }}
      >
        <Handle
          type="target"
          position={Position.Top}
          style={{ width: 4, height: 4, background: "#94A3B8" }}
        />
        <div>{data.label}</div>
        <Handle
          type="source"
          position={Position.Bottom}
          style={{ width: 4, height: 4, background: "#94A3B8" }}
        />
      </div>
    );
  }
);

SchemaMapNode.displayName = "SchemaMapNode";
