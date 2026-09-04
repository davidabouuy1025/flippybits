import { TargetConfig, Constants, BitIndex, Target, State, Action } from './types';
import { Vec, maxBy, resolveStrategy, bin2dec } from './util';

export { reduceState, initialState, Tick, FlipBit, SpawnTarget, Restart, Pause, StartBonusTrigger, EndBonusTrigger }

/** Initial default state configuration for starting or resetting the game. */
const initialState: State = {
    time: 0,
    bits: [0, 0, 0, 0, 0, 0, 0, 0],
    targets: [],
    score: 0,
    gamePause: false,
    gameEnd: false,
    isDoublePoint: false
};

// ////////////////////////
// Falling Mechanism
// ////////////////////////

/**
 * Advances a single target's vertical position based on active movement strategies.
 * @param currentTimeSec - Current game elapsed time in seconds.
 * @param score - Current game score.
 * @param target - The target entity to update.
 * @returns A new Target instance with updated positional coordinates.
 */
export const advanceTarget =
    (currentTimeSec: number) =>
        (score: number) =>
            (target: Target): Target => {
                const strategy = resolveStrategy(target)(currentTimeSec)(score);
                const nextY = strategy(target.pos.y);

                return {
                    ...target,
                    pos: new Vec(target.pos.x, nextY)
                };
            };

/**
 * Finds the target positioned lowest vertically on the canvas.
 * @param s - The current game state.
 * @returns The lowest Target entity, or null if no targets exist.
 */
const findLowestTarget = (
    s: State
) =>
    maxBy(s.targets, target => target.pos.y);

/**
 * Checks whether current bit representation matches the value of the lowest target.
 * @param s - Current state containing bit toggles.
 * @param lowestTarget - Target entity nearest to the bottom threshold.
 * @returns True if the target decimal value matches the active binary value.
 */
const checkBinaryMatched = (
    s: State,
    lowestTarget: Target | null
): boolean => lowestTarget !== null && lowestTarget.value == bin2dec(s.bits);

/**
 * Removes target from state list if binary match criteria is satisfied.
 * @param targets - Current collection of targets.
 * @param lowestTarget - Target evaluated for matching.
 * @param binaryMatched - Flag confirming successful bit match.
 * @returns Filtered array of targets.
 */
const filterTargetLeft = (
    targets: readonly Target[],
    lowestTarget: Target | null,
    binaryMatched: boolean
): readonly Target[] =>
    binaryMatched && lowestTarget !== null
        ? targets.filter(eachTarget => eachTarget.id !== lowestTarget.id)
        : targets;
;

/**
 * Determines whether any target has breached the lower threshold line.
 * @param targets - Active target array to evaluate.
 * @returns True if any target exceeds baseline height limits.
 */
const checkTargetTouched = (targets: readonly Target[]) =>
    targets.some(
        eachTarget => eachTarget.pos.y > TargetConfig.CHECK_LINE_Y
    );

// /////////////////////
// Action Classes
// /////////////////////

/** Action executing a frame time tick, moving targets, and resolving match/collision states. */
class Tick implements Action {
    /** @param elapsed - Frame elapsed time duration. */
    constructor(public readonly elapsed: number) { }

    /**
     * Applies frame tick logic to state.
     * @param s - Current state.
     * @returns Mutated state progression.
     */
    apply(s: State): State {
        const currentTimeSec = s.time + Constants.TICK_RATE_MS/1000;

        const updatedTargetList = s.targets.map(
            advanceTarget(currentTimeSec)(s.score)
        );

        console.log('hi')

        const movingTargets: State = { ...s, targets: updatedTargetList };
        const lowestTarget = findLowestTarget(movingTargets);
        const binaryMatched = checkBinaryMatched(s, lowestTarget);
        const targetsLeft = filterTargetLeft(movingTargets.targets, lowestTarget, binaryMatched);
        const crossed = checkTargetTouched(targetsLeft);

        return (s.gameEnd || s.gamePause) ? s : {
            ...s,
            targets: targetsLeft,
            score: binaryMatched ? s.score + Constants.SCORE_INCREMENT : s.score,
            time: currentTimeSec, // Store clean elapsed time in seconds
            // time: s.time + 1, // Store clean elapsed time in seconds
            gameEnd: crossed
        };
    }
}

/** Action handling bit state inversion for specific binary indices. */
class FlipBit implements Action {
    /** @param index - Target array position to toggle. */
    constructor(public readonly index: BitIndex) { }

    /**
     * Toggles bit value at target index.
     * @param s - Current state.
     * @returns State with updated bit values.
     */
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

/** Action adding new targets into state array stamped with entry time. */
class SpawnTarget implements Action {
    /** @param target - New target template to inject. */
    constructor(public readonly target: Target) { }

    /**
     * Stamps target creation timestamp and appends to state array.
     * @param s - Current state.
     * @returns Updated state containing new target.
     */
    apply(s: State): State {
        // Stamp the target with current game time right when it enters state
        const stampedTarget: Target = {
            ...this.target,
            createTime: s.time
        };

        return (s.gameEnd || s.gamePause) ? s : {
            ...s,
            targets: [...s.targets, stampedTarget]
        };
    }
}

/**
 * Start bonus score - 1 FallenBit for 2 scores
 */
class StartBonusTrigger implements Action {
    /**
     * Apply additional score and append to state array
     * Reverse isDoublePoint to True 
     * @param s - Current state.
     * @returns Updated state with new score (double point added)
     */
    apply(s: State) {
        return (s.gameEnd || s.gamePause) ? s : {
            ...s,
            score: s.score + Constants.BONUS_SCORE,
            isDoublePoint: !s.isDoublePoint
        }
    }
}

/**
 * End bonus score - 1 FallenBit for 1 score
 */
class EndBonusTrigger implements Action {
    /**
     * Stop adding addtional score
     * Reverse isDoublePOint to False
     * @param s 
     * @returns 
     */
    apply(s: State) {
        return (s.gameEnd || s.gamePause) ? s : {
            ...s,
            isDoublePoint: !s.isDoublePoint
        };
    }
}

/** Action resetting game to starting parameters. */
class Restart implements Action {
    /**
     * Resets state back to initial configurations.
     * @param _ - Current state (unused).
     * @returns Pristine state setup.
     */
    apply(_: State): State {
        return initialState
    }
}

/** Action toggling game pause status. */
class Pause implements Action {
    /**
     * Inverts pause state if game is running.
     * @param s - Current state.
     * @returns State with updated pause status.
     */
    apply(s: State): State {
        return s.gameEnd ? s : {
            ...s,
            gamePause: !s.gamePause,
        }
    }
}

/**
 * State reducer function applying action mutations.
 * @param s - Current state.
 * @param action - Action instance carrying mutation logic.
 * @returns Resulting state instance.
 */
const
    reduceState = (s: State, action: Action) => action.apply(s)