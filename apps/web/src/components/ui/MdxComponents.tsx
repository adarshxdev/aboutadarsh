import type { MDXComponents } from 'mdx/types'

/**
 * MDX renderers. Tables and pre blocks scroll inside their own container so
 * they can never widen the page — plan.md §6.
 */
export const mdxComponents: MDXComponents = {
  h2: (props) => (
    <h2 className="mt-12 mb-4 text-[length:var(--text-step-2)] font-semibold first:mt-0" {...props} />
  ),
  h3: (props) => <h3 className="mt-8 mb-3 text-[length:var(--text-step-1)] font-semibold" {...props} />,
  p: (props) => <p className="mb-5 text-fg-muted" {...props} />,
  ul: (props) => <ul className="mb-5 space-y-2" {...props} />,
  ol: (props) => <ol className="mb-5 list-decimal space-y-2 pl-5" {...props} />,
  li: (props) => (
    <li
      className="relative pl-5 text-fg-muted before:absolute before:top-[0.7em] before:left-0 before:size-1.5 before:rounded-full before:bg-border-strong"
      {...props}
    />
  ),
  strong: (props) => <strong className="font-semibold text-fg" {...props} />,
  a: (props) => (
    <a
      className="text-accent underline decoration-from-font underline-offset-2"
      target={props.href?.startsWith('http') ? '_blank' : undefined}
      rel={props.href?.startsWith('http') ? 'noopener noreferrer' : undefined}
      {...props}
    />
  ),
  blockquote: (props) => (
    <blockquote className="my-6 border-l-2 border-accent pl-6 text-fg-muted" {...props} />
  ),
  hr: () => <hr className="my-10 border-border" />,
  table: (props) => (
    <div className="my-6 scroll-x rounded-xl border border-border">
      <table className="w-full text-left text-[length:var(--text-step--1)]" {...props} />
    </div>
  ),
  th: (props) => <th className="border-b border-border px-4 py-3 font-semibold" {...props} />,
  td: (props) => <td className="border-b border-border px-4 py-3 text-fg-muted" {...props} />,
  pre: (props) => (
    <pre
      className="my-6 scroll-x rounded-xl border border-border bg-bg-subtle p-4 text-[length:var(--text-step--1)]"
      {...props}
    />
  ),
  code: (props) => (
    <code className="rounded bg-bg-subtle px-1.5 py-0.5 font-mono text-[0.9em] text-fg" {...props} />
  ),
}
