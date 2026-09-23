"use client";

import { useMemo } from "react";
import { marked } from "marked";

interface Props {
  content: string;
}

export default function MarkdownRenderer({ content }: Props) {
  const html = useMemo(() => {
    if (!content) return "";
    return marked.parse(content, {
      gfm: true,
      breaks: true,
    });
  }, [content]);

  return (
    <div
      className="prose prose-invert max-w-none 
        prose-headings:font-black prose-headings:tracking-tight prose-headings:text-white
        prose-h1:text-2xl prose-h1:border-b prose-h1:border-white/10 prose-h1:pb-2 prose-h1:mb-4
        prose-h2:text-xl prose-h2:mt-6 prose-h2:mb-3
        prose-h3:text-lg prose-h3:mt-4 prose-h3:mb-2
        prose-p:text-gray-300 prose-p:leading-relaxed prose-p:text-sm prose-p:my-2
        prose-a:text-brand-400 prose-a:underline hover:prose-a:text-brand-300
        prose-code:text-brand-300 prose-code:bg-dark-900 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
        prose-pre:bg-dark-900 prose-pre:border prose-pre:border-white/10 prose-pre:rounded-xl prose-pre:p-4 prose-pre:my-3
        prose-ul:list-disc prose-ul:pl-5 prose-ul:text-sm prose-ul:text-gray-300 prose-ul:my-2
        prose-ol:list-decimal prose-ol:pl-5 prose-ol:text-sm prose-ol:text-gray-300 prose-ol:my-2
        prose-li:my-1
        prose-blockquote:border-l-4 prose-blockquote:border-brand-500 prose-blockquote:pl-4 prose-blockquote:italic prose-blockquote:text-gray-400
        prose-hr:border-white/10 prose-hr:my-6
        prose-table:w-full prose-table:text-left prose-table:text-xs
        prose-th:border-b prose-th:border-white/15 prose-th:py-2 prose-th:text-white
        prose-td:border-b prose-td:border-white/5 prose-td:py-2 prose-td:text-gray-300"
      dangerouslySetInnerHTML={{ __html: html as string }}
    />
  );
}
