"use client";

import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function MathRenderer({ text }: { text: string }) {
  if (!text) return null;

  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({node, ...props}) => <span {...props} />, // Render paragraphs as spans to avoid hydration errors inside <p>
      }}
    >
      {text}
    </ReactMarkdown>
  );
}
