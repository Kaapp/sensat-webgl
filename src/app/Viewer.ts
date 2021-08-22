import { WebGLRenderer, PerspectiveCamera, Scene, Vector3, Group, Box3, Raycaster, Intersection, Line, BufferGeometry, LineBasicMaterial, BufferAttribute, Points, PointsMaterial } from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';
import { BufferGeometryUtils } from 'three/examples/jsm/utils/BufferGeometryUtils';
import Stats from 'stats.js';
import { convertDOMCoordinatesToNDC } from '../utils';
import { Root } from '../ui/Root';
import { isPoints } from '../typeGuards';

export class Viewer {
  protected camera: PerspectiveCamera;
  protected controls: OrbitControls;
  protected measuringLine: Line;
  protected renderer: WebGLRenderer;
  protected scene = new Scene();
  protected stats = new Stats();
  protected _needsUpdate = true;
  
  /**
   * Reference to the UI root in order to obtain bi-directional communication.
   */
  protected uiRoot: Root;

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
    this.controls.addEventListener('change', this.setToUpdate); // Make sure to re-render on control change

    // stats setup
    this.stats.showPanel(0); // display fps
    document.body.appendChild(this.stats.dom);

    // measuring display setup
    const lineGeom = new BufferGeometry();
    lineGeom.setAttribute('position', new BufferAttribute(new Float32Array(6), 3));
    const lineMaterial = new LineBasicMaterial({ color: 0x0000FF });
    this.measuringLine = new Line(lineGeom, lineMaterial);
    this.measuringLine.visible = false;
    // Put the line on a separate layer so we don't get intersections with it from raycaster
    this.measuringLine.layers.set(1);
    this.camera.layers.enable(1); // and make sure the camera can still see it for rendering
    this.scene.add(this.measuringLine);

    // listen for resize events
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // listen for click events
    canvasElement.addEventListener('click', event => this.selectPoint(event));
  }

  // don't call multiple times
  public render(): void {
    this.stats.begin();

    if (this._needsUpdate) {
      this.renderer.render(this.scene, this.camera);
      this._needsUpdate = false;
    }

    this.stats.end();
    requestAnimationFrame(() => this.render());
  }

  // helper method for setting camera and controls
  public setCameraControls(options: {
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

    // Make sure we re-render
    this._needsUpdate = true;
  }

  public setToUpdate = (): void => {
    this._needsUpdate = true;
  }

  public selectPoint(event: MouseEvent) {
    const ndc = convertDOMCoordinatesToNDC(event),
      raycaster = new Raycaster();

      raycaster.params.Points.threshold = 0.1; // use a lower distance threshold as the points are very close together
      raycaster.setFromCamera(ndc, this.camera);

      const intersections = raycaster.intersectObject(this.scene, true); // recurse

      if (intersections.length) {
        // sort by how close the ray got to the point, we want the one the user tried to click on.
        intersections.sort((a, b) => a.distanceToRay - b.distanceToRay);

        const selectedPoint = intersections[0];
        
        if (this.uiRoot) {
          this.uiRoot.setSelectedPoint(selectedPoint);
        }
      }
      else {
        if (this.uiRoot) {
          this.uiRoot.setSelectedPoint(null);
        }
      }
  }

  public setMeasuringLineLocation(startPoint: Intersection, endPoint: Intersection): void {
    if (!startPoint || !endPoint) {
      this.measuringLine.visible = false;
      return;
    }

    const linePosition = this.measuringLine.geometry.getAttribute('position');

    linePosition.setXYZ(0, startPoint.point.x, startPoint.point.y, startPoint.point.z); // start
    linePosition.setXYZ(1, endPoint.point.x, endPoint.point.y, endPoint.point.z); // end
    linePosition.needsUpdate = true;
    // recompute bounding geometries to prevent frustum culling
    this.measuringLine.geometry.computeBoundingSphere();
    this.measuringLine.geometry.computeBoundingBox();

    this.measuringLine.visible = true;

    this._needsUpdate = true;
  }

  public setUiRoot(uiRoot: Root): void {
    this.uiRoot = uiRoot;
  }

  public async loadModelAndDisplay(url: string) {
    const model = await this.loadGLTFAsync(url),
      modelObj = model.children[0]; // There's only one direct child of these particular models

    const mergedPointClouds: Points[] = [],
      BATCH_SIZE = 10; // example value, but the objective is just to reduce draw calls
    for (let i = 0; i < modelObj.children.length; i += BATCH_SIZE) {
      const pointsToMerge = modelObj.children.slice(i, i + BATCH_SIZE)
        .map(point => isPoints(point) ? point.geometry : null);

      const mergedGeoms = BufferGeometryUtils.mergeBufferGeometries(pointsToMerge),
        mergedPointCloud = new Points(mergedGeoms, new PointsMaterial({ vertexColors: true, sizeAttenuation: false }));

      mergedPointClouds.push(mergedPointCloud);
    }

    modelObj.children = mergedPointClouds;

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
  public async loadGLTFAsync(url: string): Promise<Group> {
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
