import { Fragment, useEffect, useId, useRef, useState } from "react";

import { Translations } from "./translations";

/** One thing the toolbar offers. */
export type ToolbarItem = {
  key: string;
  /** Items of one group sit together, divided from the next by a hairline. */
  group: number;
  label: string;
  /** A glyph that stands in for the label in the row. */
  icon?: string;
  title?: string;
  onClick?: () => void;
  /** A link instead of a button. */
  href?: string;
  disabled?: boolean;
  /** Set for a toggle: whether it is on. */
  pressed?: boolean;
  /** The one filled button. */
  primary?: boolean;
};

const groupsOf = (items: ToolbarItem[]) => {
  const groups: ToolbarItem[][] = [];
  items.forEach((item) => {
    const last = groups[groups.length - 1];
    if (last && last[0].group === item.group) last.push(item);
    else groups.push([item]);
  });
  return groups;
};

/** An item as a button in the row. */
const RowItem = ({ item }: { item: ToolbarItem }) => {
  const iconOnly = Boolean(item.icon);
  const className = [
    iconOnly ? "button-icon" : "",
    item.primary ? "button-primary" : "button-ghost",
    item.pressed !== undefined ? "button-toggle" : "",
  ]
    .filter(Boolean)
    .join(" ");

  if (item.href) {
    return (
      <a
        className={className}
        href={item.href}
        target="_blank"
        rel="noreferrer noopener"
        title={item.title ?? item.label}
        aria-label={item.label}
      >
        {item.icon ?? item.label}
      </a>
    );
  }
  return (
    <button
      className={className}
      onClick={item.onClick}
      disabled={item.disabled}
      aria-pressed={item.pressed}
      title={item.title ?? (iconOnly ? item.label : undefined)}
      aria-label={iconOnly ? item.label : undefined}
    >
      {item.icon ?? item.label}
    </button>
  );
};

/**
 * The toolbar in the top-right corner: undo and redo, which a touch screen
 * has no keyboard shortcut for, and a menu holding everything else.
 *
 * The same in every layout. A row of every item wrapped into a block over the
 * diagram on a small screen, and on a large one it was a strip of buttons
 * mostly used once a lesson; a menu keeps the corner small and the diagram
 * the thing on screen.
 */
export function Toolbar({
  items,
  t,
}: {
  items: ToolbarItem[];
  t: Translations;
}) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const kept = items.filter((i) => i.key === "undo" || i.key === "redo");
  const folded = items.filter((i) => !kept.includes(i));

  // A menu closes when anything outside it is touched, and on Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    // Focus the first item, so a keyboard user lands in the menu they opened.
    menuRef.current
      ?.querySelector<HTMLElement>("[role^=menuitem]:not(:disabled)")
      ?.focus();
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  // Up and down move through the menu, the way they do in any menu.
  const onMenuKeyDown = (event: React.KeyboardEvent) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const entries = Array.from(
      menuRef.current?.querySelectorAll<HTMLElement>("[role^=menuitem]:not(:disabled)") ?? [],
    );
    const at = entries.indexOf(document.activeElement as HTMLElement);
    const next = event.key === "ArrowDown" ? at + 1 : at - 1;
    entries[(next + entries.length) % entries.length]?.focus();
  };

  const choose = (item: ToolbarItem) => {
    item.onClick?.();
    // A toggle stays open so its new state can be seen; anything else is done.
    if (item.pressed === undefined) setOpen(false);
  };

  return (
    <div className="jmp-toolbar-root" ref={rootRef}>
      <div className="jmp-toolbar jmp-panel" role="toolbar">
        {groupsOf(kept).map((group, i) => (
          <Fragment key={group[0].key}>
            {i > 0 && <span className="jmp-toolbar__sep" aria-hidden="true" />}
            {group.map((item) => (
              <RowItem key={item.key} item={item} />
            ))}
          </Fragment>
        ))}
        {folded.length > 0 && (
          <>
            {kept.length > 0 && (
              <span className="jmp-toolbar__sep" aria-hidden="true" />
            )}
            <button
              ref={triggerRef}
              className="button-icon button-ghost button-toggle"
              onClick={() => setOpen(!open)}
              aria-haspopup="menu"
              aria-expanded={open}
              aria-controls={`${id}-menu`}
              aria-pressed={open}
              title={t.menu}
              aria-label={t.menu}
            >
              <span className="jmp-burger" aria-hidden="true" />
            </button>
          </>
        )}
      </div>

      {open && (
        <div
          className="jmp-menu jmp-panel"
          id={`${id}-menu`}
          role="menu"
          aria-label={t.menu}
          ref={menuRef}
          onKeyDown={onMenuKeyDown}
        >
          {groupsOf(folded).map((group, i) => (
            <Fragment key={group[0].key}>
              {i > 0 && <div className="jmp-menu__sep" role="separator" />}
              {group.map((item) =>
                item.href ? (
                  <a
                    key={item.key}
                    role="menuitem"
                    className="jmp-menu__item"
                    href={item.href}
                    target="_blank"
                    rel="noreferrer noopener"
                    onClick={() => setOpen(false)}
                  >
                    <span className="jmp-menu__icon" aria-hidden="true">
                      {item.icon}
                    </span>
                    {item.label}
                  </a>
                ) : (
                  <button
                    key={item.key}
                    role={item.pressed !== undefined ? "menuitemcheckbox" : "menuitem"}
                    aria-checked={item.pressed}
                    className={`jmp-menu__item${item.primary ? " primary" : ""}`}
                    onClick={() => choose(item)}
                    disabled={item.disabled}
                    title={item.title}
                  >
                    <span className="jmp-menu__icon" aria-hidden="true">
                      {item.pressed !== undefined ? (item.pressed ? "✓" : "") : item.icon}
                    </span>
                    {item.label}
                  </button>
                ),
              )}
            </Fragment>
          ))}
        </div>
      )}
    </div>
  );
}

export default Toolbar;
