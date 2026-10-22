import { forwardRef, useEffect, useRef, useState } from "react";

export type SelectOption = {
  label: string;
  value: string;
};

type SelectDropdownProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  // Adds a filter box above the options and caps the list height — for long
  // lists (e.g. a respondent group with many supervisors).
  searchable?: boolean;
  searchPlaceholder?: string;
  // Tapping the selected option again clears it (onChange("")).
  allowDeselect?: boolean;
  ariaLabelledBy?: string;
  ariaRequired?: boolean;
};

const SelectDropdown = forwardRef<HTMLButtonElement, SelectDropdownProps>(
  (
    {
      id,
      value,
      onChange,
      options,
      placeholder = "Select",
      error = false,
      searchable = false,
      searchPlaceholder = "Search...",
      allowDeselect = false,
      ariaLabelledBy,
      ariaRequired,
    },
    ref
  ) => {
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const wrapRef = useRef<HTMLDivElement>(null);
    const selected = options.find((o) => o.value === value);
    const query = search.trim().toLowerCase();
    const visible =
      searchable && query
        ? options.filter((o) => o.label.toLowerCase().includes(query))
        : options;

    useEffect(() => {
      if (!open) return;
      const onPointerDown = (e: MouseEvent) => {
        if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
      };
      const onKey = (e: KeyboardEvent) => {
        if (e.key === "Escape") setOpen(false);
      };
      document.addEventListener("mousedown", onPointerDown);
      document.addEventListener("keydown", onKey);
      return () => {
        document.removeEventListener("mousedown", onPointerDown);
        document.removeEventListener("keydown", onKey);
      };
    }, [open]);

    return (
      <div ref={wrapRef} className="relative mt-2">
        <button
          ref={ref}
          id={id}
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          aria-labelledby={ariaLabelledBy ? `${ariaLabelledBy} ${id ?? ""}`.trim() : undefined}
          aria-required={ariaRequired || undefined}
          onClick={() => {
            setSearch("");
            setOpen((v) => !v);
          }}
          className={`w-full rounded-full border bg-white px-4 py-2.5 text-sm text-left flex items-center justify-between gap-2 outline-none transition focus:border-black focus:ring-2 focus:ring-black/10 ${
            open ? "border-black ring-2 ring-black/10" : "border-border-soft"
          } ${error ? "animate-blink-error" : ""}`}
        >
          <span className={selected ? "" : "text-placeholder"}>
            {selected ? selected.label : placeholder}
          </span>
          <svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            className={`shrink-0 text-muted transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          >
            <path
              d="M5 7.5 10 12.5 15 7.5"
              stroke="currentColor"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>

        {open && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-2xl border border-border-soft bg-white p-1.5 shadow-[0_12px_30px_-8px_rgba(0,0,0,0.18)] animate-fade-in">
          {searchable && (
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={searchPlaceholder}
              aria-label={searchPlaceholder}
              className="mb-1.5 w-full rounded-full border border-border-soft bg-surface-soft px-4 py-2.5 text-sm outline-none focus:border-black focus:ring-2 focus:ring-black/10"
            />
          )}
          <ul
            role="listbox"
            aria-labelledby={ariaLabelledBy}
            className={searchable ? "nice-scrollbar max-h-60 overflow-y-auto" : undefined}
          >
            {searchable && visible.length === 0 && (
              <li className="px-3.5 py-2.5 text-sm text-placeholder">
                No matches found.
              </li>
            )}
            {visible.map((opt) => {
              const isSelected = opt.value === value;
              return (
                <li key={opt.value} role="option" aria-selected={isSelected}>
                  <button
                    type="button"
                    onClick={() => {
                      onChange(allowDeselect && isSelected ? "" : opt.value);
                      setOpen(false);
                    }}
                    className={`w-full rounded-xl px-3.5 py-2.5 text-sm text-left flex items-center justify-between gap-2 transition ${
                      isSelected
                        ? "bg-brand/10 text-brand font-medium"
                        : "text-muted-dark hover:bg-surface"
                    }`}
                  >
                    {opt.label}
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
                        <path
                          d="m5 10.5 3.5 3.5 6.5-7"
                          stroke="currentColor"
                          strokeWidth="1.8"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
          </div>
        )}
      </div>
    );
  }
);

SelectDropdown.displayName = "SelectDropdown";

export default SelectDropdown;
