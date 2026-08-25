/**
 * Inside this file you will use the classes and functions from rx.js
 * to add visuals to the svg element in index.html, animate them, and make them interactive.
 *
 * Study and complete the tasks in observable exercises first to get ideas.
 *
 * Course Notes showing Asteroids in FRP: https://tgdwyer.github.io/asteroids/
 *
 * You will be marked on your functional programming style
 * as well as the functionality that you implement.
 *
 * Document your code!
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
    NEVER,
    startWith,
} from "rxjs";

import { BitIndex, Target, State, Action, Viewport, TargetConfig, Constants } from './types';

import { initialState, Tick, FlipBit, SpawnTarget, Restart, reduceState, bin2dec, Pause } from './state'

import { generateRandomInt, generateTargetParams, RNG, Vec } from "./util";

// Observables
export const state$ = (): Observable<State> => {
    // Generate Tick action every 60ms for State updates
    const tick$ = interval(Constants.TICK_RATE_MS).pipe(
        map(
            elapsed => new Tick(elapsed)
        )
    );

    // When users click keyboard keys
    const keyFlip$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
        filter(({ repeat }) => !repeat),
        filter(({ code }) => code.startsWith('Digit') || code === 'KeyR'),
        map(({ code }) => {
            if (code === 'KeyR') return new Restart();
            // Convert 'Digit1' -> 0, 'Digit8' -> 7
            const index = (Number(code.replace('Digit', '')) - 1) as BitIndex;
            return new FlipBit(index);
        })
    );

    // When users click the SVG elements in canvas directly 
    const mouseFlip$ = fromEvent<MouseEvent>(document, 'click').pipe(
        map(event => event.target as HTMLElement),
        filter(target => target.hasAttribute('data-index')),
        map(target => Number(target.getAttribute('data-index')) as BitIndex),
        map(index => new FlipBit(index))
    );

    const spawnTarget$ = of({seed: 12345, elapsed: 0}).pipe(
        // Map {seed, elapsed} to Observable
        expand(({ seed, elapsed }) => {
            // Generate next Target within 1~3 seconds
            const delayRes = generateRandomInt(1000)(3000)(seed);
            
            return timer(delayRes.value).pipe(
                map(() => ({
                    seed: delayRes.nextSeed,
                    elapsed: elapsed + 1,
                }))
            );
        }),
        filter(({ elapsed }) => elapsed > 0),
            map(({ seed, elapsed }) => {
                const maxX = Viewport.CANVAS_WIDTH - TargetConfig.WIDTH;

                const { val, x, hex, nextSeed } = generateTargetParams(seed, maxX);

                const target: Target = {
                id: `target-${elapsed}-${nextSeed}`,
                createTime: elapsed,
                pos: new Vec(x, 0),
                viewType: 'bits',
                value: val,
                hex: hex,
                };

                return new SpawnTarget(target);
            })
        );

    const pause$ = fromEvent<KeyboardEvent>(document, 'keydown').pipe(
        filter(({ code }) => code === "KeyP" || code === "Escape"),
        map(() => new Pause())
    );

    const isPaused$: Observable<boolean> = pause$.pipe(
        scan((paused: boolean) => !paused, false),
        startWith(false)
    );

    const pausableTick$ = isPaused$.pipe(
        switchMap(isPaused => isPaused ? NEVER : tick$)
    );

    const pausableSpawn$ = isPaused$.pipe(
        switchMap(isPaused => isPaused ? NEVER : spawnTarget$)
    );

    const actions$: Observable<Action> = merge(
        pausableTick$,
        pausableSpawn$,
        pause$,
        keyFlip$,
        mouseFlip$,
    );

    const state$: Observable<State> = actions$.pipe(
        scan(reduceState, initialState)
    );
    return state$
}

// Rendering (side effects)

/**
 * Brings an SVG element to the foreground.
 * @param elem SVG element to bring to the foreground
 */
const bringToForeground = (elem: SVGElement): void => {
    elem.parentNode?.appendChild(elem);
};

/**
 * Displays a SVG element on the canvas. Brings to foreground.
 * @param elem SVG element to display
 */
const show = (elem: SVGElement): void => {
    elem.setAttribute("visibility", "visible");
    bringToForeground(elem);
};

/**
 * Hides a SVG element on the canvas.
 * @param elem SVG element to hide
 */
const hide = (elem: SVGElement): void => {
    elem.setAttribute("visibility", "hidden");
};

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

    // 1. Static Setup: Create bit toggle UI once
    const digitWidth = Viewport.CANVAS_WIDTH / Constants.DIGIT_COUNT;
    const bitElements = Array.from({ length: Constants.DIGIT_COUNT }).map((_, i) => {
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

    // 2. Static Setup: Score Text
    const scoreText = createSvgElement(svg.namespaceURI, "text", {
        x: "20",
        y: "30",
        fill: "white",
        "font-size": "20px",
        "font-family": "sans-serif",
    });
    svg.appendChild(scoreText);

    const currentValue = createSvgElement(svg.namespaceURI, 'text', {
        x: "20",
        y: "80",
        fill: "white",
        "font-size": "20px",
        "font-family": "sans-serif",
    });
    svg.appendChild(currentValue);

    // 3. Static Setup: Text Overlay
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

        // Update Score
        scoreText.textContent = `Score: ${s.score}`;

        currentValue.textContent = `Value: ${bin2dec(s.bits)}`;

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

                const rect = createSvgElement(svg.namespaceURI, "rect", {
                    width: `${TargetConfig.WIDTH}`,
                    height: `${TargetConfig.HEIGHT}`,
                    rx: "6",
                    fill: "white",
                    stroke: "black",
                    "stroke-width": "2",
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
