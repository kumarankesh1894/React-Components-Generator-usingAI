// app/dashboard/components/CollapsibleSection.jsx
"use client";

import { useState } from "react";
import { FaChevronDown, FaChevronRight } from "react-icons/fa";

export default function CollapsibleSection({ title, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border rounded shadow-sm mb-4 bg-white">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-3 font-semibold bg-gray-100 hover:bg-gray-200 transition"
      >
        <span>{title}</span>
        {isOpen ? <FaChevronDown /> : <FaChevronRight />}
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[1000px] p-4" : "max-h-0"
        }`}
      >
        {isOpen && children}
      </div>
    </div>
  );
}
