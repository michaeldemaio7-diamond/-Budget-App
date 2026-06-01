"use client";

import { useState, useEffect } from "react";

interface CurrencyInputProps {
  value: number;
  onChange: (value: number) => void;
  onBlur?: () => void;
  className?: string;
  disabled?: boolean;
  placeholder?: string;
}

export default function CurrencyInput({
  value,
  onChange,
  onBlur,
  className = "",
  disabled = false,
  placeholder = "0.00",
}: CurrencyInputProps) {
  const [inputValue, setInputValue] = useState(value === 0 ? "" : String(value));

  useEffect(() => {
    setInputValue(value === 0 ? "" : String(value));
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/[^0-9.]/g, "");
    setInputValue(raw);
    const num = parseFloat(raw);
    if (!isNaN(num)) onChange(num);
    else if (raw === "" || raw === ".") onChange(0);
  };

  return (
    <div className="relative">
      <span className="absolute left-2 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
      <input
        type="text"
        inputMode="decimal"
        value={inputValue}
        onChange={handleChange}
        onBlur={onBlur}
        disabled={disabled}
        placeholder={placeholder}
        className={`pl-6 pr-2 py-1.5 border border-slate-200 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-slate-50 disabled:text-slate-400 ${className}`}
      />
    </div>
  );
}
