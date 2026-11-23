import * as React from "react";
import { Check, ChevronDown, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ComboboxItemData {
  id: string;
  label: string;
}

interface ComboboxContextValue {
  open: boolean;
  setOpen: (open: boolean) => void;
  selectedValue: string;
  selectValue: (value: string) => void;
  clearSelection: () => void;
  items: ComboboxItemData[];
  filteredItems: ComboboxItemData[];
  disabled: boolean;
  showClear: boolean;
  placeholder: string;
  inputValue: string;
  setInputValue: (value: string) => void;
  highlightedIndex: number;
  setHighlightedIndex: (index: number) => void;
  inputId: string;
  listId: string;
}

const ComboboxContext = React.createContext<ComboboxContextValue | null>(null);

interface ComboboxProps {
  items: ComboboxItemData[];
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  showClear?: boolean;
  children?: React.ReactNode;
}

function Combobox({
  items,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  placeholder = "Select...",
  disabled,
  showClear,
  children,
}: ComboboxProps) {
  const [open, setOpenState] = React.useState(false);
  const [uncontrolledValue, setUncontrolledValue] =
    React.useState<string>(defaultValue);
  // `typedValue` is non-null only while the user is actively filtering.
  // When null the input mirrors the selected item's label.
  const [typedValue, setTypedValue] = React.useState<string | null>(null);
  const [highlightedIndex, setHighlightedIndex] = React.useState(-1);
  const rootRef = React.useRef<HTMLDivElement>(null);
  const inputId = React.useId();
  const listId = React.useId();

  const isControlled = controlledValue !== undefined;
  const selectedValue = isControlled ? controlledValue : uncontrolledValue;
  const selectedItem = items.find((item) => item.id === selectedValue);
  const inputValue = typedValue ?? selectedItem?.label ?? "";

  const filteredItems = React.useMemo(() => {
    if (!typedValue) return items;
    const query = typedValue.toLowerCase();
    return items.filter((item) => item.label.toLowerCase().includes(query));
  }, [items, typedValue]);

  const setOpen = (next: boolean) => {
    setOpenState(next);
    if (!next) {
      setTypedValue(null);
      setHighlightedIndex(-1);
    }
  };

  const commitValue = (next: string) => {
    if (!isControlled) setUncontrolledValue(next);
    onValueChange?.(next);
  };

  const selectValue = (next: string) => {
    commitValue(next);
    setOpen(false);
  };

  const clearSelection = () => {
    commitValue("");
    setTypedValue(null);
    setHighlightedIndex(-1);
    setOpenState(true);
  };

  // Close and revert the input text when clicking outside the combobox.
  React.useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpenState(false);
        setTypedValue(null);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () =>
      document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <ComboboxContext.Provider
      value={{
        open,
        setOpen,
        selectedValue,
        selectValue,
        clearSelection,
        items,
        filteredItems,
        disabled: disabled ?? false,
        showClear: showClear ?? false,
        placeholder,
        inputValue,
        setInputValue: (value: string) => {
          setTypedValue(value);
          setHighlightedIndex(-1);
          setOpenState(true);
        },
        highlightedIndex,
        setHighlightedIndex,
        inputId,
        listId,
      }}
    >
      <div ref={rootRef} className="relative w-full">
        {children}
      </div>
    </ComboboxContext.Provider>
  );
}
Combobox.displayName = "Combobox";

interface ComboboxInputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  showClear?: boolean;
  showTrigger?: boolean;
}

const ComboboxInput = React.forwardRef<HTMLInputElement, ComboboxInputProps>(
  (
    {
      className,
      placeholder,
      showClear,
      showTrigger = true,
      onKeyDown,
      ...props
    },
    ref,
  ) => {
    const context = React.useContext(ComboboxContext);

    if (!context) {
      throw new Error(
        "ComboboxInput must be used within a Combobox component",
      );
    }

    const {
      open,
      setOpen,
      selectedValue,
      clearSelection,
      disabled,
      showClear: contextShowClear,
      inputValue,
      setInputValue,
      filteredItems,
      highlightedIndex,
      setHighlightedIndex,
      selectValue,
      placeholder: contextPlaceholder,
      listId,
    } = context;

    const canClear = (showClear ?? contextShowClear) && selectedValue;

    const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
      onKeyDown?.(event);
      if (event.defaultPrevented) return;

      switch (event.key) {
        case "ArrowDown":
          event.preventDefault();
          if (!open) {
            setOpen(true);
          } else if (filteredItems.length > 0) {
            setHighlightedIndex(
              highlightedIndex >= filteredItems.length - 1
                ? 0
                : highlightedIndex + 1,
            );
          }
          break;
        case "ArrowUp":
          event.preventDefault();
          if (!open) {
            setOpen(true);
          } else if (filteredItems.length > 0) {
            setHighlightedIndex(
              highlightedIndex <= 0
                ? filteredItems.length - 1
                : highlightedIndex - 1,
            );
          }
          break;
        case "Enter": {
          if (!open) break;
          const item =
            filteredItems[highlightedIndex] ?? filteredItems[0];
          if (item) {
            event.preventDefault();
            selectValue(item.id);
          }
          break;
        }
        case "Escape":
          if (open) {
            event.preventDefault();
            setOpen(false);
          }
          break;
        case "Tab":
          if (open) setOpen(false);
          break;
      }
    };

    return (
      <div className="relative">
        <input
          ref={ref}
          id={context.inputId}
          type="text"
          role="combobox"
          aria-expanded={open}
          aria-controls={open ? listId : undefined}
          aria-autocomplete="list"
          aria-activedescendant={
            open && highlightedIndex >= 0
              ? `${listId}-option-${highlightedIndex}`
              : undefined
          }
          autoComplete="off"
          spellCheck={false}
          placeholder={placeholder ?? contextPlaceholder}
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          onFocus={() => setOpen(true)}
          onKeyDown={handleKeyDown}
          className={cn(
            "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm",
            "ring-offset-background placeholder:text-muted-foreground",
            "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
            "disabled:cursor-not-allowed disabled:opacity-50",
            showTrigger || canClear ? "pr-16" : "pr-3",
            className,
          )}
          disabled={disabled}
          {...props}
        />
        <div className="absolute inset-y-0 right-2 flex items-center gap-0.5">
          {canClear && (
            <button
              type="button"
              tabIndex={-1}
              aria-label="Clear selection"
              onMouseDown={(event) => event.preventDefault()}
              onClick={clearSelection}
              className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
          {showTrigger && (
            <button
              type="button"
              tabIndex={-1}
              aria-label={open ? "Close options" : "Open options"}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => setOpen(!open)}
              className="flex h-6 w-6 items-center justify-center rounded-sm text-muted-foreground hover:bg-accent hover:text-accent-foreground"
              disabled={disabled}
            >
              <ChevronDown
                className={cn(
                  "h-4 w-4 transition-transform",
                  open && "rotate-180",
                )}
              />
            </button>
          )}
        </div>
      </div>
    );
  },
);
ComboboxInput.displayName = "ComboboxInput";

const ComboboxContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(ComboboxContext);

  if (!context) {
    throw new Error(
      "ComboboxContent must be used within a Combobox component",
    );
  }

  if (!context.open) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full overflow-y-auto rounded-md border bg-popover text-popover-foreground shadow-md",
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
});
ComboboxContent.displayName = "ComboboxContent";

const ComboboxEmpty = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, children, ...props }, ref) => {
  const context = React.useContext(ComboboxContext);

  if (!context || !context.open) return null;
  if (context.filteredItems.length > 0) return null;

  return (
    <div
      ref={ref}
      className={cn(
        "py-6 text-center text-sm text-muted-foreground",
        className,
      )}
      {...props}
    >
      {children || "No results."}
    </div>
  );
});
ComboboxEmpty.displayName = "ComboboxEmpty";

type ComboboxListRenderItem = (
  item: ComboboxItemData,
  index: number,
) => React.ReactNode;

interface ComboboxListProps {
  children: ComboboxListRenderItem;
  className?: string;
}

const ComboboxList = React.forwardRef<HTMLUListElement, ComboboxListProps>(
  ({ children, className }, ref) => {
    const context = React.useContext(ComboboxContext);

    if (!context) {
      throw new Error("ComboboxList must be used within a Combobox component");
    }

    const { filteredItems, listId } = context;

    if (filteredItems.length === 0) {
      return null;
    }

    return (
      <ul
        ref={ref}
        id={listId}
        role="listbox"
        className={cn("flex flex-col p-1", className)}
      >
        {filteredItems.map((item, index) => children(item, index))}
      </ul>
    );
  },
);
ComboboxList.displayName = "ComboboxList";

interface ComboboxItemProps extends React.ComponentPropsWithoutRef<"li"> {
  value: string;
  children: React.ReactNode;
}

const ComboboxItem = React.forwardRef<HTMLLIElement, ComboboxItemProps>(
  ({ children, value, className, ...props }, ref) => {
    const context = React.useContext(ComboboxContext);

    if (!context) {
      throw new Error("ComboboxItem must be used within a Combobox component");
    }

    const {
      selectedValue,
      selectValue,
      filteredItems,
      highlightedIndex,
      setHighlightedIndex,
      listId,
    } = context;

    const index = filteredItems.findIndex((item) => item.id === value);
    const isSelected = selectedValue === value;
    const isHighlighted = index === highlightedIndex;

    return (
      <li
        ref={ref}
        id={`${listId}-option-${index}`}
        role="option"
        aria-selected={isSelected}
        className={cn(
          "relative flex cursor-pointer select-none items-center gap-2 rounded-sm",
          "px-2 py-1.5 text-sm",
          "hover:bg-accent hover:text-accent-foreground",
          isHighlighted && "bg-accent text-accent-foreground",
          isSelected && "font-medium",
          className,
        )}
        onMouseDown={(event) => event.preventDefault()}
        onMouseEnter={() => setHighlightedIndex(index)}
        onClick={() => selectValue(value)}
        {...props}
      >
        <span className="flex-1">{children}</span>
        {isSelected && <Check className="h-4 w-4 shrink-0" />}
      </li>
    );
  },
);
ComboboxItem.displayName = "ComboboxItem";

export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
};
