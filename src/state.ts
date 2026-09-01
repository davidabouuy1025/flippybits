import { TargetConfig, Constants, BitIndex, Target, State, Action } from './types';
import { Vec, maxBy, resolveStrategy, bin2dec } from './util';

export { reduceState, initialState, Tick, FlipBit, SpawnTarget, Restart, Pause }

// state.ts
export const advanceTarget =
    (currentTimeSec: number) =>
        (score: number) =>
            (deltaMs: number) =>
                (target: Target): Target => {
                    const strategy = resolveStrategy(target)(currentTimeSec)(score);
                    const nextY = strategy(deltaMs)(deltaMs)(target.pos.y);

                    return {
                        ...target,
                        pos: new Vec(target.pos.x, nextY)
                    };
                };

const initialState: State = {
    time: 0,
    bits: [0, 0, 0, 0, 0, 0, 0, 0],
    targets: [],
    score: 0,
    gamePause: false,
    gameEnd: false,
};

const findLowestTarget = (
    s: State
) =>
    maxBy(s.targets, target => target.pos.y);

const checkBinaryMatched = (
    s: State,
    lowestTarget: Target | null
): boolean =>
    lowestTarget !== null && lowestTarget.value == bin2dec(s.bits);

const filterTargetLeft = (
    targets: readonly Target[],
    lowestTarget: Target | null,
    binaryMatched: boolean
): readonly Target[] =>
    binaryMatched && lowestTarget !== null
        ? targets.filter(eachTarget => eachTarget.id !== lowestTarget.id)
        : targets;
;

const checkTargetTouched = (targets: readonly Target[]) =>
    targets.some(
        eachTarget => eachTarget.pos.y > TargetConfig.CHECK_LINE_Y
    );

class Tick implements Action {
    constructor(public readonly elapsed: number) { }

    apply(s: State): State {
        const currentTimeSec = s.time + 1;

        const updatedTargetList = s.targets.map(
            advanceTarget(currentTimeSec)(s.score)(Constants.TICK_RATE_MS)
        );

        const movingTargets: State = { ...s, targets: updatedTargetList };
        const lowestTarget = findLowestTarget(movingTargets);
        const binaryMatched = checkBinaryMatched(s, lowestTarget);
        const targetsLeft = filterTargetLeft(movingTargets.targets, lowestTarget, binaryMatched);
        const crossed = checkTargetTouched(targetsLeft);

        return (s.gameEnd || s.gamePause) ? s : {
            ...s,
            targets: targetsLeft,
            score: binaryMatched ? s.score + Constants.SCORE_INCREMENT : s.score,
            // time: currentTimeSec, // Store clean elapsed time in seconds
            time: s.time + 1, // Store clean elapsed time in seconds
            gameEnd: crossed
        };
    }
}

class FlipBit implements Action {
    constructor(public readonly index: BitIndex) { }

    apply(s: State): State {
        const
            newBits = s.bits.map(
                (eachBit, bitIndex) =>
                    bitIndex === this.index
                        ? (eachBit === 0 ? 1 : 0)
                        : eachBit
            )

        return (s.gameEnd || s.gamePause) ? s : {
            ...s,
            bits: newBits
        }
    }
}

class SpawnTarget implements Action {
    constructor(public readonly target: Target) { }

    apply(s: State): State {
        if (s.gameEnd || s.gamePause) return s;

        // Stamp the target with current game time right when it enters state
        const stampedTarget: Target = {
            ...this.target,
            createTime: s.time
        };

        return {
            ...s,
            targets: [...s.targets, stampedTarget]
        };
    }
}

// _ is used to avoid TypeScript noUnusedParameters compiler warnings
class Restart implements Action {
    apply(_: State): State {
        return initialState
    }
}

class Pause implements Action {
    apply(s: State): State {
        return s.gameEnd ? s : {
            ...s,
            gamePause: !s.gamePause,
        }
    }
}

const
    reduceState = (s: State, action: Action) => action.apply(s)