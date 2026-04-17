"use client";
import { InlineMath, BlockMath } from "react-katex";

interface MathTextProps {
  text: string;
  className?: string;
}

// Splits a string into alternating plain-text and LaTeX segments.
// Supports $$...$$ (block) and $...$ (inline) delimiters.
const MATH_REGEX = /(\$\$[\s\S]+?\$\$|\$[^$\n]+?\$)/g;

export default function MathText({ text, className }: MathTextProps) {
  const segments = text.split(MATH_REGEX);

  return (
    <span className={className}>
      {segments.map((seg, i) => {
        if (seg.startsWith("$$") && seg.endsWith("$$")) {
          return <BlockMath key={i} math={seg.slice(2, -2)} />;
        }
        if (seg.startsWith("$") && seg.endsWith("$")) {
          return <InlineMath key={i} math={seg.slice(1, -1)} />;
        }
        return <span key={i}>{seg}</span>;
      })}
    </span>
  );
}
