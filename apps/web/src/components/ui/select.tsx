"use client";

import * as React from "react";
import { ChevronDown, Check } from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Context ──────────────────────────────────────────────────────────────────

interface SelectContextValue {
  value: string;
  onValueChange: (val: string) => void;
  open: boolean;
  setOpen: (open: boolean) => void;
  placeholder?: string;
}

const SelectContext = React.createContext<SelectContextValue>({
  value: "",
  onValueChange: () => {},
  open: false,
  setOpen: () => {},
});

// ─── Root ─────────────────────────────────────────────────────────────────────

interface SelectProps {
  value?: string;
  defaultValue?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  disabled?: boolean;
}

function Select({ value: controlledValue, defaultValue = "", onValueChange, children, disabled }: SelectProps) {
  const [uncontrolledValue, setUncontrolledValue] = React.useState(defaultValue);
  const [open, setOpen] = React.useState(false);
  const value = controlledValue ?? uncontrolledValue;

  const handleValueChange = (val: string) => {
    setUncontrolledValue(val);
    onValueChange?.(val);
    setOpen(false);
  };

  // Close on outside click
  const ref = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <SelectContext.Provider value={{ value, onValueChange: handleValueChange, open, setOpen }}>
      <div ref={ref} className="relative" data-disabled={disabled}>
        {children}
      </div>
    </SelectContext.Provider>
  );
}

// ─── Trigger ──────────────────────────────────────────────────────────────────

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement>
>(({ className, children, ...props }, ref) => {
  const { open, setOpen } = React.useContext(SelectContext);
  return (
    <button
      ref={ref}
      type="button"
      role="combobox"
      aria-expanded={open}
      onClick={() => setOpen(!open)}
      className={cn(
        "flex h-10 w-full items-center justify-between rounded-lg border border-input bg-background px-3 py-2 text-sm",
        "ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        className
      )}
      {...props}
    >
      {children}
      <ChevronDown className={cn("h-4 w-4 text-muted-foreground opacity-50 transition-transform duration-200", open && "rotate-180")} />
    </button>
  );
});
SelectTrigger.displayName = "SelectTrigger";

// ─── Value ────────────────────────────────────────────────────────────────────

function SelectValue({ placeholder }: { placeholder?: string }) {
  const { value } = React.useContext(SelectContext);
  // Find label from context - we store it via a ref trick
  const labelRef = React.useContext(SelectLabelContext);
  const label = labelRef.get(value);

  return (
    <span className={cn("block truncate", !value && "text-muted-foreground")}>
      {value ? (label ?? value) : placeholder}
    </span>
  );
}

// ─── Label context (maps value → display label) ───────────────────────────────

const SelectLabelContext = React.createContext<Map<string, string>>(new Map());

// ─── Content ──────────────────────────────────────────────────────────────────

function SelectContent({
  className,
  children,
  position = "popper",
}: {
  className?: string;
  children: React.ReactNode;
  position?: "popper" | "item-aligned";
}) {
  const { open } = React.useContext(SelectContext);
  const [labelMap] = React.useState(() => new Map<string, string>());

  if (!open) return null;

  return (
    <SelectLabelContext.Provider value={labelMap}>
      <div
        className={cn(
          "absolute left-0 top-full z-50 mt-1 w-full min-w-[8rem] overflow-hidden rounded-lg border border-border bg-white dark:bg-gray-900 shadow-lg",
          "animate-in fade-in-0 zoom-in-95",
          className
        )}
      >
        <div className="max-h-60 overflow-y-auto p-1">
          {children}
        </div>
      </div>
    </SelectLabelContext.Provider>
  );
}

// ─── Item ─────────────────────────────────────────────────────────────────────

function SelectItem({
  value,
  children,
  className,
  disabled,
}: {
  value: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  const { value: selectedValue, onValueChange } = React.useContext(SelectContext);
  const labelMap = React.useContext(SelectLabelContext);
  const isSelected = selectedValue === value;

  // Register label
  const label = typeof children === "string" ? children : value;
  labelMap.set(value, label);

  return (
    <div
      role="option"
      aria-selected={isSelected}
      data-disabled={disabled}
      onClick={() => !disabled && onValueChange(value)}
      className={cn(
        "relative flex w-full cursor-pointer select-none items-center rounded-md px-3 py-2 text-sm outline-none",
        "hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors duration-150",
        isSelected && "bg-gray-100 dark:bg-gray-800 font-medium",
        disabled && "pointer-events-none opacity-50",
        className
      )}
    >
      <span className="flex-1 truncate">{children}</span>
      {isSelected && <Check className="h-4 w-4 text-primary ml-2 flex-shrink-0" />}
    </div>
  );
}

// ─── Group / Label ────────────────────────────────────────────────────────────

function SelectGroup({ children }: { children: React.ReactNode }) {
  return <div role="group">{children}</div>;
}

function SelectLabel({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("px-3 py-1.5 text-xs font-semibold text-muted-foreground", className)}>
      {children}
    </div>
  );
}

function SelectSeparator({ className }: { className?: string }) {
  return <div className={cn("-mx-1 my-1 h-px bg-border", className)} />;
}

// ─── Simple native select (backward compat) ───────────────────────────────────

interface NativeSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { value: string; label: string }[];
}

function NativeSelect({ className, options, children, ...props }: NativeSelectProps) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "disabled:cursor-not-allowed disabled:opacity-50 transition-all duration-200",
        "appearance-none",
        className
      )}
      {...props}
    >
      {options
        ? options.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))
        : children}
    </select>
  );
}

export {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
  SelectLabel,
  SelectSeparator,
  NativeSelect,
};

// Default export for backward compatibility
export default NativeSelect;
