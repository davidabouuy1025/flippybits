/**
 * Imports of utility functions, classes, constants needed for the game
 */
import "./style.css";

import {
    Observable,
    fromEvent,
    interval,
    scan,
    switchMap,
    take,
    map,
    filter,
    merge,
    of,
    expand,
    timer,
    bufferCount,
    shareReplay,
    pairwise,
    exhaustMap,
    concat,
    ignoreElements,
    defer
} from "rxjs";

import {
    BitIndex,
    Target,
    State,
    Action,
    Viewport,
    TargetConfig,
    Constants,
    TargetMovementConfig
} from './types';

import {
    initialState,
    Tick,
    FlipBit,
    SpawnTarget,
    Restart,
    reduceState,
    Pause,
    StartBonusTrigger,
    EndBonusTrigger
} from './state'

import {
    formatSecondsToMMSS,
    generateRandomInt,
    generateTargetParams,
    Vec,
    bin2dec
} from "./util";

/**
 * Main function block
 * 
 * @returns a stream of State
 */
export const state$ = (): Observable<State> => {
    /** 
     * Generate Tick class every 60ms 
     */
    const tick$ = interval(Constants.TICK_RATE_MS).pipe(
        map(tickIndex => new Tick(tickIndex * (Constants.TICK_RATE_MS / 1000)))
    );

    /**
     * Flip bits when users click keyboard keys
     */
    const keyFlip$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
        filter(({ repeat }) => !repeat),
        filter(({ code }) => code.startsWith('Digit') || code === 'KeyR'),
        map(({ code }) => {
            const index = (Number(code.replace('Digit', '')) - 1) as BitIndex;
            console.log(index)
            return (code === 'KeyR') ? new Restart() : new FlipBit(index);
        })
    );

    /**
     * Flip bits when users click the SVG elements in canvas directly 
     */
    const mouseFlip$ = fromEvent<MouseEvent>(document, 'click').pipe(
        map(event => event.target as HTMLElement),
        filter(target => target.hasAttribute('data-index')),
        map(target => Number(target.getAttribute('data-index')) as BitIndex),
        map(index => new FlipBit(index))
    );

    /**
     * Spawn targets with random bit value in a random 1-3s interval 
     */
    const spawnTarget$ = of({ seed: 12345, elapsed: 0 }).pipe(
        // Random time
        expand(({ seed, elapsed }) => {
            const delayRes = generateRandomInt(1000)(3000)(seed);
            return timer(delayRes.value).pipe(
                map(() => ({
                    seed: delayRes.nextSeed,
                    elapsed: elapsed + 1,
                }))
            );
        }),
        // Ensure elapsed passed from expand() is valid
        filter(({ elapsed }) => elapsed > 0),
        // Random FallenBit (Normal/ Steep)
        map(({ seed, elapsed }) => {
            const maxX = Viewport.CANVAS_WIDTH - TargetConfig.WIDTH;
            const { val, x, hex, nextSeed } = generateTargetParams(seed, maxX);
            const typeRes = generateRandomInt(0)(100)(nextSeed);
            const isStepper = typeRes.value < 35;

            const movementConfig: TargetMovementConfig = isStepper
                ? { kind: 'STEPPER', stepDistance: 30 }
                : { kind: 'SMOOTH' };

            const target: Target = {
                pos: new Vec(x, 0),
                id: `target-${elapsed}-${nextSeed}`,
                createTime: 0,
                viewType: 'bits',
                targetKind: movementConfig,
                value: val,
                hex: hex,
            };

            return new SpawnTarget(target);
        })
    );

    /**
     * Generate Pause class when certain keys are pressed
     */
    const pause$ = fromEvent<KeyboardEvent>(
        document,
        'keydown'
    ).pipe(
        filter(({ code }) => code === "KeyP" || code === "Escape"),
        map(() => new Pause())
    );

    /**
     * Check if users has cleared the most bottom FallenBit
     * 
     * - every time when previous state$ is subscribe, only then this block 
     */
    const matchSuccess$ = defer(() => state$).pipe(
        map(s => s.score),
        pairwise(),
        filter(([prev, curr]) => curr > prev),
        map(() => "CORRECT_MATCH" as const)
    );

    /**
     * Return START_BONUS when required matches are received
     */
    const bonusTrigger$ = matchSuccess$.pipe(
        bufferCount(Constants.BONUS_SCORE_MIN_COUNT),
        map(() => "START_BONUS" as const)
    );

    // Clean, precise bonus period: Start -> Wait duration -> End -> Cooldown
    const bonusPeriod$ = bonusTrigger$.pipe(
        exhaustMap(() =>
            concat(
                of(new StartBonusTrigger()),

                timer(Constants.BONUS_SCORE_TIME_LIMIT).pipe(
                    map(() => new EndBonusTrigger())
                ),

                timer(Constants.BONUS_SCORE_COOLDOWN).pipe(
                    ignoreElements()
                )
            )
        )
    );

    const actions$: Observable<Action> = merge(
        tick$,
        keyFlip$,
        mouseFlip$,
        spawnTarget$,
        pause$,
        bonusPeriod$
    );

    const state$: Observable<State> = actions$.pipe(
        scan(reduceState, initialState),
        shareReplay(1),
    );

    return state$;
};

// Rendering (side effects)

/**
 * Creates an SVG element with the given properties.
 *
 * See https://developer.mozilla.org/en-US/docs/Web/SVG/Element for valid
 * element names and properties.
 *
 * @param namespace Namespace of the SVG element
 * @param name SVGElement name
 * @param props Properties to set on the SVG element
 * @returns SVG element
 */
const createSvgElement = (
    namespace: string | null,
    name: string,
    props: Record<string, string> = {},
): SVGElement => {
    const elem = document.createElementNS(namespace, name) as SVGElement;
    Object.entries(props).forEach(([k, v]) => elem.setAttribute(k, v));
    return elem;
};

const render = (): ((s: State) => void) => {
    const svg = document.querySelector("#svgCanvas") as SVGSVGElement;

    svg.setAttribute(
        "viewBox",
        `0 0 ${Viewport.CANVAS_WIDTH} ${Viewport.CANVAS_HEIGHT}`,
    );

    const digitWidth = Viewport.CANVAS_WIDTH / Constants.DIGIT_COUNT;
    const bitElements = Array.from(
        { length: Constants.DIGIT_COUNT }
    ).map(
        (_, i) => {
            const rect = createSvgElement(svg.namespaceURI, "rect", {
                x: `${i * digitWidth + 4}`,
                y: `${Viewport.CANVAS_HEIGHT - 50}`,
                width: `${digitWidth - 8}`,
                height: "40",
                fill: "#ef9a9a",
                stroke: "black",
                "stroke-width": "2",
                "data-index": `${i}`, // Enables click event mapping in mouseFlip$
            });

            const text = createSvgElement(svg.namespaceURI, "text", {
                x: `${i * digitWidth + digitWidth / 2}`,
                y: `${Viewport.CANVAS_HEIGHT - 22}`,
                "text-anchor": "middle",
                "font-family": "monospace",
                fill: "black",
                "pointer-events": "none", // Allows clicks to pass through to the rect
            });

            svg.appendChild(rect);
            svg.appendChild(text);
            return { rect, text };
        });

    const scoreText = createSvgElement(svg.namespaceURI, "text", {
        x: "15",
        y: "40",
        fill: "black",
        "font-size": "20px",
        "font-family": "sans-serif",
    });
    svg.appendChild(scoreText);

    const currentValue = createSvgElement(svg.namespaceURI, 'text', {
        x: "15",
        y: "80",
        fill: "black",
        "font-size": "20px",
        "font-family": "sans-serif",
    });
    svg.appendChild(currentValue);

    const svg1 = document.querySelector("#svgEffect") as SVGSVGElement;
    const timeText = createSvgElement(svg1.namespaceURI, "text", {
        x: "15",
        y: "110",
        fill: "#000000",
        "font-size": "45",
        "font-family": "monospace",
        "font-weight": "bold",
    });
    svg1.appendChild(timeText);

    const svg2 = document.querySelector("#svgEffects") as SVGGElement;
    const effectText = createSvgElement(svg2.namespaceURI, "text", {
        x: "15",
        y: "110",
        fill: "#000000",
        "font-size": "20",
        "font-family": "monospace",
        "font-weight": "",
    });
    svg2.appendChild(effectText);

    const startText = createSvgElement(svg.namespaceURI, "text", {
        x: `${Viewport.CANVAS_WIDTH / 2}`,
        y: `${Viewport.CANVAS_HEIGHT / 2}`,
        "text-anchor": "middle",
        fill: "red",
        "font-size": "32px",
        "font-weight": "bold",
        visibility: "hidden",
    });
    startText.textContent = "Click anywehre to start!";
    svg.appendChild(startText);

    const gameOverText = createSvgElement(svg.namespaceURI, "text", {
        x: `${Viewport.CANVAS_WIDTH / 2}`,
        y: `${Viewport.CANVAS_HEIGHT / 2}`,
        "text-anchor": "middle",
        fill: "red",
        "font-size": "32px",
        "font-weight": "bold",
        visibility: "hidden",
    });
    gameOverText.textContent = "GAME OVER - Press R to Restart";
    svg.appendChild(gameOverText);

    const pauseText = createSvgElement(svg.namespaceURI, "text", {
        x: `${Viewport.CANVAS_WIDTH / 2}`,
        y: `${Viewport.CANVAS_HEIGHT / 2}`,
        "text-anchor": "middle",
        fill: "red",
        "font-size": "32px",
        "font-weight": "bold",
        visibility: "hidden",
    });
    pauseText.textContent = "Pause - Press P to Resume";
    svg.appendChild(pauseText);

    // Dynamic Element Cache: Stores SVGGElement instances mapped by Target ID
    const targetMap = new Map<string, SVGGElement>();

    // Returned closure: Called on every State emission
    return (s: State) => {
        // Update Bit UI State
        s.bits.forEach((bitValue, i) => {
            bitElements[i].text.textContent = String(bitValue);
            bitElements[i].rect.setAttribute(
                "fill", bitValue === 1 ? "#81c784" : "#ef9a9a");
        });

        // Update Time Display
        timeText.textContent = `TIME: ${formatSecondsToMMSS(s.time)}`;

        // Update Score
        scoreText.textContent = `Score: ${s.score}`;
        currentValue.textContent = `Value: ${bin2dec(s.bits)}`;

        effectText.textContent =
            (s.isDoublePoint)
                ? "x2 POINTS"
                : "";

        // Reconcile Targets (Add / Update / Remove)
        const currentTargetIds = new Set(s.targets.map(t => t.id));

        // Remove stale targets no longer present in State
        targetMap.forEach((g, id) => {
            if (!currentTargetIds.has(id)) {
                svg.removeChild(g);
                targetMap.delete(id);
            }
        });

        // Render / Move active targets
        s.targets.forEach(t => {
            let g = targetMap.get(t.id);
            if (!g) {
                g = createSvgElement(svg.namespaceURI, "g") as SVGGElement;

                const isStepper = t.targetKind.kind === 'STEPPER';

                const rect = createSvgElement(svg.namespaceURI, "rect", {
                    width: `${TargetConfig.WIDTH}`,
                    height: `${TargetConfig.HEIGHT}`,
                    rx: "6",
                    fill: isStepper ? "#fff3e0" : "white",
                    stroke: isStepper ? "#e65100" : "black",
                    "stroke-width": isStepper ? "2.5" : "2",
                });

                const text = createSvgElement(svg.namespaceURI, "text", {
                    x: `${TargetConfig.WIDTH / 2}`,
                    y: `${TargetConfig.HEIGHT / 2 + 6}`,
                    "text-anchor": "middle",
                    "font-family": "monospace",
                    fill: "black",
                });
                text.textContent = t.viewType === "hex" ? t.hex : String(t.value);

                g.appendChild(rect);
                g.appendChild(text);
                svg.appendChild(g);
                targetMap.set(t.id, g);
            }

            // Position target using SVG transform
            g.setAttribute("transform", `translate(${t.pos.x}, ${t.pos.y})`);
        });

        // Handle Game Over Visibility

        gameOverText.setAttribute("visibility", s.gameEnd ? "visible" : "hidden");

        pauseText.setAttribute("visibility", s.gamePause ? "visible" : "hidden");
    };
};


// The following simply runs your main function on window load.  Make sure to leave it in place.
// You should not need to change this, beware if you are.
if (typeof window !== "undefined") {
    // Observable: wait for first user click
    const click$ = fromEvent(document.body, "mousedown").pipe(take(1));

    click$.pipe(switchMap(() => state$())).subscribe(render());
}
