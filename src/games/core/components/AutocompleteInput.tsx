/**
 * Debounced catalogue autocomplete for typed-answer dailies.
 *
 * It is an input convenience, never a clue system: suggestions come from a
 * broad public catalogue, nothing is highlighted as "correct", and free
 * text can always be submitted directly (aliases still work).
 */
import {
  forwardRef,
  useCallback,
  useEffect,
  useId,
  useImperativeHandle,
  useRef,
  useState,
} from "react";

export interface Suggestion {
  label: string;
  hint?: string;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (value: string) => void;
  /** Resolve suggestions for a query. Return [] to show nothing. */
  search: (query: string) => Promise<Suggestion[]>;
  /** Labels already used — filtered out of the list. */
  exclude?: string[];
  placeholder?: string;
  disabled?: boolean;
  label: string;
}

const DEBOUNCE_MS = 180;

function norm(v: string): string {
  return v
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export const AutocompleteInput = forwardRef<HTMLInputElement, Props>(function AutocompleteInput(
  { value, onChange, onSubmit, search, exclude = [], placeholder, disabled, label },
  ref,
) {
  const inputRef = useRef<HTMLInputElement>(null);
  useImperativeHandle(ref, () => inputRef.current as HTMLInputElement, []);

  const listId = useId();
  const [items, setItems] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const requestId = useRef(0);
  const blockNext = useRef(false);

  const excluded = useRef<Set<string>>(new Set());
  excluded.current = new Set(exclude.map(norm));

  useEffect(() => {
    const query = value.trim();
    if (blockNext.current) {
      blockNext.current = false;
      return;
    }
    if (query.length < 2) {
      setItems([]);
      setOpen(false);
      setLoading(false);
      return;
    }
    setLoading(true);
    const id = ++requestId.current;
    const timer = window.setTimeout(() => {
      void search(query)
        .then((found) => {
          if (id !== requestId.current) return; // A newer keystroke won.
          setItems(found.filter((s) => !excluded.current.has(norm(s.label))).slice(0, 8));
          setActive(-1);
          setOpen(true);
        })
        .catch(() => {
          if (id === requestId.current) setItems([]);
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false);
        });
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [value, search]);

  const choose = useCallback(
    (suggestion: Suggestion) => {
      requestId.current++;
      blockNext.current = true;
      setOpen(false);
      setItems([]);
      setActive(-1);
      onSubmit(suggestion.label);
      inputRef.current?.focus();
    },
    [onSubmit],
  );

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      setOpen(false);
      setActive(-1);
      return;
    }
    if (!open || items.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => (a + 1) % items.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => (a <= 0 ? items.length - 1 : a - 1));
    } else if (e.key === "Enter" && active >= 0) {
      e.preventDefault();
      choose(items[active]!);
    }
  };

  const showList = open && value.trim().length >= 2;

  return (
    <div className="relative">
      <input
        ref={inputRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        onFocus={() => value.trim().length >= 2 && setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 120)}
        placeholder={placeholder}
        aria-label={label}
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="none"
        spellCheck={false}
        disabled={disabled}
        className="w-full min-w-0 border border-border bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground/60 focus:border-gold disabled:opacity-60"
      />

      {showList && (
        <ul
          id={listId}
          role="listbox"
          aria-label="Suggestions"
          /* Anchored to the field and scroll-capped so the on-screen
             keyboard never buries it and the board never jumps. */
          className="absolute left-0 right-0 top-full z-30 max-h-56 overflow-y-auto border border-border bg-popover shadow-lg"
        >
          {items.length === 0 ? (
            <li className="px-4 py-3 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {loading ? "Searching…" : "No match — press Guess to submit anyway"}
            </li>
          ) : (
            items.map((s, i) => (
              <li
                key={`${s.label}-${i}`}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => choose(s)}
                onMouseEnter={() => setActive(i)}
                className={`flex cursor-pointer items-baseline justify-between gap-3 border-b border-border/50 px-4 py-2.5 text-sm last:border-b-0 ${
                  i === active ? "bg-muted text-foreground" : "text-foreground/90"
                }`}
              >
                <span className="min-w-0 truncate">{s.label}</span>
                {s.hint && (
                  <span className="shrink-0 text-[10px] uppercase tracking-[0.18em] text-muted-foreground/70">
                    {s.hint}
                  </span>
                )}
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
});
