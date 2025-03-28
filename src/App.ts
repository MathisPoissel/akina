import * as THREE from "three";
import Stats from "stats.js";
import GUI from "lil-gui";
import { Car } from "./objects/Car";
import { Floor } from "./objects/Floor";
import { Cube } from "./objects/Cube";
import { CarControls } from "./controls/CarControls";

interface CameraFollowParams {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  smoothFactor: number;
  lookAtOffsetY: number;
}

export class App {
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private stats!: Stats;
  private gui!: GUI;
  private clock: THREE.Clock = new THREE.Clock();

  private car!: Car;
  private floor!: Floor;
  private cube!: Cube;
  private carControls!: CarControls;

  // Paramètres pour le suivi de la caméra
  private cameraParams: CameraFollowParams = {
    offsetX: 0,
    offsetY: 1.6,
    offsetZ: -3.2,
    smoothFactor: 0.1,
    lookAtOffsetY: 1.1,
  };

  async init() {
    // Initialisation de la scène, caméra, renderer...
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 4, -10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(this.renderer.domElement);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    const directional = new THREE.DirectionalLight(0xffffff, 1);
    directional.position.set(5, 5, 5);
    this.scene.add(ambient, directional);

    // Création du sol
    this.floor = new Floor(this.scene);

    // Création du cube (l'argument physicsWorld a été retiré)
    this.cube = new Cube(this.scene);

    // Voiture et ses contrôles
    this.car = new Car(this.scene);
    this.carControls = new CarControls(this.car);

    // Stats et GUI
    this.stats = new Stats();
    this.stats.showPanel(0);
    document.body.appendChild(this.stats.dom);
    this.gui = new GUI();
    this.carControls.setupGUI(this.gui);

    const cameraFolder = this.gui.addFolder("Camera Follow");
    cameraFolder
      .add(this.cameraParams, "offsetX", -10, 10, 0.1)
      .name("Offset X");
    cameraFolder
      .add(this.cameraParams, "offsetY", -10, 10, 0.1)
      .name("Offset Y");
    cameraFolder
      .add(this.cameraParams, "offsetZ", -20, 0, 0.1)
      .name("Offset Z");
    cameraFolder
      .add(this.cameraParams, "smoothFactor", 0, 1, 0.01)
      .name("Smooth Factor");
    cameraFolder
      .add(this.cameraParams, "lookAtOffsetY", -10, 10, 0.1)
      .name("LookAt Offset Y");
    cameraFolder.open();

    window.addEventListener("resize", this.onWindowResize.bind(this));

    // Lancement de l’animation
    this.animate();
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.stats.begin();

    const delta = this.clock.getDelta();

    // Mise à jour des contrôles de la voiture
    this.carControls.update(delta);

    // Suivi de la caméra
    if (this.car.pivot) {
      const carWorldPos = new THREE.Vector3();
      this.car.pivot.getWorldPosition(carWorldPos);

      const carWorldQuat = new THREE.Quaternion();
      this.car.pivot.getWorldQuaternion(carWorldQuat);

      const offset = new THREE.Vector3(
        this.cameraParams.offsetX,
        this.cameraParams.offsetY,
        this.cameraParams.offsetZ
      );
      offset.applyQuaternion(carWorldQuat);

      const desiredPos = carWorldPos.clone().add(offset);
      this.camera.position.lerp(desiredPos, this.cameraParams.smoothFactor);

      const lookAtTarget = carWorldPos.clone();
      lookAtTarget.y += this.cameraParams.lookAtOffsetY;
      this.camera.lookAt(lookAtTarget);
    }

    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  };

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
