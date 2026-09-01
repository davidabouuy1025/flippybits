import { Vec } from './util'

export type { BitIndex, Target, State, Action, ViewType, ObjectId, Rectangle, Key, Event, MovementStrategy, TargetMovementConfig }
export { Viewport, TargetConfig, Constants }

// Type
type BitIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

type ViewType = 'bits' | 'hex';

type ObjectId = Readonly<{ id: string, createTime: number }>;

type Rectangle = Readonly<{ pos: Vec }>;

type MovementStrategy = (currentY: number) => number;

type TargetMovementConfig =
    | { readonly kind: 'SMOOTH'; }
    | { readonly kind: 'STEPPER'; readonly stepDistance: number };

type TargetDetails = Readonly<{
    viewType: ViewType;
    targetKind: TargetMovementConfig;
    value: number; // Decimal value (0 - 255)
    hex: string; // Hexadecimal string representation (e.g. "FF")
}>;

type Target = Rectangle & ObjectId & TargetDetails;

type State = Readonly<{
    time: number,
    bits: ReadonlyArray<number>; // 8 bits: [0, 0, 0, 0, 0, 0, 0, 0]
    targets: ReadonlyArray<Target>;
    score: number;
    gamePause: boolean;
    gameEnd: boolean;
}>;

type Key = 'Digit1' | 'Digit2' | 'Digit3' | 'Digit4' | 'Digit5' | 'Digit6' | 'Digit7' | 'Digit8' | 'KeyR';

type Event = 'keydown' | 'keyup' | 'click';

// Constant
const Viewport = {
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
} as const;

const TargetConfig = {
    WIDTH: 64,
    HEIGHT: 36,
    CHECK_LINE_Y: 340,
} as const;

/**
 * Constants used in game program
 *  - Game point
 *  - Whole game physics
 *  - Game physics - Target
 */
const Constants = {
    DIGIT_COUNT: 8,
    SCORE_INCREMENT: 1,

    TICK_RATE_MS: 60,
    TICK_TO_TIME_CONSTANT: 3.5,

    BASE_SPEED: 0.5,
    SPEED_INCREMENT: 0.25,
    SCORE_INTERVAL: 5,

    TIME_PRIME: 13,
    STEEP_TARGET_DROP_Y: 30
} as const;

interface Action {
    apply(s: State): State;
}