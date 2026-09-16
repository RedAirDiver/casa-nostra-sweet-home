import { useEffect, useRef } from "react";

type Props = {
  value: string;
  onChange: (html: string) => void;
  placeholder?: string;
};

const tools: { label: string; title: string; cmd: string; arg?: string }[] = [
  { label: "B", title: "Fet", cmd: "bold" },
  { label: "I", title: "Kursiv", cmd: "italic" },
  { label: "U", title: "Understruken", cmd: "underline" },
  { label: "H", title: "Rubrik", cmd: "formatBlock", arg: "h3" },
  { label: "¶", title: "Brödtext", cmd: "formatBlock", arg: "p" },
  { label: "• Lista", title: "Punktlista", cmd: "insertUnorderedList" },
  { label: "1. Lista", title: "Numrerad lista", cmd: "insertOrderedList" },
  { label: "⟲", title: "Ångra", cmd: "undo" },
];

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
      <div className="flex flex-wrap gap-1 border-b border-border p-2">
        {tools.map((t) => (
          <button
            key={t.label}
            type="button"
            title={t.title}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => exec(t.cmd, t.arg)}
            className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
          >
            {t.label}
          </button>
        ))}
        <button
          type="button"
          title="Länk"
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => {
            const url = prompt("Länkadress (https://…)");
            if (url) exec("createLink", url);
          }}
          className="rounded border border-border px-2 py-1 text-xs text-muted-foreground hover:text-foreground"
        >
          Länk
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        data-placeholder={placeholder ?? "Skriv ditt inlägg…"}
        onInput={(e) => onChange((e.target as HTMLDivElement).innerHTML)}
        className="prose-editor min-h-[140px] bg-muted px-3 py-2 text-sm text-foreground outline-none"
      />
    </div>
  );
}
