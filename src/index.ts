import {WebGLRenderer, PerspectiveCamera, Scene, Vector3, Group} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'stats.js';

class Viewer {
  stats = new Stats();
  camera: PerspectiveCamera;
  controls: OrbitControls;
  renderer: WebGLRenderer;
  scene = new Scene();

  constructor(canvasElement: HTMLCanvasElement) {
    this.renderer = new WebGLRenderer({
      canvas: canvasElement,
      antialias: true,
    });
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.renderer.setSize(window.innerWidth, window.innerHeight);

    // camera setup
    this.camera = new PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      1,
      1000
    );
    this.camera.up.set(0, 0, 1);

    // control setup
    this.controls = new OrbitControls(this.camera, this.renderer.domElement);

    // stats setup
    this.stats.showPanel(0); // display fps
    document.body.appendChild(this.stats.dom);

    // listen for resize events
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // listen for click events
    window.addEventListener('click', event => this.selectPoint(event));
  }

  // don't call multiple times
  render(): void {
    this.stats.begin();
    this.renderer.render(this.scene, this.camera);
    this.stats.end();
    requestAnimationFrame(() => this.render());
  }

  // helper method for setting camera and controls
  setCameraControls(options: {
    userPosition: Vector3;
    lookAtPoint: Vector3;
    far: number;
  }) {
    const {userPosition, lookAtPoint, far} = options;

    // set far plane & position
    this.camera.far = far;
    this.camera.position.copy(userPosition);
    this.camera.updateMatrixWorld();

    // set look at point
    this.controls.target = lookAtPoint;
    this.controls.maxDistance = 10000000; // magic big number
    this.controls.saveState();
  }

  selectPoint(event: MouseEvent) {
    // TODO select point code can live here.
  }

  async loadModelAndDisplay(url: string) {
    const model = await this.loadGLTFAsync(url);
    this.scene.add(model);

    // TODO make sure the model can be seen by the camera
  }

  // boo callbacks, yay promises
  async loadGLTFAsync(url: string): Promise<Group> {
    return new Promise((resolve, reject) => {
      new GLTFLoader().load(
        url,
        ({scene}) => resolve(scene),
        () => {},
        err => reject(err)
      );
    });
  }
}

const SMALL_CLOUD_GLB = 'assets/small_cloud.glb';
const BIG_CLOUD_GLB = 'assets/big_cloud.glb';

const viewer = new Viewer(
  document.getElementById('viewer') as HTMLCanvasElement
);

viewer.loadModelAndDisplay(SMALL_CLOUD_GLB);
viewer.render();
