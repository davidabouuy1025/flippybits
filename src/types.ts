import {Vec} from './util'

export type {BitIndex, Target, State, Action, ViewType, ObjectId, Rectangle, Key, Event}
export {Viewport, TargetConfig, Constants}

// Type
type BitIndex = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

type ViewType = 'bits'

type ObjectId = Readonly<{ id: string, createTime: number }>

type Rectangle = Readonly<{ pos: Vec}>

type NewType = Readonly<{
    viewType: ViewType;
    value: number; // Decimal value (0 - 255)
    hex: string; // Hexadecimal string representation (e.g. "FF")
}>;

type Target = Rectangle & ObjectId & NewType;

type State = Readonly<{
    time: number,
    bits: ReadonlyArray<number>; // 8 bits: [0, 0, 0, 0, 0, 0, 0, 0]
    targets: ReadonlyArray<Target>;
    score: number;
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

const Constants = {
    DIGIT_COUNT: 8,
    TICK_RATE_MS: 60, // Might need to change this!,
    SCORE_INCREMENT: 1,
    START_BITS_COUNT: 1,   // Redundant as we do increment on the fallen bits count actually,
    START_TIME: 0,
} as const;

interface Action {
    apply(s: State): State;
}