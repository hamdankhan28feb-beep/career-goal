'use client';

import type { InputHTMLAttributes } from 'react';
import { Search, X } from 'lucide-react';

type SearchInputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> & {
  value: string;
  onValueChange: (value: string) => void;
  /** Show a clear (X) button while there is a value. */
  clearable?: boolean;
  wrapperClassName?: string;
};

/** Shared search field: icon, input-field styling, optional clear button with a 40px tap target. */
export function SearchInput({
  value,
  onValueChange,
  clearable = false,
  wrapperClassName = '',
  className = '',
  type = 'search',
  ...rest
}: SearchInputProps) {
  return (
    <div className={`relative ${wrapperClassName}`}>
      <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
      <input
        type={type}
        value={value}
        onChange={(e) => onValueChange(e.target.value)}
        className={`input-field input-with-icon ${clearable ? 'input-with-action' : ''} ${className}`}
        {...rest}
      />
      {clearable && value ? (
        <button
          type="button"
          onClick={() => onValueChange('')}
          aria-label="Clear search"
          className="btn-icon absolute right-1 top-1/2 -translate-y-1/2"
        >
          <X className="h-4 w-4" />
        </button>
      ) : null}
    </div>
  );
}
