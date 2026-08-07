// Easter-egg game data. Each round shows three quotes; exactly one is
// genuinely Audarya's (marker index `mine`). The other two are well-known
// lines from other thinkers. Audarya can freely edit these later.
export interface QuoteRound {
  options: string[];
  mine: number; // index of Audarya's quote
}

export const quoteRounds: QuoteRound[] = [
  {
    options: [
      "Any idea that leaves you becomes twice as useful.",
      "The best way to predict the future is to invent it.",
      "Simplicity is the ultimate sophistication.",
    ],
    mine: 0,
  },
  {
    options: [
      "In the middle of difficulty lies opportunity.",
      "Markets can price in a rate cut a dozen times before it ever arrives.",
      "The only thing we have to fear is fear itself.",
    ],
    mine: 1,
  },
  {
    options: [
      "Stay hungry, stay foolish.",
      "It is not the strongest that survives, but the most adaptable.",
      "A startup's second product is where the real story begins.",
    ],
    mine: 2,
  },
  {
    options: [
      "Curiosity is the whole game.",
      "Knowledge is power.",
      "Fortune favours the bold.",
    ],
    mine: 0,
  },
  {
    options: [
      "The unexamined life is not worth living.",
      "Great things are done by a series of small things brought together.",
      "Write like the reader is smart and busy — because they are.",
    ],
    mine: 2,
  },
];
