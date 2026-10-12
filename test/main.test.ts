import { describe, test, expect, beforeEach } from 'vitest';
import { TestScheduler } from 'rxjs/testing';
import { map, interval, take, reduce } from 'rxjs';

import { BitIndex, Target, State, TargetConfig, Constants } from '../src/types';
import {
  initialState,
  Tick,
  FlipBit,
  SpawnTarget,
  Restart,
  Pause,
  reduceState,
  StartBonusTrigger
} from '../src/state';
import {
  Vec,
  generateRandomInt,
  smoothMovement,
  stepMovement,
  formatSecondsToMMSS,
  bin2dec
} from '../src/util';

describe('1. Vector and Math Utilities', () => {
  test('Vec operations return new instances without mutating originals', () => {
    const v1 = new Vec(10, 20);
    const v2 = new Vec(5, 5);

    const sum = v1.add(v2);
    const scaled = v1.scale(2);

    expect(sum.x).toBe(15);
    expect(sum.y).toBe(25);
    expect(scaled.x).toBe(20);
    expect(scaled.y).toBe(40);
    expect(v1.x).toBe(10); // Verifies immutability
  });

  test('bin2dec correctly converts 8-bit array to decimal', () => {
    expect(bin2dec([0, 0, 0, 0, 0, 0, 0, 0])).toBe(0);
    expect(bin2dec([0, 0, 0, 0, 1, 0, 1, 0])).toBe(10);
    expect(bin2dec([1, 1, 1, 1, 1, 1, 1, 1])).toBe(255);
  });

  test('formatSecondsToMMSS formats time accurately', () => {
    expect(formatSecondsToMMSS(0)).toBe("00:00");
    expect(formatSecondsToMMSS(65)).toBe('01:05');
    expect(formatSecondsToMMSS(600)).toBe('10:00');
  });
});

describe('2. Deterministic PRNG & HOF Generators', () => {
  test('RNG generates repeatable pseudorandom sequences given a seed', () => {
    const initialSeed = 12345;
    const res1 = generateRandomInt(0)(100)(initialSeed);
    const res2 = generateRandomInt(0)(100)(initialSeed);

    expect(res1.value).toBe(res2.value);
    expect(res1.nextSeed).toBe(res2.nextSeed);
  });

  test('generateRandomInt stays strictly within [min, max) bounds', () => {
    let seed = 999;
    for (let i = 0; i < 50; i++) {
      const res = generateRandomInt(10)(20)(seed);
      expect(res.value).toBeGreaterThanOrEqual(10);
      expect(res.value).toBeLessThan(20);
      seed = res.nextSeed;
    }
  });
});

describe('3. Target Movement Functions', () => {
  test('smoothMovement scales vertical displacement by deltaMs', () => {
    const currentY = 10;
    const totalSpeed = 3;

    const nextY = smoothMovement(currentY);
    expect(nextY(totalSpeed)).toBe(13); 
  });

  test('stepMovement calculates discrete drop steps cleanly', () => {
    const timeCreated = 0;
    const timeCurrent = 13;
    const initialY = 0;
    const nextY = stepMovement(timeCreated)(timeCurrent);
    expect(nextY(initialY)).toBe(30);
  });
});

describe('4. Pure Reducer & Action State Transitions', () => {
  test('FlipBit immutably updates specific index in bit array', () => {
    const action = new FlipBit(7 as BitIndex);
    const nextState = reduceState(initialState, action);

    expect(nextState.bits[7]).toBe(1);
    expect(initialState.bits[7]).toBe(0);
  });

  test('SpawnTarget appends new target and sets creation timestamp', () => {
    const mockTarget: Target = {
      id: 't-1',
      pos: new Vec(10, 0),
      createTime: 0,
      viewType: 'bits',
      targetKind: { kind: 'SMOOTH'},
      value: 15,
      hex: '0F',
    };

    const nextState = reduceState(initialState, new SpawnTarget(mockTarget));
    expect(nextState.targets.length).toBe(1);
    expect(nextState.targets[0].id).toBe('t-1');
  });

  test('Tick advances time, moves targets, and triggers gameEnd when past threshold', () => {
    const thresholdY = TargetConfig.CHECK_LINE_Y + 10;
    const stateWithLowTarget: State = {
      ...initialState,
      targets: [
        {
          id: 'danger-target',
          pos: new Vec(0, thresholdY),
          createTime: 0,
          viewType: 'bits',
          targetKind: { kind: 'SMOOTH'},
          value: 99,
          hex: '63',
        },
      ],
    };

    const nextState = reduceState(stateWithLowTarget, new Tick(Constants.TICK_RATE_MS));
    expect(nextState.gameEnd).toBe(true);
  });

  test('Tick matches decimal value against active bits to destroy target and increment score', () => {
    // Value = 10 -> bits: [0,0,0,0,1,0,1,0]
    const stateWithMatch: State = {
      ...initialState,
      bits: [0, 0, 0, 0, 1, 0, 1, 0],
      score: 0,
      targets: [
        {
          id: 'matched-target',
          pos: new Vec(0, 100),
          createTime: 0,
          viewType: 'bits',
          targetKind: { kind: 'SMOOTH'},
          value: 10,
          hex: '0A',
        },
      ],
    };

    const nextState = reduceState(stateWithMatch, new Tick(Constants.TICK_RATE_MS));
    expect(nextState.targets.length).toBe(0);
    expect(nextState.score).toBe(Constants.SCORE_INCREMENT);
  });

  test('Pause action toggles gamePause status', () => {
    const statePaused = reduceState(initialState, new Pause());
    expect(statePaused.gamePause).toBe(true);

    const stateResumed = reduceState(statePaused, new Pause());
    expect(stateResumed.gamePause).toBe(false);
  });

  test('Restart action resets state back to initialState', () => {
    const dirtyState: State = {
      ...initialState,
      score: 100,
      gameEnd: true,
      bits: [1, 1, 1, 1, 1, 1, 1, 1],
    };

    const resetState = reduceState(dirtyState, new Restart());
    expect(resetState).toEqual(initialState);
  });

  test('StartBonusTrigger action allows double score per FallenBit', () => {
    const currentState = {
      ...initialState
    };


    const checkBonusTriggerState = reduceState(currentState, new StartBonusTrigger());
    expect(checkBonusTriggerState.isDoublePoint).toEqual(!currentState.isDoublePoint);
  })
});

describe('5. RxJS Timing & Event Streams (Virtual Time)', () => {
  let testScheduler: TestScheduler;

  beforeEach(() => {
    testScheduler = new TestScheduler((actual, expected) => {
      expect(actual).toEqual(expected);
    });
  });

  test('tick stream emits continuous Tick actions on configured interval', () => {
    testScheduler.run(({ expectObservable }) => {
      const tickRate = Constants.TICK_RATE_MS;
      const tick$ = interval(tickRate).pipe(
        take(2),
        map(elapsed => new Tick(elapsed * tickRate))
      );

      const expectedMarbles = `${tickRate}ms a ${tickRate - 1}ms (b|)`;
      const expectedValues = {
        a: new Tick(0),
        b: new Tick(tickRate),
      };

      expectObservable(tick$).toBe(expectedMarbles, expectedValues);
    });
  });
});