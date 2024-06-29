# Lynn's Pokémon Damage Calculator
This calculator is a fork of Smogon's damage calculator, modified by the lovely anastaraweh for the express purpose of Nuzlockes, and this version attempts to continue that mission, with a focus on pretty user interface and optimisation for multiple hack games.

I will not succumb to settling for the old showdown calc. A calculator shall be my canvas, and art is what will be made.

## Features

Previously added features:
- R&B Calc features
  - Box on the left to show all custom imported sets. Click an icon to load it.
  - Colour coding to indicate OHKO and speed tiering across the box for Pokémon.
  - Buttons that automatically progress between previous and next trainer.
- Anastaraweh features
  - AI flags for each trainer.
  - Moves that the enemy AI can switch out on mid-battle are flagged.
  - Enemy mons can be marked as dead, and the switch-in AI for Generation 3 is automatically calculated, showing which Pokémon will come out next against the current mon out.
  - EXP yields for every enemy mon is listed.
  - Sets are automatically set to the corresponding weather and badge boosts when selected.
  - Badge boosts have been added.
- KinglerChamp's VanillaNuzlockeCalc
  - The set selector now searches through set names as well as Pokémon species. For example, the set name "Rayquaza (Bird Keeper Billy)" will show up if "Billy" is searched.
Thank you for all the work of the aforementioned creators, this calculator would not be possible. Most of the work that I've done is simply repurposing what prior developers have done.

New features that I've added:
- Speed icons, just like Emi's CK+ calculator. These are disabled when in doubles.
- Double fights now also have flags.
- Added animated menu icons in place of the previously static icons.
- Added a sprite display.
- Removed base stats and IVs from the screen, now only displaying the total stats. 
- General UI overhaul, more symmetric and centred, more colourful, more everything.
  - Recoil and recovery HP has been moved to be below the actual damage roll instead of being an extension of the original roll.
- Damage rolls have been changed to no longer be duplicate, instead listed as a multiplier. No more counting damage rolls, you will simply be told how many rolls have that damage.
- Chip damage table, so you no longer have to use your calculator to find out how much HP you regain from Leftovers.

Future features planned:
- Adding a Pokémon card when right-clicking on a boxed mon, showing a radar chart of a Pokémon's IVs and nature, like an actual dashboard summary. No more boring IV screens that don't include the ability and vice versa.
- Changing the game button to be a dropdown menu.
- Changing the damage rolls listing to be a slider ranging from the minimum to the maximum that the user can slide around to determine how many rolls kill, etc.
- Creating APNG files so that I can continue using animated menu sprites for gen 6+ datasets.
- Toggleable arrows that let the user decide which features they would like to hide (IVs, typings, HP, natures, etc).
- Adding a second enemy party so that tag battles can display both enemies at once.
- Dynamic background effects depending on the weather selected (for ambience, of course).
- Adding Run&Bun to the games list...
- A settings panel that allow the end-user to customise fonts, colours, backgrounds, etc.

## Installation
Trying to run this on your local machine?

`npm install
cd calc
npm install
cd ..
node build
open dist/index.html`

If files outside of the /calc/ folder are modified, `node build view` is a much faster way of building (does not have to process any TypeScript). Any modifications to /calc/ will require you to rebuild entirely.

## Additional tools
I have a script using Python's pandas library that imports JSON set data to output an actual readable table with each set, since species -> set-name -> actual-set is a lot less intuitive with trainers and Nuzlockes. Might upload that at some point.

There's a repo that contains all the animated menu sprites I use for this project. Most sprites are raw game assets, but any trainer sprites not from the game assets are borrowed from the wonderful artists who contributed to Pokémon Showdown's trainer sprite gallery. Please check them out! Support your local artists, say no against the plight of charmless generative AI!


## Credits

This project was created by Honko and is primarily maintained by Austin.

- Gens 1-6 were originally implemented by Honko.
- The Omega Ruby / Alpha Sapphire update was done by gamut-was-taken and Austin.
- The Gen 7 update was done by Austin.
- The Gen 8 update was done by Austin and Kris.
- The Gen 9 update was done by Austin and Kris.
- Some CSS styling was contributed by Zarel to match the Pokémon Showdown! theme.

Many other contributors have added features or contributed bug fixes, please see the
[full list of contributors](https://github.com/smogon/damage-calc/graphs/contributors).

## License

This package is distributed under the terms of the [MIT License][3].

  [0]: https://github.com/smogon/damage-calc
  [1]: https://github.com/smogon/damage-calc/tree/master/calc
  [2]: https://github.com/smogon/damage-calc/tree/master/src
  [3]: https://github.com/smogon/damage-calc/blob/master/LICENSE
  [4]: https://github.com/smogon/damage-calc/blob/master/TASKS.md
  [5]: https://unpkg.com/
  [6]: https://webpack.js.org/
  [7]: https://rollupjs.org/
  [8]: https://parceljs.org/
  [9]: https://github.com/pkmn/ps/blob/master/data
