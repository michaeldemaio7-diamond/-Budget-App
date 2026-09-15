import { useRef, useState } from "react";
import { askAgent } from "../lib/api";

interface Message {
  from: "rep" | "agent";
  text: string;
}

const suggestions = [
  "Why is this flagged?",
  "What's the last thing we discussed with this account?",
  "Draft a follow-up message",
  "What's the POC status?"
];

export default function AgentChat({ accountId }: { accountId: string | null }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      from: "agent",
      text: "Hi! I'm the cockpit agent (demo stub — canned answers, no live LLM). Ask me about any flagged account."
    }
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  async function send(question: string) {
    if (!question.trim() || busy) return;
    setMessages((m) => [...m, { from: "rep", text: question }]);
    setInput("");
    setBusy(true);
    try {
      const answer = await askAgent(question, accountId);
      setMessages((m) => [...m, { from: "agent", text: answer }]);
    } catch {
      setMessages((m) => [...m, { from: "agent", text: "The demo API isn't reachable — is the mock server running?" }]);
    } finally {
      setBusy(false);
      requestAnimationFrame(() =>
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
      );
    }
  }

  return (
    <>
      {/* floating bubble — persistent bottom-right */}
      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 right-5 z-[60] grid h-12 w-12 place-items-center rounded-full bg-violet-brand text-lg text-white shadow-glass transition hover:scale-105"
        title="Ask anything (demo agent)"
      >
        {open ? "✕" : "✦"}
      </button>

      {open && (
        <div className="fixed bottom-20 right-5 z-[60] flex max-h-[70vh] w-80 flex-col overflow-hidden rounded-card border border-hairline bg-ink-850 shadow-glass">
          <header className="border-b border-hairline px-4 py-3">
            <div className="text-sm font-bold">Ask anything</div>
            <div className="text-[10px] text-paper/40">
              Canned demo agent — wire to a real LLM endpoint via /api/agent
            </div>
          </header>

          <div ref={scrollRef} className="flex flex-1 flex-col gap-2.5 overflow-y-auto px-3 py-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] whitespace-pre-wrap rounded-card px-3 py-2 text-xs leading-relaxed ${
                  m.from === "rep"
                    ? "self-end bg-violet-brand text-white"
                    : "self-start border border-hairline bg-ink-800 text-paper/85"
                }`}
              >
                {m.text}
              </div>
            ))}
            {busy && <div className="self-start text-xs text-paper/40">thinking…</div>}
          </div>

          <div className="flex flex-wrap gap-1.5 border-t border-hairline px-3 py-2">
            {suggestions.map((s) => (
              <button
                key={s}
                onClick={() => send(s)}
                className="pill border border-hairline bg-ink-800 text-paper/55 transition hover:text-paper"
              >
                {s}
              </button>
            ))}
          </div>

          <form
            className="flex gap-2 border-t border-hairline p-3"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about this account…"
              className="flex-1 rounded-card border border-hairline bg-ink-900 px-2.5 py-1.5 text-xs text-paper placeholder:text-paper/30 focus:border-violet-brand focus:outline-none"
            />
            <button
              type="submit"
              disabled={busy}
              className="rounded-card bg-violet-brand px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-40"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}
