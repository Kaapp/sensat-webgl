import { Viewer } from "./Viewer";

const SMALL_CLOUD_GLB = 'assets/small_cloud.glb';
const BIG_CLOUD_GLB = 'assets/big_cloud.glb';

const viewer = new Viewer(
  document.getElementById('viewer') as HTMLCanvasElement
);

viewer.loadModelAndDisplay(SMALL_CLOUD_GLB);
viewer.render();
