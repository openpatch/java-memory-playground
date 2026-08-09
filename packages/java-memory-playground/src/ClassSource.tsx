import { useEffect, useRef, useState } from "react";

import { Klasses } from "./memory";
import { parseJavaClasses, toJavaSource } from "./javaSource";
import { Translations } from "./translations";

/**
 * The classes of a diagram, written as Java.
 *
 * A teacher already has the classes in front of them — in a worksheet, in an
 * IDE, on a slide — so pasting them beats rebuilding them field by field
 * through dialogs. Only the structure is read: nothing here is executed, and
 * method bodies are skipped whole.
 */
export const ClassSource = ({
  klasses,
  onChange,
  t,
}: {
  klasses: Klasses;
  onChange: (klasses: Klasses) => void;
  t: Translations;
}) => {
  const [source, setSource] = useState(() => toJavaSource(klasses));
  const [problems, setProblems] = useState<string[]>([]);
  // What our own last parse produced, so a change made in the other tab can be
  // told apart from the echo of a change made here.
  const emitted = useRef(klasses);

  useEffect(() => {
    if (JSON.stringify(klasses) === JSON.stringify(emitted.current)) return;
    emitted.current = klasses;
    setSource(toJavaSource(klasses));
    setProblems([]);
  }, [klasses]);

  const handleChange = (next: string) => {
    setSource(next);
    const parsed = parseJavaClasses(next);
    setProblems(parsed.problems);
    // Half-written source is not a reason to throw the classes away, so an
    // unreadable state keeps the last ones and only says what is wrong.
    if (Object.keys(parsed.klasses).length === 0 && next.trim()) return;
    emitted.current = parsed.klasses;
    onChange(parsed.klasses);
  };

  return (
    <div>
      <p
        style={{
          margin: "0 0 12px 0",
          fontSize: "14px",
          color: "var(--jmp-text-muted)",
        }}
      >
        {t.classSourceHint}
      </p>
      <textarea
        value={source}
        onChange={(e) => handleChange(e.target.value)}
        spellCheck={false}
        placeholder={t.classSourcePlaceholder}
        style={{
          width: "100%",
          minHeight: "260px",
          padding: "12px",
          borderRadius: "6px",
          border: "1px solid var(--jmp-border)",
          fontFamily:
            "ui-monospace, SFMono-Regular, Menlo, Consolas, monospace",
          fontSize: "13px",
          lineHeight: 1.6,
          tabSize: 2,
          resize: "vertical",
          boxSizing: "border-box",
        }}
      />
      {problems.length > 0 && (
        <ul
          style={{
            margin: "12px 0 0 0",
            padding: "12px 12px 12px 32px",
            backgroundColor: "var(--jmp-warning-soft)",
            border: "1px solid var(--jmp-warning-soft)",
            borderRadius: "6px",
            color: "var(--jmp-warning-text)",
            fontSize: "13px",
          }}
        >
          {problems.map((problem) => (
            <li key={problem}>{problem}</li>
          ))}
        </ul>
      )}
    </div>
  );
};
