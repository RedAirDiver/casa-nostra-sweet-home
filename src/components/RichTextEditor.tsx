import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

type Tool =
  | { kind: "cmd"; label: string; title: string; cmd: string; arg?: string }
  | { kind: "sep" }
  | { kind: "link" }
  | { kind: "unlink" }
  | { kind: "color" };

const tools: Tool[] = [
  { kind: "cmd", label: "B", title: "Fet", cmd: "bold" },
  { kind: "cmd", label: "I", title: "Kursiv", cmd: "italic" },
  { kind: "cmd", label: "U", title: "Understruken", cmd: "underline" },
  { kind: "cmd", label: "S", title: "Genomstruken", cmd: "strikeThrough" },
  { kind: "sep" },
  { kind: "cmd", label: "H1", title: "Stor rubrik", cmd: "formatBlock", arg: "h2" },
  { kind: "cmd", label: "H2", title: "Mellanrubrik", cmd: "formatBlock", arg: "h3" },
  { kind: "cmd", label: "H3", title: "Liten rubrik", cmd: "formatBlock", arg: "h4" },
  { kind: "cmd", label: "¶", title: "Brödtext", cmd: "formatBlock", arg: "p" },
  { kind: "cmd", label: "❝", title: "Citat", cmd: "formatBlock", arg: "blockquote" },
  { kind: "sep" },
  { kind: "cmd", label: "• Lista", title: "Punktlista", cmd: "insertUnorderedList" },
  { kind: "cmd", label: "1. Lista", title: "Numrerad lista", cmd: "insertOrderedList" },
  { kind: "cmd", label: "⇤", title: "Minska indrag", cmd: "outdent" },
  { kind: "cmd", label: "⇥", title: "Öka indrag", cmd: "indent" },
  { kind: "sep" },
  { kind: "cmd", label: "⯇", title: "Vänsterställ", cmd: "justifyLeft" },
  { kind: "cmd", label: "⯈⯇", title: "Centrera", cmd: "justifyCenter" },
  { kind: "cmd", label: "⯈", title: "Högerställ", cmd: "justifyRight" },
  { kind: "sep" },
  { kind: "link" },
  { kind: "unlink" },
  { kind: "color" },
  { kind: "cmd", label: "―", title: "Avdelare", cmd: "insertHorizontalRule" },
  { kind: "cmd", label: "✕ format", title: "Rensa formatering", cmd: "removeFormat" },
  { kind: "sep" },
  { kind: "cmd", label: "⟲", title: "Ångra", cmd: "undo" },
  { kind: "cmd", label: "⟳", title: "Gör om", cmd: "redo" },
];

const btnClass =
  "rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:border-primary hover:text-foreground";

export function RichTextEditor({ value, onChange, placeholder }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el && el.innerHTML !== value) el.innerHTML = value;
  }, [value]);

  function exec(cmd: string, arg?: string) {
    ref.current?.focus();
    document.execCommand(cmd, false, arg);
    onChange(ref.current?.innerHTML ?? "");
  }

  return (
    <div className="rounded-md border border-border">
      <div className="flex flex-wrap items-center gap-1 border-b border-border p-2">
        {tools.map((t, i) => {
          if (t.kind === "sep")
            return <span key={`sep-${i}`} className="mx-1 h-5 w-px bg-border" />;
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
                }}
                className={btnClass}
              >
                Länk
              </button>
            );
          if (t.kind === "unlink")
            return (
              <button
                key="unlink"
                type="button"
                title="Ta bort länk"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => exec("unlink")}
                className={btnClass}
              >
                Ta bort länk
              </button>
            );
          if (t.kind === "color")
            return (
              <label
                key="color"
                title="Textfärg"
                className={`${btnClass} flex cursor-pointer items-center gap-1`}
                onMouseDown={(e) => e.preventDefault()}
              >
                Färg
                <input
                  type="color"
                  defaultValue="#c9a35b"
                  className="h-4 w-5 cursor-pointer border-0 bg-transparent p-0"
                  onChange={(e) => exec("foreColor", e.target.value)}
                />
              </label>
            );
          return (
            <button
              key={`${t.cmd}-${t.label}`}
              type="button"
              title={t.title}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => exec(t.cmd, t.arg)}
              className={btnClass}
            >
              {t.label}
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
        onPaste={(e) => {
          e.preventDefault();
          const text = e.clipboardData.getData("text/plain");
          document.execCommand("insertText", false, text);
          onChange(ref.current?.innerHTML ?? "");
        }}
        className="prose-editor min-h-[180px] bg-muted px-3 py-2 text-sm text-foreground outline-none"
      />
    </div>
  );
}
