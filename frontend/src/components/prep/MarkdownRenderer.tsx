"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import "highlight.js/styles/github-dark.css";

export function MarkdownRenderer({ content }: { content: string }) {
  return (
    <div className="prose prose-sm prose-slate max-w-none">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          h1: ({ children }) => (
            <h1 className="text-xl font-bold text-slate-900 mb-4 mt-6 first:mt-0">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-lg font-semibold text-slate-800 mb-3 mt-6 border-b border-slate-200 pb-1">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-base font-semibold text-slate-700 mb-2 mt-4">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="text-sm text-slate-600 leading-relaxed mb-3">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc list-inside space-y-1 mb-3 text-sm text-slate-600">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside space-y-1 mb-3 text-sm text-slate-600">{children}</ol>
          ),
          li: ({ children }) => <li className="leading-relaxed pl-2">{children}</li>,
          strong: ({ children }) => <strong className="font-semibold text-slate-800">{children}</strong>,
          code: ({ className, children, ...props }) => {
            const isBlock = className?.includes("language-");
            return isBlock ? (
              <code className={className} {...props}>{children}</code>
            ) : (
              <code className="bg-slate-100 text-indigo-700 px-1.5 py-0.5 rounded text-xs font-mono" {...props}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="rounded-lg overflow-x-auto my-3">{children}</pre>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-indigo-300 pl-4 text-sm text-slate-500 italic my-3">
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4">
              <table className="min-w-full divide-y divide-slate-200 text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 bg-slate-50 text-left text-xs font-semibold text-slate-700 uppercase">{children}</th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-slate-600 border-t border-slate-100">{children}</td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
