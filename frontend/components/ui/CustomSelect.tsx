"use client";

import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { ChevronDown } from "lucide-react";

export type Option = {
  value: string;
  label: React.ReactNode;
};

type CustomSelectProps = {
  value: string;
  onChange: (val: string) => void;
  options: Option[];
  className?: string;
  placeholder?: string;
};

export default function CustomSelect({
  value,
  onChange,
  options,
  className = "",
  placeholder = "เลือก...",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
  }, []);

  // Update position when opened
  useEffect(() => {
    if (isOpen && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + 6,
        left: rect.left,
        minWidth: Math.max(rect.width, 120),
      });
    }
  }, [isOpen]);

  // Handle scroll to close
  useEffect(() => {
    const handleScroll = (e: Event) => {
      // Don't close if they are scrolling inside the dropdown itself
      if (dropdownRef.current && dropdownRef.current.contains(e.target as Node)) {
        return;
      }
      if (isOpen) setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("scroll", handleScroll, true);
    }
    return () => window.removeEventListener("scroll", handleScroll, true);
  }, [isOpen]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node) &&
        (!dropdownRef.current || !dropdownRef.current.contains(e.target as Node))
      ) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between gap-2 rounded-xl border-2 border-white/60 bg-white/80 px-3 py-1.5 text-xs font-body font-semibold text-slate-800 shadow-sm transition-all duration-300 hover:bg-white hover:border-primary-light/50 focus:border-primary-light focus:bg-white focus:outline-none focus:ring-4 focus:ring-primary/10"
      >
        <span className="truncate">{selectedOption ? selectedOption.label : placeholder}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 text-foreground-muted transition-transform duration-200 ${
            isOpen ? "rotate-180 text-primary" : ""
          }`}
        />
      </button>

      {isMounted && isOpen && createPortal(
        <div
          ref={dropdownRef}
          style={dropdownStyle}
          className="fixed z-[99999] rounded-xl border border-white/60 bg-white/95 p-1.5 shadow-2xl backdrop-blur-xl animate-scale-in origin-top-left"
        >
          <ul className="flex max-h-48 flex-col gap-0.5 overflow-y-auto scrollbar-none">
            {options.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  onClick={() => {
                    onChange(opt.value);
                    setIsOpen(false);
                  }}
                  className={`flex w-full items-center rounded-lg px-3 py-2 text-left text-xs font-body transition-all duration-200 ${
                    opt.value === value
                      ? "bg-primary-pale/60 font-bold text-primary-dark"
                      : "text-slate-700 hover:bg-surface hover:text-slate-900 font-medium"
                  }`}
                >
                  {opt.label}
                </button>
              </li>
            ))}
          </ul>
        </div>,
        document.body
      )}
    </div>
  );
}
