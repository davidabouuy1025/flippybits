# Assignment 1

## Game Features 
### HD Extensions Requirements

- Users can pause the game by clicking 'Key P' or 'Escape'
- Unit tests are provided under `test/`
- Special FallenBit - Steep Target may be spawned where instead of falling smoothly, it teleports downward with larger y distance with delay continuously
- Special Effect - Double Score is applied after users solve 3 FallenBit correctly
- Special Effect - The speed of FallenBit falling grows along users' score and time asurvived

### Full Game Requirements

- FallenBit are randomly spawned in the 1-3 seconds time interval
- Users can restart the game by clicking 'Key R'
- Users can view their score and the current value of their 8 bits
- FallenBit will drop faster as users survive longer

### Minimum Requirements

- Users can flip digits by using mouse or keyboard clicking to control
- Users need to resolve FallenBit before they reach the bottom of the screen, and multiple FallenBit may be spawned

## Usage

Setup (requires node.js):

```bash
> npm install
```

Start tests:

```bash
> npm test
```

Serve up the App (and ctrl-click the URL that appears in the console)

```bash
> npm run dev
```

To format your code, for the assignment specifications:

```bash
npx prettier . --write
```

The configuration for this is set in `.prettierrc.json`. Feel free to change this to your heart's desire, but try to ensure it still fits the assignment guidelines.

If you are using VS Code, you can also install the [Prettier extension](https://marketplace.visualstudio.com/items?itemName=esbenp.prettier-vscode). This skeleton code is set up to automatically format your code on save. You can disable this in `.vscode/settings.json` by changing `"editor.formatOnSave": true` to `"editor.formatOnSave": false`.

## Files Structure

There are a few files you may wish to modify. The rest should **not** be modified as they are used for configuring the build.

`src/main.ts`

- Code file used as the entry point
- Most of your game logic should go here
- Contains main function that is called on page load

`src/style.css`

- Stylesheet
- You may edit this if you wish

`index.html`

- Main html file
- Contains scaffold of game window and some sample shapes
- Feel free to add to this, but avoid changing the existing code, especially the `id` fields

`test/*.test.ts`

- If you want to add tests, these go here
- Uses [`vitest`](https://vitest.dev/api/)

We expect the core logic of your game to be in `src/main.ts`, however, you may elect to spread your code over multiple files. In this case, please use [TS Modules](https://www.typescriptlang.org/docs/handbook/modules.html).

Avoid separating code into too many files as it makes it hard to mark. The maximum recommended code file structure would be something like

```
src/
  main.ts        -- main code logic inc. core game loop
  types.ts       -- common types and type aliases
  util.ts        -- util functions
  state.ts       -- state processing and transformation
  view.ts        -- rendering
  observable.ts  -- functions to create Observable streams
```
