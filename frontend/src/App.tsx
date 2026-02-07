import { useState, useCallback } from "react";
import "@xyflow/react/dist/style.css";
import { ReactFlowProvider } from "@xyflow/react";
import type { Tab } from "./types";
import { SearchBar } from "./components/SearchBar";
import { Toolbar } from "./components/Toolbar";
import { ModelList } from "./components/ModelList";
import { TabBar } from "./components/TabBar";
import { TableView } from "./components/TableView";
import { InstanceGraph } from "./components/InstanceGraph";
import { useGraphState } from "./hooks/useGraphState";

export default function App() {
  const graph = useGraphState();
  const [tabs, setTabs] = useState<Tab[]>([]);
  const [activeTabKey, setActiveTabKey] = useState<string | null>(null);

  const activeTab = tabs.find((t) => t.key === activeTabKey) || null;

  const openTableTab = useCallback(
    (model: string) => {
      const key = `table:${model}`;
      setTabs((prev) => {
        if (prev.some((t) => t.key === key)) return prev;
        return [...prev, { type: "table", model, key }];
      });
      setActiveTabKey(key);
    },
    []
  );

  const openGraphTab = useCallback(
    (model: string, id: string) => {
      const key = `graph:${model}:${id}`;
      setTabs((prev) => {
        if (prev.some((t) => t.key === key)) return prev;
        return [...prev, { type: "graph", model, id, key }];
      });
      setActiveTabKey(key);
      graph.loadRootNode(model, id);
    },
    [graph]
  );

  const closeTab = useCallback(
    (key: string) => {
      setTabs((prev) => {
        const next = prev.filter((t) => t.key !== key);
        if (activeTabKey === key) {
          setActiveTabKey(next.length > 0 ? next[next.length - 1].key : null);
        }
        return next;
      });
    },
    [activeTabKey]
  );

  const handleSearch = useCallback(
    (model: string, id: string) => {
      openGraphTab(model, id);
    },
    [openGraphTab]
  );

  // When clicking a record row in table view, open it in graph view
  const handleRecordClick = useCallback(
    (model: string, id: string) => {
      openGraphTab(model, id);
    },
    [openGraphTab]
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
          flexShrink: 0,
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

      {/* Main Content: Sidebar + Tabs/Content */}
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {/* Left Sidebar: Model List */}
        <div
          style={{
            width: 220,
            borderRight: "1px solid #e2e8f0",
            background: "#fff",
            flexShrink: 0,
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: "1px solid #e2e8f0",
              fontSize: 11,
              fontWeight: 600,
              color: "#64748B",
              textTransform: "uppercase",
              letterSpacing: 0.5,
            }}
          >
            Models
          </div>
          <ModelList
            onModelClick={openTableTab}
            activeModel={
              activeTab?.type === "table" ? activeTab.model : undefined
            }
          />
        </div>

        {/* Right: Tab Bar + Content */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <TabBar
            tabs={tabs}
            activeTabKey={activeTabKey}
            onTabClick={setActiveTabKey}
            onTabClose={closeTab}
          />

          {/* Tab Content */}
          <div style={{ flex: 1, overflow: "hidden" }}>
            {!activeTab && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100%",
                  color: "#94A3B8",
                  fontSize: 14,
                  flexDirection: "column",
                  gap: 8,
                }}
              >
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#CBD5E1" strokeWidth="1.5">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83" />
                </svg>
                <div>Click a model on the left to browse records</div>
                <div style={{ fontSize: 12 }}>
                  Or enter Model + ID above to explore the graph
                </div>
              </div>
            )}

            {tabs.map((tab) => (
              <div
                key={tab.key}
                style={{
                  display: tab.key === activeTabKey ? "flex" : "none",
                  flexDirection: "column",
                  height: "100%",
                }}
              >
                {tab.type === "table" && (
                  <TableView
                    model={tab.model}
                    onRecordClick={handleRecordClick}
                  />
                )}
                {tab.type === "graph" && (
                  <ReactFlowProvider>
                    <InstanceGraph
                      nodes={graph.flowNodes}
                      edges={graph.flowEdges}
                      onNodesChange={graph.onNodesChange}
                      onExpandRelation={graph.expandRelation}
                    />
                  </ReactFlowProvider>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
