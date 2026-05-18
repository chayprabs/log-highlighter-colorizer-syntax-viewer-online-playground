import type { Token } from '@/lib/tokenize'

type TokensProps = {
  tokens: Token[]
}

export function Tokens({ tokens }: TokensProps): JSX.Element {
  return (
    <>
      {tokens.map((t, i) =>
        t.type === 'plain' ? (
          <span key={i}>{t.text}</span>
        ) : (
          <span key={i} className={`gs-t-${t.type}`}>
            {t.text}
          </span>
        )
      )}
    </>
  )
}
