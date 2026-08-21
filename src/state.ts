import { constrainedMemory } from 'process';
import {Viewport, TargetConfig, Constants, BitIndex, Target, State, Action, ViewType, ObjectId, Rectangle} from './types';  
import { Vec } from './util';

export {initialState, Tick}

// FallenBits is just Rectangle
const createRectangle = (viewType: ViewType) => 
    (oid: ObjectId) => 
        (rect: Rectangle): Target => ({
            ...oid,
            ...rect,
            viewtype: viewType,
            id: viewType + oid.id,
            value: 10,  // changed
            hex: "FF"   // changed
        });

const createBits = createRectangle('bits');

const
    // Init Bits
    startBits = [...Array(Constants.STARTBITSCOUNT)]
        .map((_, i) => createBits({id: String(i),
            createTime: Constants.STARTTIME})
            ({pos: Vec.Zero})),

    // Init initial state
    initialState: State = {
        bits: [0,0,0,0,0,0,0,0],
        targets: [],
        score: 0,
        gameEnd: false,
    };

class Tick implements Action {
    constructor(public readonly elapsed: number){}

    apply(s: State): State {
        const 
            activeBits = s.bits;

        return Tick.handleCollision({
            ...s,
            score: s.score + Constants.SCORE_INCREMENT,
            time: this.elapsed
        })
    } 

    // Check a State for collisions
    //  - fallenBits reach most bottom
    //  - users solve the bits bottommost 
    static handleCollision = (s: State): State => {
        return s
    }
}


const 
    reduceState = (s: State, action: Action) => action.apply(s)