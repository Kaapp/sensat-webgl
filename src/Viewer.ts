import {WebGLRenderer, PerspectiveCamera, Scene, Vector3, Group, Box3, AxesHelper} from 'three';
import {OrbitControls} from 'three/examples/jsm/controls/OrbitControls';
import {GLTFLoader} from 'three/examples/jsm/loaders/GLTFLoader';
import Stats from 'stats.js';

export class Viewer {
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

    // Make sure rotation is calculated correctly otherwise we will rotate the camera on the first user interaction.
    this.controls.update(); 
  }

  selectPoint(event: MouseEvent) {
    // TODO select point code can live here.
  }

  async loadModelAndDisplay(url: string) {
    const model = await this.loadGLTFAsync(url);
    this.scene.add(model);

    // Ideally we know where the data was captured and could project lat/long to this coordinate system
    // but without that information we can start based on the model's bounding box
    const bbox = new Box3().setFromObject(model),
        modelCenter = new Vector3(),
        cameraDistanceZ = bbox.max.z - bbox.min.z,
        cameraPosition = new Vector3();

    bbox.getCenter(modelCenter);
    cameraPosition.copy(modelCenter);
    cameraPosition.z += cameraDistanceZ;

    this.setCameraControls({
        userPosition: cameraPosition,
        lookAtPoint: modelCenter,
        far: 2 * cameraDistanceZ
    });
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
