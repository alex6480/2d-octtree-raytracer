# 2d-octtree-raytracer

An implementation of a raytracing algorithm for a 2D quad tree. 

The algorithm is based on a principle, that all rays are mirrored so they always enter the tree in a x-positive, y-positive direction. This allows for some optimizations.
Rays not entering in this direction, will produce wrong child indices, but they can be converted using a bitmask to provide correct results.
