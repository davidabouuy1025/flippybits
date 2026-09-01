import { MovementStrategy, Constants, Target } from "./types";

/**
 * Converts an array of binary digits to a decimal number.
 *
 * @param bits - Read-only array of binary digits (0 or 1).
 * @returns Calculated decimal value.
 */
export const bin2dec = (bits: ReadonlyArray<number>): number =>
  bits.reduce((acc, curr, index) =>
    acc + curr * (2 ** (7 - index)),
    0
  );

/**
 * Computes smooth linear target movement over time.
 *
 * @param speedPxPerTick - Base speed in pixels per tick.
 * @returns Curried function calculating updated Y position based on tick delta.
 */
export const smoothMovement =
  (speedPxPerTick: number): MovementStrategy =>
    (_deltaMs) => (tickDeltaMs) => (currentY) =>
      currentY + speedPxPerTick * (tickDeltaMs / 1000);

/**
 * Checks if num1 is evenly divisible by num2.
 *
 * @param num1 - Dividend.
 * @returns Curried function accepting divisor num2 and returning 1 if divisible, else 0.
 */
const modulus =
  (num1: number) =>
    (num2: number) =>
      Math.floor(num1 % num2) == 0 ? 1 : 0

/**
 * Computes discrete stepped target drops based on time intervals.
 *
 * @param timeCreated - Timestamp when target was spawned.
 * @returns Curried movement strategy evaluating discrete vertical steps.
 */
export const stepMovement =
  (timeCreated: number) =>
    (timeCurrent: number): MovementStrategy =>
      (_deltaMs) => (_elapsedMs) => (initialY) => {
        const nextStep = Constants.STEEP_TARGET_DROP_Y * modulus(timeCurrent - timeCreated)(Constants.TIME_PRIME)
        return initialY + (nextStep);
      };

/**
 * Resolves movement strategy based on target type and current state.
 *
 * @param target - Target object containing movement configuration.
 * @returns Curried function accepting currentTimeSec and score to return a MovementStrategy.
 */
export const resolveStrategy =
  (target: Target) =>
    (currentTimeSec: number) =>
      (score: number): MovementStrategy => {
        const speedFromScore = calculateSpeedOverScore(Constants.BASE_SPEED)(Constants.SPEED_INCREMENT)(Constants.SCORE_INTERVAL)(score);
        const speedFromTime = calculateSpeedOverTime(currentTimeSec);
        const totalSpeed = speedFromScore + speedFromTime;

        switch (target.targetKind.kind) {
          case 'STEPPER':
            console.log(currentTimeSec, target.createTime)
            return stepMovement(target.createTime)(currentTimeSec);
          case 'SMOOTH':
          default:
            return smoothMovement(target.targetKind.speedPxPerTick + totalSpeed);
        }
      };

/**
 * Pure HOF: Formats raw seconds into an MM:SS time string.
 * 
 * @param totalSeconds - Total time elapsed in seconds.
 * @returns Formatted time string (MM:SS).
 */
export const formatSecondsToMMSS = (totalSeconds: number): string => {
  const mins = Math.floor(totalSeconds / 60).toString().padStart(2, '0');
  const secs = Math.floor(totalSeconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

/**
 * Pure HOF: Formats numeric score into a padded score string.
 * 
 * @param score - Current game score.
 * @returns Formatted score string padded to 4 digits.
 */
export const formatScoreDisplay = (score: number): string =>
  `SCORE: ${String(score).padStart(4, '0')}`;

/**
 * Finds the element in an array that yields the maximum numeric value from keyFn.
 *
 * @template T
 * @param array - Read-only array of items.
 * @param keyFn - Mapping function returning a numeric comparison key.
 * @returns Item with maximum key value, or null if array is empty.
 */
export const maxBy = <T>(
  array: readonly T[],
  keyFn: (item: T) => number
): T | null =>
  array.reduce<T | null>(
    (acc, item) => (!acc || keyFn(item) > keyFn(acc) ? item : acc),
    null
  );

/**
 * Computes target drop speed scaling based on current score.
 * 
 * @param baseSpeed - Initial movement speed.
 * @param speedStep - Speed increase per score threshold.
 * @param scoreStep - Score interval required for speed increase.
 * @returns Curried function accepting currentScore to compute updated speed.
 */
export const calculateSpeedOverScore =
  (baseSpeed: number) =>
    (speedStep: number) =>
      (scoreStep: number) =>
        (currentScore: number): number =>
          baseSpeed + Math.floor(currentScore / scoreStep) * speedStep;

/**
 * Computes exponential target drop speed scaling over elapsed time.
 * 
 * @param currentTime - Total active time elapsed in seconds.
 * @returns Calculated speed delta increment.
 */
export const calculateSpeedOverTime =
  (currentTime: number): number =>
    2 * (1 - Math.E ** (-0.005 * currentTime));

/**
 * Encapsulates generated pseudorandom value and next seed state.
 * @template T
 */
export type RandomResult<T> = Readonly<{
  value: T,
  nextSeed: number
}>;

/**
 * Generates a deterministic pseudo-random integer within [min, max).
 *
 * @param min - Inclusive lower bound.
 * @returns Curried function accepting max and seed to return RandomResult.
 */
export const generateRandomInt =
  (min: number) =>
    (max: number) =>
      (seed: number): RandomResult<number> => {
        const nextSeed = RNG.hash(seed);
        // Hash is in [0, 0x80000000), scale normalized ratio to [min, max)
        const value = min + Math.floor((nextSeed / 0x80000000) * (max - min));
        return { value, nextSeed };
      };

/**
 * Generates initial random target parameters from a seed.
 *
 * @param seed - Seed state for PRNG.
 * @param maxX - Maximum X position boundary.
 * @returns Target parameters including decimal value, position X, hex string, and next seed.
 */
export const generateTargetParams = (seed: number, maxX: number) => {
  const valRes = generateRandomInt(0)(16)(seed);              // Target value 0-15
  const xRes = generateRandomInt(0)(maxX)(valRes.nextSeed);   // Position X

  return {
    val: valRes.value,
    x: xRes.value,
    hex: valRes.value.toString(16).toUpperCase().padStart(2, '0'),
    nextSeed: xRes.nextSeed,
  };
};

/**
 * Linear Congruential Generator (LCG) for deterministic pseudo-random numbers.
 */
export abstract class RNG {
  // LCG using GCC's constants
  private static m = 0x80000000; // 2**31
  private static a = 1103515245;
  private static c = 12345;

  /**
   * Generates a pseudo-random hash from a seed.
   * @param seed - Seed value.
   * @returns Generated hash number.
   */
  public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

  /**
   * Normalizes hash value to range [-1, 1].
   * @param hash - Hash value from RNG.hash.
   * @returns Scaled value between -1 and 1.
   */
  public static scale = (hash: number) => (2 * hash) / (RNG.m - 1) - 1;
}

/**
 * Immutable 2D Vector representation and utility operations.
 */
export class Vec {
  /**
   * Creates a 2D Vector instance.
   * @param x - Horizontal coordinate.
   * @param y - Vertical coordinate.
   */
  constructor(
    public readonly x: number = 0,
    public readonly y: number = 0
  ) { }

  /** Adds vector b to current vector. */
  add = (b: Vec) => new Vec(this.x + b.x, this.y + b.y)

  /** Subtracts vector b from current vector. */
  sub = (b: Vec) => this.add(b.scale(-1))

  /** Computes magnitude length of vector. */
  len = () => Math.sqrt(this.x * this.x + this.y * this.y)

  /** Scales vector by factor s. */
  scale = (s: number) => new Vec(this.x * s, this.y * s)

  /** Computes orthogonal vector. */
  ortho = () => new Vec(this.y, -this.x)

  /** Default zero vector (0, 0). */
  static Zero = new Vec();
}