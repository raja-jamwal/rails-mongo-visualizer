import { useState, useCallback } from "react";
import "@xyflow/react/dist/style.css";
import { ReactFlowProvider } from "@xyflow/react";
import { SearchBar } from "./components/SearchBar";
import { Toolbar } from "./components/Toolbar";
import { SchemaMap } from "./components/SchemaMap";
import { InstanceGraph } from "./components/InstanceGraph";
import { useGraphState } from "./hooks/useGraphState";

export default function App() {
  const graph = useGraphState();
  const [selectedModel, setSelectedModel] = useState<string>("");
  const [schemaCollapsed, setSchemaCollapsed] = useState(false);

  const currentModel = graph.rootKey?.split(":")[0] || undefined;

  const handleSchemaModelClick = useCallback(
    (modelName: string) => {
      setSelectedModel(modelName);
    },
    []
  );

  const handleSearch = useCallback(
    (model: string, id: string) => {
      graph.loadRootNode(model, id);
    },
    [graph]
  );

  return (
    <div
      style={{
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        background: "#f8fafc",
      }}
    >
      {/* Top Bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 16px",
          background: "#fff",
          borderBottom: "1px solid #e2e8f0",
          zIndex: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <h1
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#1E293B",
              margin: 0,
              whiteSpace: "nowrap",
            }}
          >
            Models Viz
          </h1>
          <SearchBar
            onSearch={handleSearch}
            loading={graph.loading}
            initialModel={selectedModel}
          />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          {graph.error && (
            <span style={{ color: "#EF4444", fontSize: 12 }}>
              {graph.error}
            </span>
          )}
          <Toolbar
            onExport={graph.exportGraph}
            onImport={graph.importGraph}
            onClear={graph.clearGraph}
            hasGraph={graph.flowNodes.length > 0}
          />
        </div>
      </div>

      {/* Main Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Schema Map (left sidebar) */}
        <div
          style={{
            width: schemaCollapsed ? 36 : 280,
            borderRight: "1px solid #e2e8f0",
            background: "#fff",
            display: "flex",
            flexDirection: "column",
            transition: "width 0.2s",
            overflow: "hidden",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "6px 8px",
              borderBottom: "1px solid #f1f5f9",
            }}
          >
            {!schemaCollapsed && (
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "#64748B",
                  textTransform: "uppercase",
                  letterSpacing: 0.5,
                }}
              >
                Schema Map
              </span>
            )}
            <button
              onClick={() => setSchemaCollapsed(!schemaCollapsed)}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#94A3B8",
                fontSize: 16,
                padding: "2px 4px",
                lineHeight: 1,
              }}
              title={schemaCollapsed ? "Expand schema map" : "Collapse schema map"}
            >
              {schemaCollapsed ? "\u25B6" : "\u25C0"}
            </button>
          </div>
          {!schemaCollapsed && (
            <div style={{ flex: 1 }}>
              <ReactFlowProvider>
                <SchemaMap
                  highlightedModel={currentModel}
                  onModelClick={handleSchemaModelClick}
                />
              </ReactFlowProvider>
            </div>
          )}
        </div>

        {/* Instance Graph (main area) */}
        <div style={{ flex: 1 }}>
          <ReactFlowProvider>
            <InstanceGraph
              nodes={graph.flowNodes}
              edges={graph.flowEdges}
              onNodesChange={graph.onNodesChange}
              onExpandRelation={graph.expandRelation}
            />
          </ReactFlowProvider>
        </div>
      </div>
    </div>
  );
}
