import React, {
  useState,
  useRef,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { AnimatePresence, motion } from "framer-motion";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Sparkles,
  Plus,
  MessageSquare,
  ImageIcon,
  Paperclip,
  ArrowUp,
  Square,
  X,
  Menu,
  PanelLeftClose,
  Copy,
  Check,
  Trash2,
  Search,
  Download,
  RotateCcw,
} from "lucide-react";
import "./App.css";
import logo from "../public/logo3.2.png";

const API_BASE =
  import.meta.env?.VITE_API_URL || "https://velkorbackend-1.onrender.com";
const STORAGE_KEY = "velkor_conversations_v1";

const EXAMPLE_PROMPTS = [
  "Explain this error message to me",
  "Summarize a document I attach",
  "Draft a README for my project",
  "Turn a rough idea into a plan",
];

function CodeBlock({ className, code }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || "");

  const handleCopy = () => {
    navigator.clipboard?.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="code-block">
      <div className="code-block-header">
        <span className="code-lang">{match ? match[1] : "text"}</span>
        <button className="copy-btn" onClick={handleCopy} type="button">
          {copied ? <Check size={13} /> : <Copy size={13} />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre>
        <code className={className}>{code}</code>
      </pre>
    </div>
  );
}

const markdownComponents = {
  code({ className, children }) {
    const code = String(children).replace(/\n$/, "");
    const isBlock =
      /language-(\w+)/.test(className || "") || code.includes("\n");
    if (!isBlock) return <code className="inline-code">{code}</code>;
    return <CodeBlock className={className} code={code} />;
  },
  pre({ children }) {
    return <>{children}</>;
  },
};

function TypingIndicator() {
  return (
    <span className="typing-dots" aria-label="Velkor is responding">
      <span />
      <span />
      <span />
    </span>
  );
}

function MessageText({ content, isStreaming }) {
  const isEmpty = !content;
  if (isStreaming && isEmpty) return <TypingIndicator />;
  return (
    <div className="message-text">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={markdownComponents}
      >
        {content || ""}
      </ReactMarkdown>
      {isStreaming && <span className="streaming-cursor" />}
    </div>
  );
}

function ImageSkeleton() {
  return (
    <div className="image-skeleton">
      <div className="image-skeleton-shimmer" />
      <span className="image-skeleton-label">Generating image…</span>
    </div>
  );
}

function downloadImage(src, filename) {
  const link = document.createElement("a");
  link.href = src;
  link.download = filename || "velkor-image.png";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

function Lightbox({ src, onClose }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <motion.div
      className="lightbox-overlay"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      onClick={onClose}
    >
      <motion.img
        src={src}
        alt="Generated result, enlarged"
        className="lightbox-image"
        initial={{ scale: 0.94, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.18, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
      />
      <div className="lightbox-toolbar" onClick={(e) => e.stopPropagation()}>
        <button
          className="lightbox-btn"
          onClick={() => downloadImage(src, `velkor-${Date.now()}.png`)}
          type="button"
        >
          <Download size={15} /> Download
        </button>
        <button className="lightbox-btn" onClick={onClose} type="button">
          <X size={15} /> Close
        </button>
      </div>
    </motion.div>
  );
}

function ChatMessage({ msg, isStreaming, onImageClick, onRedo }) {
  const isAssistant = msg.role === "assistant";
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const textToCopy = msg.content || "";
    navigator.clipboard?.writeText(textToCopy);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`message-row ${isAssistant ? "assistant" : "user"}`}
    >
      <div className="message-content-wrapper">
        <div
          className={`avatar ${isAssistant ? "ai-avatar" : "user-avatar"} ${isStreaming ? "streaming" : ""}`}
        >
          {isAssistant ? (
            <img src={logo} alt="Velkor AI" className="logo" size={14} />
          ) : (
            <span
              className="user-avatar-text"
              style={{ fontSize: "0.7rem", fontWeight: 700 }}
            >
              U
            </span>
          )}
        </div>
        <div className="message-body">
          <div className="message-sender">{isAssistant ? "Velkor" : "You"}</div>
          {msg.fileName && (
            <div className="file-badge">
              <Paperclip size={12} /> {msg.fileName}
            </div>
          )}
          {msg.imageLoading ? (
            <ImageSkeleton />
          ) : msg.image ? (
            <div className="image-wrapper">
              <img
                src={msg.image}
                alt="Generated result"
                className="generated-image"
                onClick={() => onImageClick(msg.image)}
              />
              <button
                className="image-download-btn"
                onClick={(e) => {
                  e.stopPropagation();
                  downloadImage(msg.image, `velkor-${Date.now()}.png`);
                }}
                type="button"
                aria-label="Download image"
                title="Download image"
              >
                <Download size={14} />
              </button>
            </div>
          ) : (
            <MessageText content={msg.content} isStreaming={isStreaming} />
          )}

          {/* Action buttons under messages */}
          {!isStreaming && (
            <div className="message-actions">
              <button
                className="msg-action-btn"
                onClick={handleCopy}
                type="button"
              >
                {copied ? <Check size={12} /> : <Copy size={12} />}
                {copied ? "Copied" : "Copy"}
              </button>
              {isAssistant && onRedo && (
                <button
                  className="msg-action-btn"
                  onClick={onRedo}
                  type="button"
                  title="Regenerate response"
                >
                  <RotateCcw size={12} /> Redo
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ mode, onExampleClick }) {
  return (
    <div className="empty-state">
      <div className="empty-orb" />
      <div className="empty-state-content">
        <div className="empty-state-icon">
          <img src={logo} alt="Velkor AI" className="logo-empty" />
        </div>
        <h2>
          {mode === "image"
            ? "What should Velkor draw?"
            : "How can Velkor help today?"}
        </h2>
        <p>
          {mode === "image"
            ? "Describe a scene, style, or subject and Velkor will generate it for you."
            : "Ask a question, attach a document or code file for context, or switch on Research for live web results."}
        </p>
        {mode === "chat" && (
          <div className="example-chips">
            {EXAMPLE_PROMPTS.map((p) => (
              <button
                key={p}
                className="example-chip"
                onClick={() => onExampleClick(p)}
                type="button"
              >
                {p}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function titleFromMessage(text) {
  const clean = (text || "New chat").trim().replace(/\s+/g, " ");
  return clean.length > 42 ? clean.slice(0, 42) + "…" : clean || "New chat";
}

export default function App() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [researchMode, setResearchMode] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [mode, setMode] = useState("chat");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [lightboxImage, setLightboxImage] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const textareaRef = useRef(null);
  const abortControllerRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setConversations(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    try {
      const slim = conversations.map((c) => ({
        ...c,
        messages: c.messages.map((m) =>
          m.image
            ? { ...m, image: null, content: m.content || "[Generated image]" }
            : m,
        ),
      }));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(slim));
    } catch {}
  }, [conversations]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
  }, [input]);

  const sortedConversations = useMemo(
    () => [...conversations].sort((a, b) => b.updatedAt - a.updatedAt),
    [conversations],
  );

  const syncActiveConversation = useCallback((id, nextMessages) => {
    setConversations((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, messages: nextMessages, updatedAt: Date.now() }
          : c,
      ),
    );
  }, []);

  const handleNewChat = () => {
    setActiveId(null);
    setMessages([]);
    setAttachedFile(null);
    setInput("");
    setSidebarOpen(false);
  };

  const handleSelectConversation = (conv) => {
    setActiveId(conv.id);
    setMessages(conv.messages);
    setMode(conv.mode || "chat");
    setSidebarOpen(false);
  };

  const handleDeleteConversation = (e, id) => {
    e.stopPropagation();
    setConversations((prev) => prev.filter((c) => c.id !== id));
    if (activeId === id) handleNewChat();
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) setAttachedFile(e.target.files[0]);
  };

  const handleStop = () => {
    abortControllerRef.current?.abort();
  };

  const handleRedo = async () => {
    if (messages.length === 0 || loading) return;
    // Find the last user prompt and re-submit context up to that point
    let historyWithoutLastAssistant = [...messages];
    if (
      historyWithoutLastAssistant[historyWithoutLastAssistant.length - 1]
        .role === "assistant"
    ) {
      historyWithoutLastAssistant.pop();
    }
    setMessages(historyWithoutLastAssistant);
    await executeSubmission(historyWithoutLastAssistant);
  };

  const executeSubmission = async (currentMessages) => {
    let convId = activeId;
    if (!convId && currentMessages.length > 0) {
      const firstUserMsg =
        currentMessages.find((m) => m.role === "user")?.content || "New chat";
      convId = crypto.randomUUID ? crypto.randomUUID() : String(Date.now());
      setConversations((prev) => [
        ...prev,
        {
          id: convId,
          title: titleFromMessage(firstUserMsg),
          mode,
          messages: currentMessages,
          updatedAt: Date.now(),
        },
      ]);
      setActiveId(convId);
    }

    setLoading(true);

    if (mode === "image") {
      const lastUserContent =
        currentMessages[currentMessages.length - 1].content;
      setMessages([
        ...currentMessages,
        { role: "assistant", imageLoading: true },
      ]);
      try {
        const response = await fetch(`${API_BASE}/api/image`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: lastUserContent }),
        });
        if (!response.ok)
          throw new Error(`Image service returned ${response.status}`);
        const data = await response.json();
        const finalMessages = data.success
          ? [
              ...currentMessages,
              {
                role: "assistant",
                image: `data:${data.mime};base64,${data.image_b64}`,
              },
            ]
          : [
              ...currentMessages,
              {
                role: "assistant",
                content: `Error: ${data.error || "Failed to generate image."}`,
              },
            ];
        setMessages(finalMessages);
        if (convId) syncActiveConversation(convId, finalMessages);
      } catch (err) {
        const finalMessages = [
          ...currentMessages,
          {
            role: "assistant",
            content: "Couldn't generate that image — check backend status.",
          },
        ];
        setMessages(finalMessages);
        if (convId) syncActiveConversation(convId, finalMessages);
      } finally {
        setLoading(false);
        setAttachedFile(null);
      }
      return;
    }

    const formData = new FormData();
    const cleanMessages = currentMessages.map((m) => ({
      role: m.role,
      content: m.content,
    }));
    formData.append("messages", JSON.stringify(cleanMessages));
    formData.append("research_mode", researchMode ? "true" : "false");
    if (attachedFile) formData.append("file", attachedFile);

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const timeoutId = setTimeout(() => controller.abort("timeout"), 45000);

    let streamed = [...currentMessages, { role: "assistant", content: "" }];
    setMessages(streamed);

    try {
      const response = await fetch(`${API_BASE}/api/chat`, {
        method: "POST",
        body: formData,
        signal: controller.signal,
      });

      if (!response.ok)
        throw new Error(`Chat service returned ${response.status}`);
      if (!response.body) throw new Error("Stream unsupported.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantResponse = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        assistantResponse += decoder.decode(value, { stream: true });
        streamed = [
          ...currentMessages,
          { role: "assistant", content: assistantResponse },
        ];
        setMessages(streamed);
      }

      if (convId) syncActiveConversation(convId, streamed);
    } catch (err) {
      const aborted = err?.name === "AbortError";
      const timedOut = aborted && controller.signal.reason === "timeout";
      const finalMessages = [
        ...currentMessages,
        {
          role: "assistant",
          content: timedOut
            ? "Request timed out."
            : aborted
              ? "Generation stopped."
              : `Couldn't reach backend (${err?.message || "network error"}).`,
        },
      ];
      setMessages(finalMessages);
      if (convId) syncActiveConversation(convId, finalMessages);
    } finally {
      clearTimeout(timeoutId);
      setLoading(false);
      setAttachedFile(null);
      abortControllerRef.current = null;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if ((!input.trim() && !attachedFile) || loading) return;

    const userMsgContent = input.trim();
    const newMsg = {
      role: "user",
      content: userMsgContent,
      fileName: attachedFile ? attachedFile.name : null,
    };

    const updatedMessages = [...messages, newMsg];
    setMessages(updatedMessages);
    setInput("");
    await executeSubmission(updatedMessages);
  };

  return (
    <div className="velkor-container">
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            className="sidebar-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      <aside className={`velkor-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand">
            <div className="brand-mark">
              <img src={logo} alt="Velkor AI" className="logo" size={14} />
            </div>
            <h1>Velkor AI</h1>
          </div>
          <button
            className="sidebar-icon-btn"
            onClick={() => setSidebarOpen(false)}
            type="button"
            aria-label="Close sidebar"
          >
            <PanelLeftClose size={16} />
          </button>
        </div>

        <button onClick={handleNewChat} className="new-chat-btn" type="button">
          <Plus size={16} /> New chat
        </button>

        <div className="mode-selector-section">
          <div className="sidebar-label">Mode</div>
          <button
            onClick={() => setMode("chat")}
            className={`mode-btn ${mode === "chat" ? "active" : ""}`}
            type="button"
          >
            <MessageSquare size={15} /> Chat assistant
          </button>
          <button
            onClick={() => setMode("image")}
            className={`mode-btn ${mode === "image" ? "active" : ""}`}
            type="button"
          >
            <ImageIcon size={15} /> Image generator
          </button>
        </div>

        <div className="sidebar-label" style={{ marginTop: 20 }}>
          Chats
        </div>
        <div className="conversation-list">
          {sortedConversations.length === 0 && (
            <div className="conversation-empty">
              Your conversations will appear here.
            </div>
          )}
          {sortedConversations.map((c) => (
            <button
              key={c.id}
              onClick={() => handleSelectConversation(c)}
              className={`conversation-item ${c.id === activeId ? "active" : ""}`}
              type="button"
            >
              <MessageSquare
                size={14}
                style={{ flexShrink: 0, opacity: 0.6 }}
              />
              <span className="title">{c.title}</span>
              <span
                className="conversation-delete"
                onClick={(e) => handleDeleteConversation(e, c.id)}
                role="button"
                aria-label="Delete chat"
              >
                <Trash2 size={13} />
              </span>
            </button>
          ))}
        </div>

        <div className="sidebar-footer">
          By Gururaj Achar&nbsp;
          <a
            href="https://GururajAchar2008.github.io/Portfolio2.0"
            target="_blank"
            rel="noopener noreferrer"
          >
            <i class="fa-solid fa-arrow-up-right-from-square"></i>
          </a>
        </div>
      </aside>

      <main className="velkor-main">
        <header className="velkor-header">
          <div className="header-left">
            <button
              className="sidebar-icon-btn"
              onClick={() => setSidebarOpen(true)}
              type="button"
              aria-label="Open sidebar"
            >
              <Menu size={17} />
            </button>
            <div className="workspace-title">
              {mode === "image" ? "Image" : "Chat"}{" "}
              <span className="accent-dot">·</span>{" "}
              {activeId
                ? titleFromMessage(
                    conversations.find((c) => c.id === activeId)?.title,
                  )
                : "New chat"}
            </div>
          </div>
        </header>

        <div className="message-feed">
          {messages.length === 0 ? (
            <EmptyState mode={mode} onExampleClick={(p) => setInput(p)} />
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((msg, index) => (
                <ChatMessage
                  key={index}
                  msg={msg}
                  isStreaming={
                    loading &&
                    index === messages.length - 1 &&
                    msg.role === "assistant"
                  }
                  onImageClick={setLightboxImage}
                  onRedo={
                    index === messages.length - 1 && msg.role === "assistant"
                      ? handleRedo
                      : null
                  }
                />
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="input-dock-container">
          <div className="input-dock-inner">
            {attachedFile && (
              <div className="attached-file-preview">
                <span>{attachedFile.name}</span>
                <button
                  onClick={() => setAttachedFile(null)}
                  type="button"
                  aria-label="Remove attached file"
                >
                  <X size={13} />
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="input-form">
              {mode === "chat" && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileSelect}
                    style={{ display: "none" }}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="attachment-btn"
                    title="Attach file or code"
                    aria-label="Attach file"
                  >
                    <Paperclip size={17} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setResearchMode(!researchMode)}
                    className={`tool-chip ${researchMode ? "active" : ""}`}
                    aria-pressed={researchMode}
                    title="Search the live web for this answer"
                  >
                    <Search size={14} /> Research
                  </button>
                </>
              )}

              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmit(e);
                  }
                }}
                placeholder={
                  mode === "chat"
                    ? "Message Velkor AI…"
                    : "Describe an image to generate…"
                }
                rows={1}
                className="chat-textarea"
              />

              {loading && mode === "chat" ? (
                <button
                  type="button"
                  onClick={handleStop}
                  className="send-btn stop"
                  aria-label="Stop generating"
                >
                  <Square size={13} fill="currentColor" />
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={loading || (!input.trim() && !attachedFile)}
                  className={`send-btn ${loading || (!input.trim() && !attachedFile) ? "disabled" : ""}`}
                  aria-label="Send message"
                >
                  <ArrowUp size={16} />
                </button>
              )}
            </form>
            <div className="disclaimer">
              Velkor AI can make mistakes. Verify important info.
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {lightboxImage && (
          <Lightbox
            src={lightboxImage}
            onClose={() => setLightboxImage(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
