'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import type { Field } from '@portfolio/shared/cms'
import { api, ApiError } from './client'
import { cn } from '@/lib/utils'
import { MediaPicker, MediaPreview } from './MediaPicker'

type Values = Record<string, unknown>
type Errors = Record<string, string>

export const inputClass =
  'w-full rounded-xl border border-border bg-bg-raised px-4 py-2.5 min-h-11 transition-colors placeholder:text-fg-subtle focus:border-accent focus:outline-none'

/**
 * Edits one content entry. Fields come from src/lib/cms/fields.ts; values are
 * validated by the collection's Zod schema on save, and messages come back
 * keyed by path ("metrics.0.value") to show under the right input.
 */
export function EntryForm({
  collection,
  id,
  fields,
  initial,
  disabled,
}: {
  collection: string
  id: string | null
  fields: Field[]
  initial: Values
  /** No database: show the form read-only. */
  disabled?: boolean
}) {
  const router = useRouter()
  const [values, setValues] = useState<Values>(initial)
  const [errors, setErrors] = useState<Errors>({})
  const [status, setStatus] = useState<{ tone: 'ok' | 'error'; text: string } | null>(null)
  const [dirty, setDirty] = useState(false)
  const [pending, startTransition] = useTransition()

  // Warn before leaving with unsaved edits.
  useEffect(() => {
    if (!dirty) return
    const warn = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const update = (next: Values) => {
    setValues(next)
    setDirty(true)
    setStatus(null)
  }

  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    startTransition(async () => {
      let result: { id: string }
      try {
        result = await api<{ id: string }>(`/admin/collections/${collection}${id ? `/${id}` : ''}`, {
          method: id ? 'PUT' : 'POST',
          body: values,
        })
      } catch (e) {
        setErrors(e instanceof ApiError ? e.fieldErrors : {})
        setStatus({ tone: 'error', text: e instanceof Error ? e.message : 'Could not save.' })
        return
      }
      setErrors({})
      setDirty(false)
      setStatus({ tone: 'ok', text: 'Saved. The site is updated.' })
      if (!id) router.replace(`/admin/${collection}/${result.id}`)
      else router.refresh()
    })
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      <fieldset disabled={disabled || pending} className="space-y-6">
        <Fields fields={fields} value={values} onChange={update} path="" errors={errors} />
      </fieldset>

      <div className="sticky bottom-0 -mx-4 flex flex-wrap items-center gap-4 border-t border-border bg-bg/90 px-4 py-4 backdrop-blur">
        <button
          type="submit"
          disabled={disabled || pending}
          className="inline-flex min-h-11 items-center rounded-full bg-accent px-6 font-medium text-accent-fg disabled:opacity-50"
        >
          {pending ? 'Saving…' : 'Save'}
        </button>
        {status && (
          <p role="status" className={status.tone === 'ok' ? 'text-success' : 'text-danger'}>
            {status.text}
          </p>
        )}
        {dirty && !status && <p className="text-fg-subtle">Unsaved changes</p>}
      </div>
    </form>
  )
}

function Fields({
  fields,
  value,
  onChange,
  path,
  errors,
}: {
  fields: Field[]
  value: Values
  onChange: (v: Values) => void
  path: string
  errors: Errors
}) {
  return (
    <>
      {fields.map((field) => {
        const key = path ? `${path}.${field.name}` : field.name
        return (
          <FieldInput
            key={key}
            field={field}
            path={key}
            value={value?.[field.name]}
            onChange={(v) => onChange({ ...value, [field.name]: v })}
            errors={errors}
          />
        )
      })}
    </>
  )
}

function Label({ field, htmlFor, error }: { field: Field; htmlFor?: string; error?: string }) {
  return (
    <>
      <label htmlFor={htmlFor} className="mb-1.5 block font-medium">
        {field.label}
      </label>
      {field.help && (
        <p className="-mt-1 mb-2 text-[length:var(--text-step--1)] text-fg-subtle">{field.help}</p>
      )}
      {error && (
        <p role="alert" className="mb-2 text-[length:var(--text-step--1)] text-danger">
          {error}
        </p>
      )}
    </>
  )
}

const fieldId = (path: string) => `f-${path.replace(/\./g, '-')}`

function FieldInput({
  field,
  path,
  value,
  onChange,
  errors,
}: {
  field: Field
  path: string
  value: unknown
  onChange: (v: unknown) => void
  errors: Errors
}) {
  const id = fieldId(path)
  const error = errors[path]
  const invalid = error ? 'border-danger' : ''

  switch (field.kind) {
    case 'text':
    case 'url':
    case 'email':
      return (
        <div>
          <Label field={field} htmlFor={id} error={error} />
          <input
            id={id}
            type={field.kind}
            className={cn(inputClass, invalid)}
            placeholder={field.placeholder}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case 'textarea':
    case 'markdown':
      return (
        <div>
          <Label field={field} htmlFor={id} error={error} />
          <textarea
            id={id}
            rows={field.kind === 'markdown' ? 18 : (field.rows ?? 3)}
            className={cn(
              inputClass,
              invalid,
              field.kind === 'markdown' && 'font-mono text-[length:var(--text-step--1)]',
            )}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case 'number':
      return (
        <div>
          <Label field={field} htmlFor={id} error={error} />
          <input
            id={id}
            type="number"
            inputMode="decimal"
            className={cn(inputClass, invalid, 'max-w-48')}
            value={typeof value === 'number' ? value : ''}
            onChange={(e) => onChange(e.target.value === '' ? undefined : Number(e.target.value))}
          />
        </div>
      )
    case 'boolean':
      return (
        <div>
          <label className="flex cursor-pointer items-start gap-3">
            <input
              type="checkbox"
              className="mt-1 size-5 accent-[var(--accent)]"
              checked={Boolean(value)}
              onChange={(e) => onChange(e.target.checked)}
            />
            <span>
              <span className="font-medium">{field.label}</span>
              {field.help && (
                <span className="block text-[length:var(--text-step--1)] text-fg-subtle">{field.help}</span>
              )}
            </span>
          </label>
          {error && (
            <p role="alert" className="mt-1 text-danger">
              {error}
            </p>
          )}
        </div>
      )
    case 'select':
      return (
        <div>
          <Label field={field} htmlFor={id} error={error} />
          <select
            id={id}
            className={cn(inputClass, invalid, 'max-w-80')}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          >
            <option value="">—</option>
            {field.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label || '(none)'}
              </option>
            ))}
          </select>
        </div>
      )
    case 'month':
      return (
        <div>
          <Label field={field} htmlFor={id} error={error} />
          <div className="flex flex-wrap items-center gap-4">
            <input
              id={id}
              className={cn(inputClass, invalid, 'max-w-40')}
              placeholder="YYYY-MM"
              inputMode="numeric"
              disabled={field.nullable && value === null}
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => onChange(e.target.value)}
            />
            {field.nullable && (
              <label className="flex items-center gap-2">
                <input
                  type="checkbox"
                  className="size-5 accent-[var(--accent)]"
                  checked={value === null}
                  onChange={(e) => onChange(e.target.checked ? null : '')}
                />
                Present
              </label>
            )}
          </div>
        </div>
      )
    case 'date':
      return (
        <div>
          <Label field={field} htmlFor={id} error={error} />
          <input
            id={id}
            type="date"
            className={cn(inputClass, invalid, 'max-w-56')}
            value={typeof value === 'string' ? value : ''}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )
    case 'tags':
    case 'lines':
      return <ListText field={field} id={id} value={value} onChange={onChange} error={error} />
    case 'media':
      return <MediaInput field={field} id={id} value={value} onChange={onChange} error={error} />
    case 'group':
      return (
        <fieldset className="rounded-2xl border border-border p-5">
          <legend className="px-2 font-medium">{field.label}</legend>
          {field.help && (
            <p className="mb-3 text-[length:var(--text-step--1)] text-fg-subtle">{field.help}</p>
          )}
          {error && (
            <p role="alert" className="mb-3 text-danger">
              {error}
            </p>
          )}
          <div className="space-y-5">
            <Fields
              fields={field.fields}
              value={(value as Values) ?? {}}
              onChange={onChange}
              path={path}
              errors={errors}
            />
          </div>
        </fieldset>
      )
    case 'list':
      return <ListField field={field} path={path} value={value} onChange={onChange} errors={errors} />
  }
}

/** Repeatable group. Rows keep stable keys so per-row input state follows a row when it moves. */
function ListField({
  field,
  path,
  value,
  onChange,
  errors,
}: {
  field: Field & { kind: 'list' }
  path: string
  value: unknown
  onChange: (v: unknown) => void
  errors: Errors
}) {
  const items = Array.isArray(value) ? (value as Values[]) : []
  const [keys, setKeys] = useState(() => items.map(() => crypto.randomUUID()))
  const set = (next: Values[], nextKeys: string[]) => {
    setKeys(nextKeys)
    onChange(next)
  }
  const error = errors[path]
  return (
    <fieldset className="rounded-2xl border border-border p-5">
      <legend className="px-2 font-medium">{field.label}</legend>
      {error && (
        <p role="alert" className="mb-3 text-danger">
          {error}
        </p>
      )}
      <ol className="space-y-4">
        {items.map((item, i) => (
          <li key={keys[i]} className="rounded-xl bg-bg-subtle p-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <span className="text-[length:var(--text-step--1)] text-fg-muted">
                {field.itemLabel} {i + 1}
              </span>
              <span className="flex gap-1">
                <SmallButton
                  disabled={i === 0}
                  onClick={() => set(swap(items, i, i - 1), swap(keys, i, i - 1))}
                  label="Move up"
                >
                  ↑
                </SmallButton>
                <SmallButton
                  disabled={i === items.length - 1}
                  onClick={() => set(swap(items, i, i + 1), swap(keys, i, i + 1))}
                  label="Move down"
                >
                  ↓
                </SmallButton>
                <SmallButton
                  onClick={() =>
                    set(
                      items.filter((_, j) => j !== i),
                      keys.filter((_, j) => j !== i),
                    )
                  }
                  label={`Remove ${field.itemLabel}`}
                >
                  Remove
                </SmallButton>
              </span>
            </div>
            <div className="space-y-4">
              <Fields
                fields={field.fields}
                value={item}
                onChange={(v) =>
                  set(
                    items.map((x, j) => (j === i ? v : x)),
                    keys,
                  )
                }
                path={`${path}.${i}`}
                errors={errors}
              />
            </div>
          </li>
        ))}
      </ol>
      <button
        type="button"
        onClick={() => set([...items, {}], [...keys, crypto.randomUUID()])}
        className="mt-4 inline-flex min-h-11 items-center rounded-full border border-border-strong px-4 hover:border-accent"
      >
        + Add {field.itemLabel.toLowerCase()}
      </button>
    </fieldset>
  )
}

const swap = <T,>(xs: T[], a: number, b: number) => {
  const next = [...xs]
  ;[next[a], next[b]] = [next[b], next[a]]
  return next
}

function SmallButton({
  children,
  onClick,
  disabled,
  label,
}: {
  children: React.ReactNode
  onClick: () => void
  disabled?: boolean
  label: string
}) {
  return (
    <button
      type="button"
      aria-label={label}
      disabled={disabled}
      onClick={onClick}
      className="min-h-9 min-w-9 rounded-lg px-2 text-[length:var(--text-step--1)] hover:bg-bg-raised disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/** string[] edited as text: comma-separated (tags) or one per line (lines). */
function ListText({
  field,
  id,
  value,
  onChange,
  error,
}: {
  field: Field & { kind: 'tags' | 'lines' }
  id: string
  value: unknown
  onChange: (v: unknown) => void
  error?: string
}) {
  const sep = field.kind === 'tags' ? ', ' : '\n'
  // Local text, so typing a separator isn't swallowed by the round-trip to an array.
  const [text, setText] = useState(() => (Array.isArray(value) ? value.join(sep) : ''))
  const parse = (t: string) =>
    t
      .split(field.kind === 'tags' ? ',' : '\n')
      .map((s) => s.trim())
      .filter(Boolean)
  return (
    <div>
      <Label field={field} htmlFor={id} error={error} />
      {field.kind === 'tags' ? (
        <input
          id={id}
          className={cn(inputClass, error && 'border-danger')}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onChange(parse(e.target.value))
          }}
        />
      ) : (
        <textarea
          id={id}
          rows={Math.max(3, text.split('\n').length + 1)}
          className={cn(inputClass, error && 'border-danger')}
          value={text}
          onChange={(e) => {
            setText(e.target.value)
            onChange(parse(e.target.value))
          }}
        />
      )}
    </div>
  )
}

/** A URL field with a library picker. Plain URLs (e.g. "/resume/cv.pdf") can still be typed. */
function MediaInput({
  field,
  id,
  value,
  onChange,
  error,
}: {
  field: Field & { kind: 'media' }
  id: string
  value: unknown
  onChange: (v: unknown) => void
  error?: string
}) {
  const [open, setOpen] = useState(false)
  const url = typeof value === 'string' ? value : ''
  return (
    <div>
      <Label field={field} htmlFor={id} error={error} />
      <div className="flex flex-wrap items-start gap-4">
        {url && (
          <div
            className={cn(
              'overflow-hidden rounded-xl border border-border bg-bg-subtle',
              field.accept === 'audio' ? 'w-72 p-2' : 'size-28',
            )}
          >
            <MediaPreview url={url} kind={field.accept} />
          </div>
        )}
        <div className="flex min-w-0-fix flex-1 flex-col gap-2">
          <input
            id={id}
            className={cn(inputClass, error && 'border-danger')}
            placeholder="https://… or pick from the library"
            value={url}
            onChange={(e) => onChange(e.target.value)}
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex min-h-11 items-center rounded-full border border-border-strong px-4 hover:border-accent"
            >
              Choose or upload…
            </button>
            {url && (
              <button
                type="button"
                onClick={() => onChange('')}
                className="min-h-11 rounded-full px-4 hover:bg-bg-subtle"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      </div>
      <MediaPicker
        open={open}
        kind={field.accept}
        onClose={() => setOpen(false)}
        onPick={(item) => {
          onChange(item.url)
          setOpen(false)
        }}
      />
    </div>
  )
}
