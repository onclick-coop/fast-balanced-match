export type BalancedMatch = {
  start: number
  end: number
  pre: string
  body: string
  post: string
}

const firstMatch = (delimiter: RegExp, str: string): RegExpMatchArray | null => {
  if (!delimiter.global && !delimiter.sticky) return str.match(delimiter)

  // A copy without `g` stops at the first match and keeps the caller's `lastIndex` unmoved.
  const copy = new RegExp(delimiter.source, delimiter.flags.replace('g', ''))
  copy.lastIndex = delimiter.global ? 0 : delimiter.lastIndex

  return copy.exec(str)
}

const delimiterIn = (delimiter: string | RegExp, str: string): string | undefined => {
  // A string test, unlike `instanceof`, also accepts regexes from other realms, and `null` from untyped callers.
  if (typeof delimiter === 'string' || !delimiter) return delimiter || undefined

  const match = firstMatch(delimiter, str)
  // A regex that matches only empty text has found no delimiter.
  if (!match || !match[0]) return undefined

  return match[0]
}

type RunInput = { a: string; str: string; first: number; runLast: number; run: number; shallowest: number }

// The paired opening sits in the run before the first closing, so it is reached from that run's nearer end.
const pairedOpening = ({ a, str, first, runLast, run, shallowest }: RunInput): number => {
  // Openings exactly one apart step by one, so the paired one sits shallowest places after the first, with no walk.
  if (runLast - first === run - 1) return first + shallowest

  let beg = first
  if (shallowest < run - 1 - shallowest) {
    for (let n = 0; n < shallowest; n++) beg = str.indexOf(a, beg + 1)
    return beg
  }

  beg = runLast
  for (let n = run - 1; n > shallowest; n--) beg = str.lastIndexOf(a, beg - 1)
  return beg
}

const pairByCharCode = (a: string, b: string, str: string, from: number): undefined | [number, number] => {
  const open = a.charCodeAt(0)
  const close = b.charCodeAt(0)
  let depth = 0
  let last = -1
  let runLast = -1
  let run = 0
  let shallowest = Infinity
  let bestEnd = -1

  for (let i = from; i < str.length; i++) {
    const code = str.charCodeAt(i)
    if (code === open) {
      depth++
      last = i
    } else if (code === close) {
      depth--
      if (!depth) return [from, i]

      if (depth < shallowest) {
        if (shallowest === Infinity) {
          run = depth + 1
          runLast = last
        }
        shallowest = depth
        bestEnd = i
      }
    }
  }

  if (bestEnd === -1) return undefined

  return [pairedOpening({ a, str, first: from, runLast, run, shallowest }), bestEnd]
}

const pairByIndexOf = (a: string, b: string, str: string, start: number): undefined | [number, number] => {
  let ai = start
  let bi = str.indexOf(b, ai)
  let first = ai
  let last = -1
  let runLast = -1
  let run = 0
  let open = 0
  let shallowest = Infinity
  let bestEnd = -1
  let i = ai

  while (i >= 0) {
    // Where an opening and a closing start together, the longer one is the delimiter there.
    if (i === ai && (i !== bi || a.length > b.length)) {
      open++
      last = i
      ai = str.indexOf(a, i + 1)
      if (bi === i) bi = str.indexOf(b, i + 1)
    } else {
      if (ai === i) ai = str.indexOf(a, i + 1)

      // A closing with no opening before it is stray, so the first opening is still ahead at the next one.
      if (!open) {
        first = ai
      } else {
        open--
        if (!open) return [first, bi]

        if (open < shallowest) {
          // The first closing to pair ends the run of openings, and it always reaches a new shallowest depth.
          if (shallowest === Infinity) {
            run = open + 1
            runLast = last
          }
          shallowest = open
          bestEnd = bi
        }
      }

      bi = str.indexOf(b, i + 1)
    }

    i = ai === -1 || bi < ai ? bi : ai
  }

  if (bestEnd === -1) return undefined

  return [pairedOpening({ a, str, first, runLast, run, shallowest }), bestEnd]
}

const pairOfIdentical = (a: string, _b: string, str: string): undefined | [number, number] => {
  const ai = str.indexOf(a)
  const next = str.indexOf(a, ai + 1)
  if (next === -1) return undefined

  return [ai, next]
}

// Reading each character beats indexOf's jumps only where delimiters sit close together, as in short strings or a run of openings.
const pairOfSingleChars = (a: string, b: string, str: string): undefined | [number, number] => {
  const ai = str.indexOf(a)
  if (ai === -1) return undefined

  return str.length <= 32 || str[ai + 1] === a ? pairByCharCode(a, b, str, ai) : pairByIndexOf(a, b, str, ai)
}

const pairOfText = (a: string, b: string, str: string): undefined | [number, number] => {
  const ai = str.indexOf(a)

  return ai === -1 ? undefined : pairByIndexOf(a, b, str, ai)
}

type Scan = (a: string, b: string, str: string) => undefined | [number, number]

const scanFor = (a: string, b: string): Scan => {
  if (a === b) return pairOfIdentical
  if (a.length === 1 && b.length === 1) return pairOfSingleChars

  return pairOfText
}

const matchOf = (str: string, pair: [number, number], aLength: number, bLength: number): BalancedMatch => ({
  start: pair[0],
  end: pair[1],
  pre: str.slice(0, pair[0]),
  body: str.slice(pair[0] + aLength, pair[1]),
  post: str.slice(pair[1] + bLength),
})

// A regex delimiter matches each string afresh, so its scan is chosen per string from the text it matched.
const matchByRegex = (a: string | RegExp, b: string | RegExp, str: string): BalancedMatch | undefined => {
  const ma = delimiterIn(a, str)
  const mb = delimiterIn(b, str)
  if (ma === undefined || mb === undefined) return undefined

  const pair = scanFor(ma, mb)(ma, mb, str)

  return pair && matchOf(str, pair, ma.length, mb.length)
}

export type Matcher = (str: string) => BalancedMatch | undefined

// String delimiters settle their scan once, so each call of the matcher only scans.
export const matcher = (a: string | RegExp, b: string | RegExp): Matcher => {
  if (typeof a !== 'string' || typeof b !== 'string') return (str) => matchByRegex(a, b, str)
  // An empty delimiter marks nothing, so its matcher never finds a pair.
  if (!a || !b) return () => undefined

  const scan = scanFor(a, b)
  const aLength = a.length
  const bLength = b.length

  return (str) => {
    const pair = scan(a, b, str)

    return pair && matchOf(str, pair, aLength, bLength)
  }
}
