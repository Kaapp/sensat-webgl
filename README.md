# WebGL Code Exercise

![Example image](images/viewer-screenshot.jpg)

## Task

DISCLAIMER: This task was written with WebGL in mind (the graphics api used at sensat).
It can be completed using any graphics framework/api that you are comfortable working with.

Given some GLTF pointclouds, display the data in webgl and allow the user to select a point on the point cloud.
The data can be found in `assets/`

- `big_cloud.glb` test data to display
- `small_cloud.glb` small amount of data, useful for rapid testing.

### Goals

1. Display point data on screen
2. Implement point selection (console logging the points location is sufficient)
3. Produce a document explaining design choices, approach & build/run instructions.

### Bonus Goals (If you feel like it)

- Optomise app performance.
- Change colour of selected point.
- Build tool to measure distance between 2 points.
- Unit tests

### Tips & Tricks

- Feel free to use the existing code in this repo as a starting point, writing your own app from scratch is also accepted.
- You can change the code in the existing project as you see fit.
- You can use whatever libraries you see fit.
- You can alter the data, as long as the end visualisation looks the same.
- Document everything! This is the easiest way for you to supply us with context for the submission. - What decisions/compromises where made? - What you would improve/change? - What you learned? - Anything else!

## Using the existing code

Starter code for exercise, using typescript & Threejs

### Install

To install dependencies run:

    $ yarn

### Development

    $ yarn start

Serves the development build on `http://localhost:8080`, which will rebuild on file changes.

### Design choices
- Raycaster vs. GPU picking 
    - While GPU picking has notable overhead, as the amount of data grows, it becomes more efficient. In this example, the models being loaded are sufficiently small that raycasting over that many points is acceptable. 
- React 
    - While I'm aware Angular is mentioned in the stack itself, I don't have direct experience with Angular >= 2.x, rather Angular 1.x and modern React. I don't think it would take much for me to learn Angular >= 2.x, but for speed of development I opted to use React as I'm familiar with it and just wanted a (very) simple UI that was functional, albeit not pretty!

### Performance Improvements
- Conditional rendering 
    - We should only re-render the main app when there is something that has changed. We don't need to re-render every animation frame if the output will look the same, this just leads to loud fans and annoyed users.
- Draw call optimisation 
    - By merging the loaded glB point clouds into larger groups of 10k rather than the 1k points-per-object that it initially loads with, I reduced the frametimes significantly.
    - On my personal desktop, the frame time was reduced from 40ms to 2ms. 
    - On a macbook pro, the frame time was reduced from 130ms to 40ms. 
    - This is really just to illustrate the impact such a large number of draw calls can have on application performance. The exact number of points per object could be tweaked further to find a good balance, but as I will mention in the potential improvements, I think there is a better way.

### Potential improvements
- Asset chunking 
    - By splitting the assets into 3d chunks in a method similar to an octree, we can calculate which chunks should be visible within the camera frustum to determine which parts of a large, complex model to load. This would significantly improve the initial loading time of the application as only the visible data would need to be sent to the front-end.
    - Additionally, this allows a level of detail (LOD) technique to be implemented. For the chunks closest to the camera, we can request several smaller chunks (higher resolution). Whereas for the chunks that are further away, we can request fewer larger chunks (lower resolution). This reduces the total number of points we would have to download and display at any one time without affecting the visual fidelity for the user.
    - As I am not hugely familiar with glB/glTF and the related tooling, splitting the data in such a way to do this seemed out of scope given the requested time.
- GPU Picking 
    - Utilising the same asset chunking method as above, each chunk can be assigned an ID. These IDs can act as unique colours that, with a little custom shader code, can be used to render a separate buffer containing the unique colouring. This second buffer can be read when trying to perform intersection tests to determine which chunk (if any) the user selected a point within. Once this has been ascertained, we only need to raycast with the points within a single chunk, rather than either the whole scene or a set of chunks within an octree that the ray has passed through. 
    - While this is something I have done in the past, and it has worked very well, writing custom shaders to do this seemed a little out of scope for this project given the requested time to be spent.

### Some learning
- glB/glTF files 
    - Due to the way in which our data is structured and visualised at my current company, we have to generate our meshes on the fly in the browser based on the criteria of each data point rather than using an existing 3d model format like glTF. This part was new to me, but does not seem particularly complex - I couldn't see any obvious place where geotagging info might have been stored (or it has just been removed from the supplied files) hence my decision to just utilise the model bounding box upon loading rather than worrying about spatial projections. 
    - I asked about the spatial projection and I believe it was said to be in a CRS that uses metres as the unit distance, so I have not implemented any kind of projection.
    - Given this I also felt it best to focus on other areas rather than trying to split the assets as I wasn't sure if there may be any hidden pitfalls with that approach. It seemed a better use of the time to focus on showcasing the other areas I have previous experience in.

### Unfinished
- Unit testing 
    - While I'm a big fan of unit tests, I didn't want to spend too much time given the requested time (and it's a dummy application anyway). 
