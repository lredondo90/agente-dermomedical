"use client";

// Casilla que marca o desmarca de golpe las clínicas de un grupo (una ciudad) o todas las visibles.
export function SelectAll({ group, label }: { group?: string; label: string }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-normal">
      <input
        type="checkbox"
        onChange={(e) => {
          const selector = group ? `input[name="id"][data-group="${CSS.escape(group)}"]` : 'input[name="id"]';
          document.querySelectorAll<HTMLInputElement>(selector).forEach((cb) => {
            if (!cb.disabled) cb.checked = e.currentTarget.checked;
          });
        }}
      />
      {label}
    </label>
  );
}
