import { constrainedMemory } from 'process';
import {Viewport, TargetConfig, Constants, BitIndex, Target, State, Action, ViewType, ObjectId, Rectangle} from './types';  
import { Vec } from './util';

export {reduceState}
export {initialState, Tick, FlipBit, SpawnTarget, Restart}

// FallenBits is just Rectangle
const createRectangle = (viewType: ViewType) => 
    (oid: ObjectId) => 
        (rect: Rectangle): Target => ({
            ...oid,
            ...rect,
            viewType: viewType,
            id: viewType + oid.id,
            value: 10,  // changed
            hex: "FF"   // changed
        });

const createBits = createRectangle('bits');

const
    // Init Bits
    startBits = [...Array(Constants.START_BITS_COUNT)]
        .map((_, i) => createBits({id: String(i),
            createTime: Constants.START_TIME})
            ({pos: Vec.Zero})),

    // Init initial state
    initialState: State = {
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
    )

class Tick implements Action {
    constructor(public readonly elapsed: number){}

    apply(s: State): State {
        if (s.gameEnd) return s;

        const 
            movingTargets: Array<Target> = s.targets.map(eachTarget => ({
                ...eachTarget,
                pos: new Vec(eachTarget.pos.x, eachTarget.pos.y+2)
            })),

            lowestTarget: Target | null = movingTargets.reduce<Target | null>(
                (acc, eachTarget) => 
                    (!acc || eachTarget.pos.y > acc.pos.y) 
                        ? eachTarget 
                        : acc, 
                    null
            ),

            binaryMatched = 
                lowestTarget !== null && 
                lowestTarget.value == bin2dec(s.bits),

            targetsLeft = 
                binaryMatched && lowestTarget !== null 
                    ? movingTargets.filter(eachTarget => 
                        eachTarget.id !== lowestTarget.id
                    )
                    : movingTargets,

            crossed = movingTargets.some(
                eachTarget => eachTarget.pos.y > TargetConfig.CHECK_LINE_Y
            );

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