import { useEffect, useRef, useState } from "react";
import {
  Heading1,
  Heading2,
  Heading3,
  Pilcrow,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Link2,
  Undo2,
  Redo2,
} from "lucide-react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

type Tool =
  | {
      kind: "cmd";
      icon: typeof Bold;
      title: string;
      cmd: string;
      arg?: string;
      state?: string;
      block?: string;
    }
  | { kind: "sep" }
  | { kind: "link" };

const tools: Tool[] = [
  { kind: "cmd", icon: Heading1, title: "Rubrik 1", cmd: "formatBlock", arg: "h2", block: "h2" },
  { kind: "cmd", icon: Heading2, title: "Rubrik 2", cmd: "formatBlock", arg: "h3", block: "h3" },
  { kind: "cmd", icon: Heading3, title: "Rubrik 3", cmd: "formatBlock", arg: "h4", block: "h4" },
  { kind: "cmd", icon: Pilcrow, title: "Brödtext", cmd: "formatBlock", arg: "p", block: "p" },
  { kind: "sep" },
  { kind: "cmd", icon: Bold, title: "Fet", cmd: "bold", state: "bold" },
  { kind: "cmd", icon: Italic, title: "Kursiv", cmd: "italic", state: "italic" },
  { kind: "cmd", icon: Underline, title: "Understruken", cmd: "underline", state: "underline" },
  { kind: "cmd", icon: Strikethrough, title: "Genomstruken", cmd: "strikeThrough", state: "strikeThrough" },
  { kind: "sep" },
  { kind: "cmd", icon: List, title: "Punktlista", cmd: "insertUnorderedList", state: "insertUnorderedList" },
  { kind: "cmd", icon: ListOrdered, title: "Numrerad lista", cmd: "insertOrderedList", state: "insertOrderedList" },
  { kind: "cmd", icon: Quote, title: "Citat", cmd: "formatBlock", arg: "blockquote", block: "blockquote" },
  { kind: "sep" },
  { kind: "link" },
  { kind: "sep" },
  { kind: "cmd", icon: Undo2, title: "Ångra", cmd: "undo" },
  { kind: "cmd", icon: Redo2, title: "Gör om", cmd: "redo" },
];

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<{ inline: string[]; block: string }>({ inline: [], block: "p" });

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  function syncActive() {
    if (typeof document === "undefined") return;
    const inline: string[] = [];
    for (const cmd of ["bold", "italic", "underline", "strikeThrough", "insertUnorderedList", "insertOrderedList"]) {
      try {
        if (document.queryCommandState(cmd)) inline.push(cmd);
      } catch {
        /* ignore */
      }
    }
    let block = "p";
    try {
      block = (document.queryCommandValue("formatBlock") || "p").toLowerCase();
    } catch {
      /* ignore */
    }
    setActive({ inline, block: block === "div" || block === "" ? "p" : block });
  }

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? "");
    syncActive();
  }

  return (
    <div className="rte">
      <div className="rte-toolbar">
        {tools.map((t, i) => {
          if (t.kind === "sep") return <span key={`sep-${i}`} className="rte-sep" />;
          if (t.kind === "link")
            return (
              <button
                key="link"
                type="button"
                title="Länk"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const url = prompt("Länkadress (https://…)");
                  if (url) exec("createLink", url);
                  else exec("unlink");
                }}
                className="rte-btn"
              >
                <Link2 size={18} />
              </button>
            );
          const Icon = t.icon;
          const isActive =
            (t.state && active.inline.includes(t.state)) || (t.block && active.block === t.block);
          return (
            <button
              key={`${t.cmd}-${t.title}`}
              type="button"
              title={t.title}
              aria-pressed={Boolean(isActive)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec(t.cmd, t.arg)}
              className={`rte-btn${isActive ? " is-active" : ""}`}
            >
              <Icon size={18} />
            </button>
          );
        })}
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? "Skriv ditt inlägg…"}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        onKeyUp={syncActive}
        onMouseUp={syncActive}
        onFocus={syncActive}
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          onChange(ref.current?.innerHTML ?? "");
        }}
        className="prose-editor rte-surface"
      />
      <p className="rte-hint">
        Använd verktygsfältet för rubriker, listor och formatering. Dra i nedre högra hörnet för att förstora.
      </p>
    </div>
  );
}
