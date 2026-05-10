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