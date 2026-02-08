import { memo, useState } from "react";
import { Handle, Position } from "@xyflow/react";
import type { RelationStub } from "../types";

interface ModelNodeData {
  key: string;
  model: string;
  record_id: string;
  attributes: Record<string, unknown>;
  relations: RelationStub[];
  expandedRelations: string[]; // relation names already expanded
  depth: number;
  color: string;
  opacity: number;
  hasComments?: boolean;
}

function truncateValue(val: unknown, maxLen = 40): string {
  if (val === null || val === undefined) return "null";
  const str = typeof val === "object" ? JSON.stringify(val) : String(val);
  return str.length > maxLen ? str.slice(0, maxLen) + "..." : str;
}

export const ModelNode = memo(({ data }: { data: ModelNodeData }) => {
  const [showAllAttrs, setShowAllAttrs] = useState(false);
  const [showRelations, setShowRelations] = useState(false);
  const attrs = Object.entries(data.attributes);
  const visibleAttrs = showAllAttrs ? attrs : attrs.slice(0, 6);
  const hasMoreAttrs = attrs.length > 6;

  const expandedSet = new Set(data.expandedRelations || []);
  const relationsWithData = data.relations.filter((r) => r.count > 0);
  const expandableRelations = relationsWithData.filter((r) => !expandedSet.has(r.name));

  return (
    <div
      className="model-node"
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
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <span
            data-comment-btn
            data-node-key={data.key}
            title="Comments"
            style={{
              cursor: "pointer",
              opacity: 0.85,
              display: "flex",
              alignItems: "center",
              padding: "1px 3px",
              borderRadius: 3,
              transition: "opacity 0.15s",
              position: "relative",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5z" />
              <path d="M12 10l.75 1.75L14.5 12.5l-1.75.75L12 15l-.75-1.75-1.75-.75 1.75-.75z" opacity="0.6" />
            </svg>
            {data.hasComments && (
              <span
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 7,
                  height: 7,
                  borderRadius: "50%",
                  background: "#FACC15",
                  border: "1.5px solid " + data.color,
                }}
              />
            )}
          </span>
          <span style={{ opacity: 0.8, fontSize: 11, fontFamily: "monospace" }}>
            {data.record_id.length > 12
              ? data.record_id.slice(0, 12) + "..."
              : data.record_id}
          </span>
        </div>
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
        {hasMoreAttrs && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowAllAttrs(!showAllAttrs);
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
            {showAllAttrs ? "Show less" : `+${attrs.length - 6} more attributes`}
          </button>
        )}
      </div>

      {/* Relations toggle */}
      {relationsWithData.length > 0 && (
        <div style={{ borderTop: "1px solid #e2e8f0" }}>
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowRelations(!showRelations);
            }}
            style={{
              width: "100%",
              background: "none",
              border: "none",
              padding: "5px 10px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              fontSize: 10,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontWeight: 600,
            }}
          >
            <span>
              Relations ({expandableRelations.length} expandable
              {expandedSet.size > 0 && `, ${expandedSet.size} loaded`})
            </span>
            <span style={{ fontSize: 12 }}>{showRelations ? "\u25B2" : "\u25BC"}</span>
          </button>

          {showRelations && (
            <div style={{ padding: "0 10px 6px", maxHeight: 200, overflowY: "auto" }}>
              {relationsWithData.map((rel) => {
                const isExpanded = expandedSet.has(rel.name);
                return (
                  <div
                    key={rel.name}
                    data-relation={rel.name}
                    data-source-key={data.key}
                    className={isExpanded ? "relation-expanded" : "relation-expandable"}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      padding: "4px 6px",
                      marginBottom: 2,
                      borderRadius: 4,
                      cursor: isExpanded ? "default" : "pointer",
                      background: isExpanded ? "#f0fdf4" : "#f8fafc",
                      border: isExpanded
                        ? "1px solid #bbf7d0"
                        : "1px solid #e2e8f0",
                      transition: "all 0.15s",
                      opacity: isExpanded ? 0.7 : 1,
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded)
                        (e.currentTarget as HTMLDivElement).style.background = "#eef2ff";
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded)
                        (e.currentTarget as HTMLDivElement).style.background = "#f8fafc";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: "50%",
                          background: isExpanded ? "#22c55e" : data.color,
                          flexShrink: 0,
                        }}
                      />
                      <span style={{ color: "#334155", fontSize: 11, fontWeight: 500 }}>
                        {rel.name}
                      </span>
                      <span style={{ color: "#94A3B8", fontSize: 10 }}>
                        {rel.macro === "belongs_to"
                          ? "\u21921"
                          : rel.macro === "has_one" || rel.macro === "embeds_one"
                          ? "1\u2190"
                          : `\u2190${rel.count}`}
                      </span>
                    </div>
                    <span
                      style={{
                        fontSize: 10,
                        color: isExpanded ? "#16a34a" : "#64748B",
                        background: isExpanded ? "#dcfce7" : "#f1f5f9",
                        borderRadius: 3,
                        padding: "1px 5px",
                        whiteSpace: "nowrap",
                      }}
                    >
                      {isExpanded ? "\u2713 loaded" : rel.class_name}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <Handle type="source" position={Position.Bottom} style={{ background: data.color }} />
    </div>
  );
});

ModelNode.displayName = "ModelNode";
