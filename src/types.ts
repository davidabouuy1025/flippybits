import { Vec } from './util'

export type { BitIndex, Target, State, Action, ViewType, ObjectId, Rectangle, Key, Event, MovementStrategy, TargetMovementConfig }
export { Viewport, TargetConfig, Constants }

/** Index representing an 8-bit position (0–7). */
type BitIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

/** Display mode for target values. */
type ViewType = 'bits' | 'hex';

/** Unique identifier and creation timestamp for game entities. */
type ObjectId = Readonly<{ id: string, createTime: number }>;

/** Positional element on the 2D plane. */
type Rectangle = Readonly<{ pos: Vec }>;

/** Function computing updated vertical position. */
type MovementStrategy = (currentY: number) => number;

/** Configuration defining target movement behavior. */
type TargetMovementConfig =
    | { readonly kind: 'SMOOTH'; }
    | { readonly kind: 'STEPPER'; readonly stepDistance: number };

/** Properties defining a target's underlying data and rendering type. */
type TargetDetails = Readonly<{
    viewType: ViewType;
    targetKind: TargetMovementConfig;
    value: number; // Decimal value (0 - 255)
    hex: string; // Hexadecimal string representation (e.g. "FF")
}>;

/** Falling game target object combining position, identity, and properties. */
type Target = Rectangle & ObjectId & TargetDetails;

/** Immutable global state model for the game. */
type State = Readonly<{
    time: number,
    bits: ReadonlyArray<number>; // 8 bits: [0, 0, 0, 0, 0, 0, 0, 0]
    targets: ReadonlyArray<Target>;
    score: number;
    gamePause: boolean,
    gameEnd: boolean,
    isDoublePoint: boolean,
}>;

/** Keyboard input keys handled by the game. */
type Key = 'Digit1' | 'Digit2' | 'Digit3' | 'Digit4' | 'Digit5' | 'Digit6' | 'Digit7' | 'Digit8' | 'KeyR';

/** Supported DOM event types. */
type Event = 'keydown' | 'keyup' | 'click';

/** Canvas dimensions for rendering the main viewport. */
const Viewport = {
    CANVAS_WIDTH: 600,
    CANVAS_HEIGHT: 400,
} as const;

/** Dimension and baseline location definitions for target entities. */
const TargetConfig = {
    WIDTH: 64,
    HEIGHT: 36,
    CHECK_LINE_Y: 340,
} as const;

/**
 * Global game balance constants, scoring steps, tick settings, and physics constants.
 */
const Constants = {
    DIGIT_COUNT: 8,
    SCORE_INCREMENT: 1,
    BONUS_SCORE: 1,
    BONUS_SCORE_TIME_LIMIT: 3000,
    BONUS_SCORE_COOLDOWN: 5000,
    BONUS_SCORE_MIN_COUNT: 3,

    TICK_RATE_MS: 60,
    TICK_TO_TIME_CONSTANT: 3.5,

    BASE_SPEED: 0.25,
    SPEED_INCREMENT: 0.25,
    SCORE_INTERVAL: 3,

    TIME_PRIME: 13,
    STEEP_TARGET_DROP_Y: 30
} as const;

/** Encapsulates a pure state mutation step. */
interface Action {
    /** Transforms current game state into the next state instance. */
    apply(s: State): State;
}