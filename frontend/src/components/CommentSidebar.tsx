import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { marked } from "marked";
import hljs from "highlight.js/lib/core";
import javascript from "highlight.js/lib/languages/javascript";
import typescript from "highlight.js/lib/languages/typescript";
import ruby from "highlight.js/lib/languages/ruby";
import python from "highlight.js/lib/languages/python";
import sql from "highlight.js/lib/languages/sql";
import json from "highlight.js/lib/languages/json";
import bash from "highlight.js/lib/languages/bash";
import xml from "highlight.js/lib/languages/xml";
import css from "highlight.js/lib/languages/css";
import yaml from "highlight.js/lib/languages/yaml";
import markdown from "highlight.js/lib/languages/markdown";
import type { Comment, InstanceNode } from "../types";
import { callLlm } from "../api";

hljs.registerLanguage("javascript", javascript);
hljs.registerLanguage("js", javascript);
hljs.registerLanguage("typescript", typescript);
hljs.registerLanguage("ts", typescript);
hljs.registerLanguage("ruby", ruby);
hljs.registerLanguage("rb", ruby);
hljs.registerLanguage("python", python);
hljs.registerLanguage("py", python);
hljs.registerLanguage("sql", sql);
hljs.registerLanguage("json", json);
hljs.registerLanguage("bash", bash);
hljs.registerLanguage("sh", bash);
hljs.registerLanguage("shell", bash);
hljs.registerLanguage("html", xml);
hljs.registerLanguage("xml", xml);
hljs.registerLanguage("css", css);
hljs.registerLanguage("yaml", yaml);
hljs.registerLanguage("yml", yaml);
hljs.registerLanguage("markdown", markdown);
hljs.registerLanguage("md", markdown);

marked.setOptions({ breaks: true, gfm: true });

const renderer = new marked.Renderer();
renderer.code = function ({ text, lang }: { text: string; lang?: string }) {
  let highlighted: string;
  if (lang && hljs.getLanguage(lang)) {
    highlighted = hljs.highlight(text, { language: lang }).value;
  } else {
    highlighted = hljs.highlightAuto(text).value;
  }
  return `<pre><code class="hljs${lang ? ` language-${lang}` : ""}">${highlighted}</code></pre>`;
};
marked.use({ renderer });

function buildNodeContext(nodeData?: InstanceNode): string {
  if (!nodeData) return "";
  const lines: string[] = [
    `Model: ${nodeData.model}`,
    `Record ID: ${nodeData.record_id}`,
    "",
    "Attributes:",
  ];
  for (const [key, val] of Object.entries(nodeData.attributes)) {
    const v = val === null || val === undefined ? "null" : String(val);
    lines.push(`  ${key}: ${v}`);
  }
  if (nodeData.relations.length > 0) {
    lines.push("", "Relations:");
    for (const rel of nodeData.relations) {
      lines.push(`  ${rel.name} (${rel.macro} -> ${rel.class_name}, count: ${rel.count})`);
    }
  }
  return lines.join("\n");
}

const MIN_WIDTH = 280;
const MAX_WIDTH_RATIO = 0.7;

interface CommentSidebarProps {
  nodeKey: string;
  nodeData?: InstanceNode;
  comments: Comment[];
  onAddComment: (nodeKey: string, text: string, type: "user" | "ai") => void;
  onClose: () => void;
}

export function CommentSidebar({
  nodeKey,
  nodeData,
  comments,
  onAddComment,
  onClose,
}: CommentSidebarProps) {
  const [text, setText] = useState("");
  const [llmLoading, setLlmLoading] = useState(false);
  const [width, setWidth] = useState(() => Math.max(MIN_WIDTH, window.innerWidth * 0.35));
  const listRef = useRef<HTMLDivElement>(null);
  const dragging = useRef(false);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length]);

  // Resize drag handlers
  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    dragging.current = true;
    const startX = e.clientX;
    const startWidth = width;

    const onMouseMove = (ev: MouseEvent) => {
      if (!dragging.current) return;
      const delta = startX - ev.clientX;
      const maxWidth = window.innerWidth * MAX_WIDTH_RATIO;
      setWidth(Math.max(MIN_WIDTH, Math.min(startWidth + delta, maxWidth)));
    };

    const onMouseUp = () => {
      dragging.current = false;
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [width]);

  const handleSend = () => {
    const trimmed = text.trim();
    if (!trimmed) return;
    onAddComment(nodeKey, trimmed, "user");
    setText("");
  };

  const handleAi = async () => {
    const trimmed = text.trim();
    if (!trimmed) return;

    onAddComment(nodeKey, trimmed, "user");
    setText("");
    setLlmLoading(true);

    try {
      const nodeContext = buildNodeContext(nodeData);
      const allComments = [
        ...comments,
        { text: trimmed, type: "user" as const },
      ];
      const commentThread = allComments
        .map((c) => `[${c.type === "ai" ? "AI" : "User"}]: ${c.text}`)
        .join("\n");

      const contextText = nodeContext
        ? `--- Node Context ---\n${nodeContext}\n\n--- Conversation ---\n${commentThread}`
        : commentThread;

      const response = await callLlm(contextText);
      onAddComment(nodeKey, response, "ai");
    } catch (err) {
      onAddComment(
        nodeKey,
        `Error: ${err instanceof Error ? err.message : "LLM request failed"}`,
        "ai"
      );
    } finally {
      setLlmLoading(false);
    }
  };

  const modelName = nodeKey.includes(":") ? nodeKey.split(":")[0] : nodeKey;
  const recordId = nodeKey.includes(":") ? nodeKey.split(":").slice(1).join(":") : "";

  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width,
        height: "100%",
        background: "#fff",
        borderLeft: "1px solid #e2e8f0",
        boxShadow: "-4px 0 20px rgba(0,0,0,0.08)",
        display: "flex",
        flexDirection: "column",
        zIndex: 20,
        fontSize: 13,
        fontFamily:
          '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      }}
    >
      {/* Resize handle */}
      <div
        onMouseDown={onMouseDown}
        style={{
          position: "absolute",
          left: -3,
          top: 0,
          width: 6,
          height: "100%",
          cursor: "col-resize",
          zIndex: 21,
        }}
      >
        <div
          style={{
            position: "absolute",
            left: 2,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 40,
            borderRadius: 2,
            background: "#CBD5E1",
            transition: "background 0.15s",
          }}
        />
      </div>

      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "12px 16px",
          borderBottom: "1px solid #e2e8f0",
          background: "#f8fafc",
          flexShrink: 0,
        }}
      >
        <div>
          <div style={{ fontWeight: 600, fontSize: 13, color: "#1E293B" }}>
            {modelName}
          </div>
          {recordId && (
            <div style={{ fontSize: 11, color: "#64748B", fontFamily: "monospace", marginTop: 1 }}>
              {recordId}
            </div>
          )}
        </div>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            color: "#94A3B8",
            fontSize: 18,
            padding: "2px 6px",
            lineHeight: 1,
            borderRadius: 4,
          }}
          onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#334155"; }}
          onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "#94A3B8"; }}
        >
          ×
        </button>
      </div>

      {/* Comment list */}
      <div
        ref={listRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "12px 16px",
        }}
      >
        <style>{mdStyles}</style>
        <style>{hljsStyles}</style>
        {comments.length === 0 && (
          <div style={{ color: "#94A3B8", fontSize: 12, textAlign: "center", padding: "32px 0" }}>
            <svg width="32" height="32" viewBox="0 0 16 16" fill="none" stroke="#CBD5E1" strokeWidth="1" style={{ marginBottom: 8 }}>
              <path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5z" />
              <path d="M12 10l.75 1.75L14.5 12.5l-1.75.75L12 15l-.75-1.75-1.75-.75 1.75-.75z" opacity="0.6" />
            </svg>
            <div>No comments yet</div>
            <div style={{ fontSize: 11, marginTop: 4 }}>Type a message or ask AI about this node</div>
          </div>
        )}
        {comments.map((c) => (
          <CommentBubble key={c.id} comment={c} />
        ))}
        {llmLoading && (
          <div
            style={{
              marginBottom: 8,
              padding: "10px 12px",
              borderRadius: 8,
              background: "#f0f4ff",
              border: "1px solid #dbe4ff",
              display: "flex",
              alignItems: "center",
              gap: 8,
              color: "#4F46E5",
              fontSize: 12,
            }}
          >
            <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
            AI is thinking...
            <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
          </div>
        )}
      </div>

      {/* Input area */}
      <div style={{ borderTop: "1px solid #e2e8f0", padding: "12px 16px", flexShrink: 0, background: "#f8fafc" }}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Type a comment..."
          disabled={llmLoading}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
          style={{
            width: "100%",
            minHeight: 56,
            maxHeight: 120,
            resize: "vertical",
            border: "1px solid #e2e8f0",
            borderRadius: 8,
            padding: "10px 12px",
            fontSize: 13,
            fontFamily: "inherit",
            outline: "none",
            boxSizing: "border-box",
            background: "#fff",
          }}
          onFocus={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#4F46E5"; }}
          onBlur={(e) => { (e.target as HTMLTextAreaElement).style.borderColor = "#e2e8f0"; }}
        />
        <div style={{ display: "flex", gap: 8, marginTop: 10, justifyContent: "flex-end" }}>
          <button
            onClick={handleSend}
            disabled={!text.trim() || llmLoading}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: text.trim() && !llmLoading ? "#334155" : "#e2e8f0",
              color: text.trim() && !llmLoading ? "#fff" : "#94A3B8",
              cursor: text.trim() && !llmLoading ? "pointer" : "default",
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M14 2L7 9M14 2l-4.5 12-2.5-5.5L2 6z" />
            </svg>
            Send
          </button>
          <button
            onClick={handleAi}
            disabled={!text.trim() || llmLoading}
            style={{
              padding: "8px 16px",
              borderRadius: 6,
              border: "none",
              background: text.trim() && !llmLoading ? "#4F46E5" : "#e2e8f0",
              color: text.trim() && !llmLoading ? "#fff" : "#94A3B8",
              cursor: text.trim() && !llmLoading ? "pointer" : "default",
              fontSize: 12,
              fontWeight: 500,
              display: "flex",
              alignItems: "center",
              gap: 5,
            }}
          >
            {llmLoading ? (
              <>
                <span style={{ animation: "spin 1s linear infinite", display: "inline-block" }}>⏳</span>
                Thinking...
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5z" />
                  <path d="M12 10l.75 1.75L14.5 12.5l-1.75.75L12 15l-.75-1.75-1.75-.75 1.75-.75z" opacity="0.6" />
                </svg>
                AI
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* highlight.js theme — a clean, light theme inline */
const hljsStyles = `
.hljs { color: #334155; }
.hljs-keyword, .hljs-selector-tag, .hljs-built_in { color: #8250df; font-weight: 500; }
.hljs-string, .hljs-attr { color: #0a3069; }
.hljs-number, .hljs-literal { color: #0550ae; }
.hljs-comment, .hljs-quote { color: #6e7781; font-style: italic; }
.hljs-function .hljs-title, .hljs-title.function_ { color: #6639ba; }
.hljs-variable, .hljs-template-variable { color: #953800; }
.hljs-type, .hljs-class .hljs-title { color: #0550ae; font-weight: 500; }
.hljs-tag { color: #116329; }
.hljs-name { color: #116329; font-weight: 500; }
.hljs-attribute { color: #0550ae; }
.hljs-symbol, .hljs-bullet { color: #0550ae; }
.hljs-meta { color: #6e7781; }
.hljs-addition { color: #116329; background: #dafbe1; }
.hljs-deletion { color: #82071e; background: #ffebe9; }
`;

const mdStyles = `
.comment-md { color: #334155; line-height: 1.5; font-size: 13px; }
.comment-md p { margin: 0 0 8px; }
.comment-md p:last-child { margin-bottom: 0; }
.comment-md code {
  background: #f1f5f9; padding: 2px 5px; border-radius: 4px;
  font-size: 12px; font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}
.comment-md pre {
  background: #f8fafc; padding: 12px; border-radius: 6px;
  overflow-x: auto; margin: 8px 0; border: 1px solid #e2e8f0;
  font-size: 12px; line-height: 1.5;
  font-family: ui-monospace, SFMono-Regular, "SF Mono", Menlo, monospace;
}
.comment-md pre code { background: none; padding: 0; font-size: 12px; }
.comment-md ul, .comment-md ol { margin: 6px 0; padding-left: 20px; }
.comment-md li { margin: 3px 0; }
.comment-md h1, .comment-md h2, .comment-md h3 { margin: 10px 0 6px; }
.comment-md h1 { font-size: 16px; }
.comment-md h2 { font-size: 14px; }
.comment-md h3 { font-size: 13px; }
.comment-md blockquote { margin: 6px 0; padding-left: 12px; border-left: 3px solid #dbe4ff; color: #64748B; }
.comment-md a { color: #4F46E5; text-decoration: underline; }
.comment-md table { border-collapse: collapse; margin: 6px 0; font-size: 12px; width: 100%; }
.comment-md th, .comment-md td { border: 1px solid #e2e8f0; padding: 5px 8px; text-align: left; }
.comment-md th { background: #f1f5f9; font-weight: 600; }
.comment-md hr { border: none; border-top: 1px solid #e2e8f0; margin: 8px 0; }
.comment-md strong { font-weight: 600; }
`;

function CommentBubble({ comment: c }: { comment: Comment }) {
  const html = useMemo(() => {
    if (c.type !== "ai") return null;
    return marked.parse(c.text) as string;
  }, [c.text, c.type]);

  return (
    <div
      style={{
        marginBottom: 10,
        padding: "10px 12px",
        borderRadius: 10,
        background: c.type === "ai" ? "#f0f4ff" : "#f8fafc",
        border: c.type === "ai" ? "1px solid #dbe4ff" : "1px solid #e2e8f0",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          marginBottom: 6,
          fontSize: 10,
          color: c.type === "ai" ? "#4F46E5" : "#64748B",
          fontWeight: 600,
        }}
      >
        {c.type === "ai" ? (
          <>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M8 1l1.5 3.5L13 6l-3.5 1.5L8 11 6.5 7.5 3 6l3.5-1.5z" />
              <path d="M12 10l.75 1.75L14.5 12.5l-1.75.75L12 15l-.75-1.75-1.75-.75 1.75-.75z" opacity="0.6" />
            </svg>
            AI
          </>
        ) : (
          "You"
        )}
        <span style={{ fontWeight: 400, color: "#94A3B8", marginLeft: "auto" }}>
          {new Date(c.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </span>
      </div>
      {c.type === "ai" && html ? (
        <div
          className="comment-md"
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <div style={{ color: "#334155", whiteSpace: "pre-wrap", lineHeight: 1.5, fontSize: 13 }}>
          {c.text}
        </div>
      )}
    </div>
  );
}
