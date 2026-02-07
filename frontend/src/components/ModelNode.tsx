import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import type { RelationStub } from "../types";

interface ModelNodeData {
  key: string;
  model: string;
  record_id: string;
  attributes: Record<string, unknown>;
  relations: RelationStub[];
  depth: number;
  color: string;
  opacity: number;
  onExpandRelation?: (sourceKey: string, relation: RelationStub) => void;
}

function truncateValue(val: unknown, maxLen = 40): string {
  if (val === null || val === undefined) return "null";
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

export const ModelNode = memo(({ data }: { data: ModelNodeData }) => {
  const [showAll, setShowAll] = useState(false);
  const attrs = Object.entries(data.attributes);
  const visibleAttrs = showAll ? attrs : attrs.slice(0, 6);
  const hasMore = attrs.length > 6;

  return (
    <div
      style={{
        opacity: data.opacity,
        background: "#fff",
        border: `2px solid ${data.color}`,
        borderRadius: 8,
        minWidth: 260,
        maxWidth: 320,
        fontSize: 12,
        boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
        overflow: "hidden",
      }}
    >
      <Handle type="target" position={Position.Top} style={{ background: data.color }} />

      {/* Header */}
      <div
        style={{
          background: data.color,
          color: "#fff",
          padding: "6px 10px",
          fontWeight: 600,
          fontSize: 13,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span>{data.model}</span>
        <span style={{ opacity: 0.8, fontSize: 11, fontFamily: "monospace" }}>
          {data.record_id.length > 12
            ? data.record_id.slice(0, 12) + "..."
            : data.record_id}
        </span>
      </div>

      {/* Attributes */}
      <div style={{ padding: "6px 10px" }}>
        {visibleAttrs.map(([key, val]) => (
          <div
            key={key}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "2px 0",
              borderBottom: "1px solid #f1f5f9",
              gap: 8,
            }}
          >
            <span style={{ color: "#64748B", fontWeight: 500, flexShrink: 0 }}>
              {key}
            </span>
            <span
              style={{
                color: "#334155",
                fontFamily: "monospace",
                fontSize: 11,
                textAlign: "right",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
              title={String(val)}
            >
              {truncateValue(val)}
            </span>
          </div>
        ))}
        {hasMore && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAll(!showAll);
            }}
            style={{
              background: "none",
              border: "none",
              color: data.color,
              cursor: "pointer",
              fontSize: 11,
              padding: "4px 0",
              width: "100%",
              textAlign: "center",
            }}
          >
            {showAll ? "Show less" : `+${attrs.length - 6} more attributes`}
          </button>
        )}
      </div>

      {/* Relations */}
      {data.relations.length > 0 && (
        <div
          style={{
            borderTop: "1px solid #e2e8f0",
            padding: "4px 10px 6px",
          }}
        >
          <div
            style={{
              fontSize: 10,
              color: "#94A3B8",
              textTransform: "uppercase",
              letterSpacing: 1,
              marginBottom: 2,
            }}
          >
            Relations
          </div>
          {data.relations.map((rel) => (
            <div
              key={rel.name}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "3px 0",
              }}
            >
              <span style={{ color: "#475569", fontSize: 11 }}>
                {rel.name}
                <span style={{ color: "#94A3B8", fontSize: 10, marginLeft: 4 }}>
                  {rel.macro === "belongs_to"
                    ? "→1"
                    : rel.macro === "has_one"
                    ? "1←"
                    : `←${rel.count}`}
                </span>
              </span>
              <span
                style={{
                  background: "#f1f5f9",
                  color: "#64748B",
                  borderRadius: 4,
                  padding: "1px 6px",
                  fontSize: 10,
                }}
              >
                {rel.class_name}
              </span>
            </div>
          ))}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: data.color }} />
    </div>
  );
});

ModelNode.displayName = "ModelNode";
