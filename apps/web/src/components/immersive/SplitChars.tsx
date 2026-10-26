import { Fragment } from 'react'

/**
 * Splits text into per-character spans for the `data-reveal="chars"` stagger.
 * Screen readers get the plain text once; the split copy is aria-hidden.
 * Words stay unbreakable so lines wrap between words, never inside them.
 */
export function SplitChars({ lines }: { lines: string[] }) {
  let index = 0
  return (
    <>
      <span className="sr-only">{lines.join(' ')}</span>
      <span aria-hidden="true">
        {lines.map((line, l) => (
          <span key={l} className="split__line">
            {line.split(' ').map((word, w, words) => (
              <Fragment key={w}>
                <span className="split__word">
                  {/* Punctuation rides with the preceding letter, so kerning like "w." survives the split. */}
                  {[...word]
                    .reduce<string[]>((acc, ch) => {
                      if (acc.length && /[.,!?;:]/.test(ch)) acc[acc.length - 1] += ch
                      else acc.push(ch)
                      return acc
                    }, [])
                    .map((char, c) => (
                      <span key={c} className="split__char" style={{ '--i': index++ } as React.CSSProperties}>
                        {char}
                      </span>
                    ))}
                </span>
                {/* Outside the inline-block, or it collapses. */}
                {w < words.length - 1 ? ' ' : null}
              </Fragment>
            ))}
          </span>
        ))}
      </span>
    </>
  )
}
