import { useId, useMemo } from "react";

import { CheckOptions, rootsOf } from "./canonical";
import { StoreStep } from "./store";
import { Translations } from "./translations";

/**
 * How an exercise step is checked, for the teacher who authors it.
 *
 * The step on screen is the solution, so its roots are the ones on offer. A
 * root is ticked unless the teacher leaves it out, so a variable added to the
 * solution later is checked without anyone remembering to tick it.
 */
export function CheckSettings({
  step,
  onChange,
  t,
}: {
  step: StoreStep;
  onChange: (check: CheckOptions) => void;
  t: Translations;
}) {
  const roots = useMemo(() => rootsOf(step), [step]);
  const id = useId();
  const check = step.check ?? {};
  const ignored = new Set(check.ignoreRoots ?? []);

  // Only what differs from the default is written down, so that a diagram
  // whose teacher looked at the panel and changed nothing saves as it was.
  const update = (patch: Partial<CheckOptions>) => {
    const next: CheckOptions = { ...check, ...patch };
    if (!next.ignoreRoots?.length) delete next.ignoreRoots;
    if (next.extraRoots !== "forbid") delete next.extraRoots;
    if (!next.stringIdentity) delete next.stringIdentity;
    onChange(next);
  };

  const toggleRoot = (key: string, checked: boolean) => {
    const next = new Set(ignored);
    if (checked) next.delete(key);
    else next.add(key);
    // A root that no longer exists in the solution has nothing to ignore.
    update({ ignoreRoots: roots.map((r) => r.key).filter((k) => next.has(k)) });
  };

  return (
    <div className="jmp-fields step-bar__check-fields">
      <span className="jmp-field-label" title={t.checkRootsHint}>
        {t.checkRoots}
      </span>
      <div className="jmp-chips" role="group" aria-label={t.checkRoots}>
        {roots.length === 0 && (
          <span className="jmp-muted">{t.checkNoRoots}</span>
        )}
        {roots.map((root) => (
          <label key={root.key} className="jmp-chip" title={t.checkRootsHint}>
            <input
              type="checkbox"
              checked={!ignored.has(root.key)}
              onChange={(e) => toggleRoot(root.key, e.target.checked)}
            />
            <code>{root.name}</code>
            {root.frame && <span className="jmp-muted">{root.frame}</span>}
          </label>
        ))}
      </div>

      <label className="jmp-field-label" htmlFor={`${id}-extra`}>
        {t.checkExtraRoots}
      </label>
      <select
        id={`${id}-extra`}
        className="jmp-input"
        value={check.extraRoots ?? "allow"}
        onChange={(e) =>
          update({ extraRoots: e.target.value as CheckOptions["extraRoots"] })
        }
      >
        <option value="allow">{t.checkExtraRootsAllow}</option>
        <option value="forbid">{t.checkExtraRootsForbid}</option>
      </select>

      <span className="jmp-field-label">Strings</span>
      <label className="jmp-check" title={t.checkStringIdentityHint}>
        <input
          type="checkbox"
          checked={check.stringIdentity ?? false}
          onChange={(e) => update({ stringIdentity: e.target.checked })}
        />
        {t.checkStringIdentity}
      </label>
    </div>
  );
}

export default CheckSettings;
