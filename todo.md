* Cars shouldn't leave buildings if there's no pheremones for what they're looking for. instead they should emit some sort of warning which could incluence and RCI graph or something
* goods
    * factories should consume goods.
    * the edge of the map should produce goods if there's a need for it (not every frame)
    * a factory should only have more an one job if there are goods
    * factories produce products
    * shops consume products .. etc etc
* cars ar e coloured based on their type
* cars only re-assess on intersections, or if the next tile is no-longer a road
* buildings
    * buildings have attachments to roads (which is like buildings currently are).
    * a building can take up more than one tile
    * a tile points to the building (which might be shared with others)
* cars drive on the left
* roads count traffic, and the speed limit slows it its too hhigh (should it have 2 buffers, cycle them every 100-sh frames, and take the metric from the average of both?)


# Game Milestones

## One star

### Unlocked

* road
* destroy
* factory
* small home

### Mechanics

* cars to to work, then home
* houses near polution have no capacity

### Target

* population of 5

## Two stars

### Unlocked

* shops

### Mechanics

* cars can work at shops
* shops can sell goods when it has at least 1 employee
* 30% chance a car goes home->shop->home
* need an empty shop, home and job, and < 50% traffic
    * > Alternatively there must be a home for all cars + 1, and a job for all cars + 1, and a shop with one current worker and no customers