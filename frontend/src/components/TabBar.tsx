import type { Tab } from "../types";

interface TabBarProps {
  tabs: Tab[];
  activeTabKey: string | null;
  onTabClick: (key: string) => void;
  onTabClose: (key: string) => void;
}

export function TabBar({ tabs, activeTabKey, onTabClick, onTabClose }: TabBarProps) {
  if (tabs.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        borderBottom: "1px solid #e2e8f0",
        background: "#f8fafc",
        overflowX: "auto",
        flexShrink: 0,
      }}
    >
      {tabs.map((tab) => {
        const isActive = tab.key === activeTabKey;
        const label =
          tab.type === "table"
            ? tab.model
            : `${tab.model}#${tab.id.length > 8 ? tab.id.slice(0, 8) + "..." : tab.id}`;
        const icon = tab.type === "table" ? "\u2637" : "\u2B95";

        return (
          <div
            key={tab.key}
            onClick={() => onTabClick(tab.key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 12px",
              fontSize: 12,
              cursor: "pointer",
              borderRight: "1px solid #e2e8f0",
              background: isActive ? "#fff" : "transparent",
              borderBottom: isActive ? "2px solid #4F46E5" : "2px solid transparent",
              color: isActive ? "#1E293B" : "#64748B",
              fontWeight: isActive ? 600 : 400,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            <span style={{ fontSize: 10 }}>{icon}</span>
            <span>{label}</span>
            <span
              onClick={(e) => {
                e.stopPropagation();
                onTabClose(tab.key);
              }}
              style={{
                marginLeft: 4,
                padding: "0 3px",
                borderRadius: 3,
                fontSize: 14,
                lineHeight: "14px",
                color: "#94A3B8",
                cursor: "pointer",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLSpanElement).style.background = "#fee2e2";
                (e.currentTarget as HTMLSpanElement).style.color = "#EF4444";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLSpanElement).style.background = "transparent";
                (e.currentTarget as HTMLSpanElement).style.color = "#94A3B8";
              }}
            >
              ×
            </span>
          </div>
        );
      })}
    </div>
  );
}
