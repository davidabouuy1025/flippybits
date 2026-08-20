export {Viewport, Constants, initialState};
export type {State, Target};

export type BitIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

type Target = Readonly<{
  id: string;
  value: number; // Decimal value (0 - 255)
  hex: string;   // Hexadecimal string representation (e.g. "FF")
  x: number;
  y: number;
}>;

type State = Readonly<{
  bits: ReadonlyArray<number>; // 8 bits: [0, 0, 0, 0, 0, 0, 0, 0]
  targets: ReadonlyArray<Target>;
  score: number;
  gameEnd: boolean;
}>;

const Viewport = {
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
} as const;

const Target = {
    WIDTH: 64,
    HEIGHT: 36,
} as const;

const Constants = {
    DIGIT_COUNT: 8,
    TICK_RATE_MS: 60, // Might need to change this!
} as const;


const initialState: State = {
    bits: [0,0,0,0,0,0,0,0],
    targets: [],
    score: 0,
    gameEnd: false,
};