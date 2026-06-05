import type { Components } from 'react-markdown'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'

interface Props {
  content: string
}

const components: Components = {
  h1: ({ children, ...props }) => (
    <h1 className="mt-4 mb-2 text-xl font-bold text-slate-800 first:mt-0" {...props}>
      {children}
    </h1>
  ),
  h2: ({ children, ...props }) => (
    <h2 className="mt-3 mb-1.5 text-lg font-semibold text-slate-800 first:mt-0" {...props}>
      {children}
    </h2>
  ),
  h3: ({ children, ...props }) => (
    <h3 className="mt-2.5 mb-1 text-base font-semibold text-slate-800 first:mt-0" {...props}>
      {children}
    </h3>
  ),
  h4: ({ children, ...props }) => (
    <h4 className="mt-2 mb-1 text-sm font-semibold text-slate-800 first:mt-0" {...props}>
      {children}
    </h4>
  ),
  p: ({ children, ...props }) => (
    <p className="my-1.5 leading-relaxed first:mt-0 last:mb-0" {...props}>
      {children}
    </p>
  ),
  ul: ({ children, ...props }) => (
    <ul className="my-1.5 list-disc space-y-0.5 pl-5" {...props}>
      {children}
    </ul>
  ),
  ol: ({ children, ...props }) => (
    <ol className="my-1.5 list-decimal space-y-0.5 pl-5" {...props}>
      {children}
    </ol>
  ),
  li: ({ children, ...props }) => (
    <li className="leading-relaxed" {...props}>
      {children}
    </li>
  ),
  strong: ({ children, ...props }) => (
    <strong className="font-semibold text-slate-900" {...props}>
      {children}
    </strong>
  ),
  code: ({ className, children, ...props }) => {
    // 行内代码
    const isInline = !className
    if (isInline) {
      return (
        <code
          className="rounded bg-slate-200 px-1 py-0.5 text-xs font-mono text-slate-800"
          {...props}
        >
          {children}
        </code>
      )
    }
    // 代码块 — 样式由 pre 组件处理，此处仅透传
    return (
      <code className={className || ''} {...props}>
        {children}
      </code>
    )
  },
  pre: ({ children, ...props }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-slate-800 p-3 text-xs font-mono text-slate-100" {...props}>
      {children}
    </pre>
  ),
  blockquote: ({ children, ...props }) => (
    <blockquote
      className="my-1.5 border-l-4 border-blue-400 bg-blue-50/50 py-1 pl-3 pr-2 text-slate-700"
      {...props}
    >
      {children}
    </blockquote>
  ),
  table: ({ children, ...props }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-xs" {...props}>
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }) => (
    <thead className="bg-slate-100" {...props}>
      {children}
    </thead>
  ),
  th: ({ children, ...props }) => (
    <th className="border border-slate-300 px-2 py-1 text-left font-semibold" {...props}>
      {children}
    </th>
  ),
  td: ({ children, ...props }) => (
    <td className="border border-slate-300 px-2 py-1" {...props}>
      {children}
    </td>
  ),
  hr: (props) => <hr className="my-3 border-slate-200" {...props} />,
  a: ({ children, href, ...props }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline hover:text-blue-800"
      {...props}
    >
      {children}
    </a>
  ),
}

export default function Markdown({ content }: Props) {
  return (
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {content}
    </ReactMarkdown>
  )
}
