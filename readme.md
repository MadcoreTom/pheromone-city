# Systems

## Goal

The goal is to reach a high population count.

Cars will spawn if there is
* at least one completely empty house
* at least one completely empty job
* at least one completely empty house
* at least 50% of the cars are in a building (so cars aren't added when there's overwhelming traffic)
* the random timer fires

## Metrics

# Traffic

Affected as cars use road tiles, and slows other cars.

Traffic is considered for pathfinding, so the other "pheremones" like housing don't propogate through it well.

Ultimately, this is to punish poor road planning

# Housing

Emitted by houses with at least one vacant position.

Houses get taller depending on inhabitant count

# Factory

Provides jobs, emitted when there's at least one vacant position.

# Shops

> TODO only sell when you have employees


# Car decisions

house -> work

work -> shop or house

shop -> house


# TODOs

- Specific road models for tiles
    - dead end
    - straight
    - corner
    - T intersection
    - X intersection
- Dynamic placement (based on rand(x,y)) of models in a housing zone
- Events - things like "I couldn't find a shop" or "I've been driving for 40 seconds" could appear in the status bar
- Player's Money - when cars finish work, they give you some budget
- make thet shopping based on an internal value of prodduct