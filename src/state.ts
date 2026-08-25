import { filter } from 'rxjs';
import {Viewport, TargetConfig, Constants, BitIndex, Target, State, Action, ViewType, ObjectId, Rectangle} from './types';  
import { calculateSpeedOverScore, calculateSpeedOverTime, Vec } from './util';

export {bin2dec, reduceState, initialState, Tick, FlipBit, SpawnTarget, Restart}

const initialState: State = {
    time: 0,
    bits: [0,0,0,0,0,0,0,0],
    targets: [],
    score: 0,
    gameEnd: false,
};

// Convert the player's 8-bit array into a base-10 number to check against target values.
const bin2dec = (bits: ReadonlyArray<number>): number => 
    bits.reduce((acc, curr, index) => 
        acc + curr*(2**(7-index)),
         0
    );

const computeSpeed = (s: State, func: Function) => {
    const computeSpeedOverScore = func(s.score)
    return calculateSpeedOverScore(s.time) + computeSpeedOverScore
}

const findMovingTargets = (s: State, speed: number) => {
    return s.targets.map(eachTarget => ({
        ...eachTarget,
        pos: new Vec(eachTarget.pos.x, eachTarget.pos.y + speed)
    }))
};

const findLowestTarget = (s: State) => {
    return s.targets.reduce<Target | null>(
        (acc, eachTarget) => 
            (!acc || eachTarget.pos.y > acc.pos.y) 
                ? eachTarget 
                : acc, 
            null
    )
}

const checkBinaryMatched = (s: State, lowestTarget: Target | null) => {
    return lowestTarget !== null && lowestTarget.value == bin2dec(s.bits)
}

const filterTargetLeft = (s: State, lowestTarget: Target | null, targets: readonly Target[], binaryMatched: Boolean) => {
    return binaryMatched && lowestTarget !== null 
        ? targets.filter(eachTarget => 
            eachTarget.id !== lowestTarget.id
        )
        : targets
}

const checkTargetTouched = (targets: readonly Target[]) => {
    return targets.some(
        eachTarget => eachTarget.pos.y > TargetConfig.CHECK_LINE_Y
    )
}

class Tick implements Action {
    constructor(public readonly elapsed: number){}

    apply(s: State): State {
        if (s.gameEnd) return s;

        const 
            getScaledSpeed = calculateSpeedOverScore(Constants.BASE_SPEED)(Constants.SPEED_INCREMENT)(Constants.SCORE_INTERVAL),
            finalSpeed = computeSpeed(s, getScaledSpeed),

            // FIlter available Targets
            movingTargets: Array<Target> = findMovingTargets(s, finalSpeed),

            // Find the bottommost target 
            lowestTarget: Target | null = findLowestTarget(s),
            
            // Check if bottommost Target matches
            binaryMatched = checkBinaryMatched(s, lowestTarget),

            // Targets left available
            targetsLeft = filterTargetLeft(s, lowestTarget, movingTargets, binaryMatched),

            // Check if any target touches the bottom of canvas
            crossed = checkTargetTouched(targetsLeft);

        return {
            ...s,
            targets: targetsLeft,
            score: binaryMatched? s.score + Constants.SCORE_INCREMENT : s.score,
            time: this.elapsed,
            gameEnd: crossed
        }
    } 
}

class FlipBit implements Action {
    constructor (public readonly index: BitIndex){}

    apply(s: State): State {
        if (s.gameEnd) return s;

        const
            newBits = s.bits.map(
                (eachBit, bitIndex) => 
                    bitIndex === this.index
                        ? (eachBit===0 ? 1 : 0)
                        : eachBit
            )
        
        return {
            ...s,
            bits: newBits
        }
    }
}

class SpawnTarget implements Action {
    constructor (public readonly target: Target){}

    apply(s: State): State{
        if (s.gameEnd) return s;

        return {
            ...s,
            targets: [...s.targets, this.target]
        }
    }
}

// _ is used to avoid TypeScript noUnusedParameters compiler warnings
class Restart implements Action {
    apply(_: State): State {
        return initialState
    }
}

const 
    reduceState = (s: State, action: Action) => action.apply(s)