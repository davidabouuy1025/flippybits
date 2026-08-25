export {Vec, RNG}

export type RandomResult<T> = Readonly<{
    value: T,
    nextSeed: number
}>;

export const generateRandomInt = 
  (min: number) => 
    (max: number) => 
      (seed: number): RandomResult<number> => {
        const nextSeed = RNG.hash(seed);
        // Hash is in [0, 0x80000000), scale normalized ratio to [min, max)
        const value = min + Math.floor((nextSeed / 0x80000000) * (max - min));
        return { value, nextSeed };
      };

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

abstract class RNG {
    // LCG using GCC's constants
    private static m = 0x80000000; // 2**31
    private static a = 1103515245;
    private static c = 12345;

    /**
     * Call `hash` repeatedly to generate the sequence of hashes.
     * @param seed 
     * @returns a hash of the seed
     */
    public static hash = (seed: number) => (RNG.a * seed + RNG.c) % RNG.m;

    /**
     * Takes hash value and scales it to the range [-1, 1]
     */
    public static scale = (hash: number) => (2 * hash) / (RNG.m - 1) - 1;
}

class Vec {
    constructor(
        public readonly x: number = 0, 
        public readonly y: number = 0
    ) { }

    add = (b: Vec) => new Vec(this.x + b.x, this.y + b.y)
    sub = (b: Vec) => this.add(b.scale(-1))
    len = () => Math.sqrt(this.x * this.x + this.y * this.y)
    scale = (s: number) => new Vec(this.x * s, this.y * s)
    ortho = () => new Vec(this.y, -this.x)

    static Zero = new Vec();
}