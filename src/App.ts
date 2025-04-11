import * as THREE from "three";
import Stats from "stats.js";
import * as CANNON from "cannon-es";
import GUI from "lil-gui";
import CannonDebugger from "cannon-es-debugger";
import { Car } from "./objects/Car";
import { Floor } from "./objects/Floor";
import { Cube } from "./objects/Cube";
import { CarControls } from "./controls/CarControls";
import { Ramp } from "./objects/Ramp";
import { RoadSegment } from "./objects/Roads/RoadSegment";
import { CurvedRoad } from "./objects/Roads/CurvedRoad";
import { GLTFCircuit } from "./objects/Circuits/GLTFCircuit";
import { circuitLights } from "./objects/Circuits/CircuitLights";
import { circuitWalls } from "./objects/Circuits/CircuitWalls";
import { Barrel } from "./objects/Circuits/Barrels";
import { checkpoints, Checkpoint } from "./objects/Circuits/Checkpoints";

interface CameraFollowParams {
  offsetX: number;
  offsetY: number;
  offsetZ: number;
  smoothFactor: number;
  lookAtOffsetY: number;
}

interface DynamicSpot {
  spot: THREE.SpotLight;
  position: THREE.Vector3;
}

export class App {
  private physicsWorld!: CANNON.World;
  private scene!: THREE.Scene;
  private camera!: THREE.PerspectiveCamera;
  private renderer!: THREE.WebGLRenderer;
  private stats!: Stats;
  private gui!: GUI;
  private clock: THREE.Clock = new THREE.Clock();
  private cannonDebugger: any;

  private car!: Car;
  private floor!: Floor;
  private cube!: Cube;
  private carControls!: CarControls;
  private roadSegment!: RoadSegment;
  private curvedRoad!: CurvedRoad;
  private gltfCircuit!: GLTFCircuit;
  private loadingManager: THREE.LoadingManager;
  // Car position
  private carPositionDisplay = {
    x: 0,
    y: 0,
    z: 0,
  };
  private barrels!: Barrel;
  private countdownActive: boolean = true;
  private timerStartTime: number | null = null;
  private raceTimerEl: HTMLElement | null = null;
  private finishLineBody!: CANNON.Body;
  private finishTriggered: boolean = false;
  private checkpoints: Checkpoint[] = checkpoints;

  private async startCountdown(): Promise<void> {
    const countdownEl = document.getElementById("countdown")!;
    const textEl = document.getElementById("countdown-text")!;
    const steps = ["3", "2", "1"];

    countdownEl.style.display = "flex";

    for (let step of steps) {
      textEl.textContent = step;
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }

    countdownEl.style.display = "none";

    this.timerStartTime = performance.now();
    this.raceTimerEl = document.getElementById("race-timer");
    if (this.raceTimerEl) this.raceTimerEl.style.display = "block";
  }
  // Paramètres pour le suivi de la caméra
  private cameraParams: CameraFollowParams = {
    offsetX: 0,
    offsetY: 10,
    offsetZ: 0,
    smoothFactor: 1,
    lookAtOffsetY: 2.5,
  };

  private dynamicSpots: DynamicSpot[] = [];

  async init() {
    // Initialisation de la scène, caméra, renderer...
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0x202020);

    this.initPhysics();

    this.loadingManager = new THREE.LoadingManager();

    this.loadingManager.onStart = () => {
      const loader = document.getElementById("loader");
      if (loader) loader.style.display = "flex";
    };

    this.loadingManager.onProgress = (url, loaded, total) => {
      const text = document.getElementById("loader-text");
      if (text) text.textContent = `Chargement... ${loaded}/${total}`;
    };

    this.loadingManager.onLoad = async () => {
      const loader = document.getElementById("loader");
      if (loader) loader.style.display = "none";

      // 👉 Lance le décompte une fois le modèle chargé
      await this.startCountdown();
      this.countdownActive = false; // autoriser les contrôles
      this.timerStartTime = performance.now();
    };

    // ✅ Ligne d’arrivée bien alignée avec le mesh de debug
    const size = new THREE.Vector3(8, 4, 8); // Dimensions finales
    const rotationY = Math.PI / 4; // 45° rotation

    // Boîte Cannon
    const finishShape = new CANNON.Box(new CANNON.Vec3(size.x, size.y, size.z));
    this.finishLineBody = new CANNON.Body({
      mass: 0,
      type: CANNON.Body.STATIC,
    });
    this.finishLineBody.addShape(finishShape);
    this.finishLineBody.position.set(-68.1, -1, 44.5);
    this.finishLineBody.quaternion.setFromEuler(0, rotationY, 0);
    this.finishLineBody.collisionResponse = false;
    this.physicsWorld.addBody(this.finishLineBody);

    //Checkpoint :
    this.checkpoints.forEach((cp) => {
      const debugSphere = new THREE.Mesh(
        new THREE.SphereGeometry(cp.radius, 8, 8),
        new THREE.MeshBasicMaterial({
          color: 0x00ff00,
          transparent: true,
          opacity: 0.2,
        })
      );
      debugSphere.position.copy(cp.position);
      this.scene.add(debugSphere);
    });

    // Création du debugger après l'initialisation du physicsWorld
    // this.cannonDebugger = CannonDebugger(this.scene, this.physicsWorld, {
    //   color: 0xff0000,
    // });

    // const debugGeometry = new THREE.BoxGeometry(1, 1, 1);
    // const debugMaterial = new THREE.MeshBasicMaterial({
    //   color: 0xff0000,
    //   wireframe: true,
    // });
    // const debugMesh = new THREE.Mesh(debugGeometry, debugMaterial);
    // this.scene.add(debugMesh);

    this.camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.set(0, 4, -10);

    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.shadowMap.enabled = true;
    document.body.appendChild(this.renderer.domElement);

    // const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    // this.scene.add(ambient);

    // Création du sol
    //this.floor = new Floor(this.scene, this.physicsWorld);

    circuitWalls.forEach((wallData) => {
      // ✅ Shape physique
      const shape = new CANNON.Box(
        new CANNON.Vec3(
          wallData.size.width / 2,
          wallData.size.height / 2,
          wallData.size.depth / 2
        )
      );

      const body = new CANNON.Body({
        mass: 0,
        shape,
        position: new CANNON.Vec3(
          wallData.position.x,
          wallData.position.y,
          wallData.position.z
        ),
      });

      // Si rotation est définie (optionnelle)
      if (wallData.rotation) {
        const quat = new CANNON.Quaternion();
        quat.setFromEuler(
          wallData.rotation.x,
          wallData.rotation.y,
          wallData.rotation.z
        );
        body.quaternion.copy(quat);
      }

      this.physicsWorld.addBody(body);

      // // ✅ Visualiser pour debug (tu peux le désactiver en prod)
      // const debug = new THREE.Mesh(
      //   new THREE.BoxGeometry(
      //     wallData.size.width,
      //     wallData.size.height,
      //     wallData.size.depth
      //   ),
      //   new THREE.MeshBasicMaterial({
      //     color: 0xff0000,
      //     transparent: true,
      //     opacity: 0.2,
      //   })
      // );
      // debug.position.copy(wallData.position);
      // if (wallData.rotation) {
      //   debug.rotation.copy(wallData.rotation);
      // }
      // this.scene.add(debug);
    });

    // Création du cube pour test
    this.cube = new Cube(this.scene, this.physicsWorld);

    // Initialisation de la voiture et de ses contrôles
    this.car = new Car(this.scene, this.physicsWorld);
    this.carControls = new CarControls(this.car);

    // this.curvedRoad = new CurvedRoad(this.scene, this.physicsWorld);

    this.gltfCircuit = new GLTFCircuit(
      this.scene,
      this.physicsWorld,
      this.loadingManager
    );

    circuitLights.forEach((lightData) => {
      const spot = new THREE.SpotLight(
        lightData.color || 0xffffff,
        lightData.intensity || 2,
        20,
        Math.PI / 6,
        0.3,
        2
      );
      spot.position.copy(lightData.position);
      spot.castShadow = true;

      const target = new THREE.Object3D();
      target.position.copy(lightData.target);
      this.scene.add(target);
      spot.target = target;

      this.scene.add(spot);

      this.dynamicSpots.push({ spot, position: lightData.position.clone() });
    });

    this.barrels = [
      new Barrel(
        this.scene,
        this.physicsWorld,
        new THREE.Vector3(-99.5, 0, -23)
      ),
      new Barrel(
        this.scene,
        this.physicsWorld,
        new THREE.Vector3(-101.5, 0, -23)
      ),
      new Barrel(
        this.scene,
        this.physicsWorld,
        new THREE.Vector3(-103.5, 0, -23)
      ),
      new Barrel(
        this.scene,
        this.physicsWorld,
        new THREE.Vector3(-100.5, 0, -25)
      ),
      new Barrel(
        this.scene,
        this.physicsWorld,
        new THREE.Vector3(-102.5, 0, -25)
      ),
    ];

    // this.roadSegment = new RoadSegment(
    //   this.scene,
    //   this.physicsWorld,
    //   new THREE.Vector3(0, -2, 0)
    // );

    // this.roadSegment = new RoadSegment(
    //   this.scene,
    //   this.physicsWorld,
    //   new THREE.Vector3(0, -2, 20)
    // );

    // Création de la rampe
    // const rampPosition = new THREE.Vector3(0, -1.5, 10);
    // const rampWidth = 5;
    // const rampHeight = 0.5;
    // const rampDepth = 10;
    // const ramp = new Ramp(
    //   this.scene,
    //   this.physicsWorld,
    //   rampPosition,
    //   rampWidth,
    //   rampHeight,
    //   rampDepth
    // );

    const skyGeo = new THREE.SphereGeometry(500, 32, 15);
    const skyMat = new THREE.ShaderMaterial({
      uniforms: {
        topColor: { value: new THREE.Color(0xffaadd) },
        bottomColor: { value: new THREE.Color(0x5f4b8b) },
        offset: { value: 33 },
        exponent: { value: 0.6 },
      },
      vertexShader: `
        varying vec3 vWorldPosition;
        void main() {
          vec4 worldPosition = modelMatrix * vec4(position, 1.0);
          vWorldPosition = worldPosition.xyz;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform vec3 topColor;
        uniform vec3 bottomColor;
        uniform float offset;
        uniform float exponent;
        varying vec3 vWorldPosition;
    
        void main() {
          float h = normalize(vWorldPosition + offset).y;
          gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
        }
      `,
      side: THREE.BackSide,
    });

    const sky = new THREE.Mesh(skyGeo, skyMat);
    this.scene.add(sky);

    const sunsetLight = new THREE.DirectionalLight(0xffa070, 0.5); // lumière orangée
    sunsetLight.position.set(-20, 10, -10); // angle rasant
    sunsetLight.castShadow = true;
    this.scene.add(sunsetLight);

    // Optionnel : lumière d’ambiance très douce rosée
    const ambientBis = new THREE.AmbientLight(0xffc2e0, 0.3);
    this.scene.add(ambientBis);

    // Stats et GUI
    this.stats = new Stats();
    //this.stats.showPanel(0);
    //document.body.appendChild(this.stats.dom);
    // this.gui = new GUI();
    // this.carControls.setupGUI(this.gui);

    // const cameraFolder = this.gui.addFolder("Camera Follow");
    // cameraFolder
    //   .add(this.cameraParams, "offsetX", -10, 10, 0.1)
    //   .name("Offset X");
    // cameraFolder
    //   .add(this.cameraParams, "offsetY", -10, 10, 0.1)
    //   .name("Offset Y");
    // cameraFolder
    //   .add(this.cameraParams, "offsetZ", -20, 0, 0.1)
    //   .name("Offset Z");
    // cameraFolder
    //   .add(this.cameraParams, "smoothFactor", 0, 1, 0.01)
    //   .name("Smooth Factor");
    // cameraFolder
    //   .add(this.cameraParams, "lookAtOffsetY", -10, 10, 0.1)
    //   .name("LookAt Offset Y");
    // cameraFolder.open();

    // const carFolder = this.gui.addFolder("Car Position");
    // carFolder.add(this.carPositionDisplay, "x").listen().name("X");
    // carFolder.add(this.carPositionDisplay, "y").listen().name("Y");
    // carFolder.add(this.carPositionDisplay, "z").listen().name("Z");
    // carFolder.open();

    window.addEventListener("resize", this.onWindowResize.bind(this));
    // Lancement de l'animation
    this.animate();
  }

  private isNear(
    pos1: THREE.Vector3,
    pos2: THREE.Vector3,
    threshold = 30
  ): boolean {
    return pos1.distanceTo(pos2) < threshold;
  }

  animate = () => {
    requestAnimationFrame(this.animate);
    this.stats.begin();

    const delta = this.clock.getDelta();

    // Mise à jour de la simulation physique
    const fixedTimeStep = 1.0 / 60.0;
    const maxSubSteps = 3;
    this.physicsWorld.step(fixedTimeStep, delta, maxSubSteps);

    // Met à jour le debugger pour afficher les hitboxes
    if (this.cannonDebugger) {
      this.cannonDebugger.update();
    }

    if (this.car?.pivot) {
      const carPos = this.car.pivot.position;

      // Mettez à jour la visibilité des spots
      this.dynamicSpots.forEach(({ spot, position }) => {
        spot.visible = this.isNear(carPos, position, 30);
      });

      this.carPositionDisplay.x = this.car.pivot.position.x.toFixed(2);
      this.carPositionDisplay.y = this.car.pivot.position.y.toFixed(2);
      this.carPositionDisplay.z = this.car.pivot.position.z.toFixed(2);
    }

    if (!this.countdownActive && !this.finishTriggered) {
      this.carControls.update(delta);
    }

    this.car.update(); // ← maintenant uniquement ici

    if (this.timerStartTime && this.raceTimerEl && !this.finishTriggered) {
      const elapsed = performance.now() - this.timerStartTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      const milliseconds = Math.floor(elapsed % 1000);

      this.raceTimerEl.textContent = `${String(minutes).padStart(
        2,
        "0"
      )}:${String(seconds).padStart(2, "0")}.${String(milliseconds).padStart(
        3,
        "0"
      )}`;
    }

    //Gesion des checkpoint :

    // Vérifie les checkpoints
    this.checkpoints.forEach((cp) => {
      if (!cp.passed && this.car?.chassisBody) {
        const carPos = this.car.chassisBody.position;
        const dist = cp.position.distanceTo(carPos as unknown as THREE.Vector3);
        if (dist < cp.radius) {
          cp.passed = true;
          console.log("✅ Checkpoint passé :", cp.position);
        }
      }
    });

    // ✅ Gestion ligne d'arrivée avec vérification des checkpoints
    if (!this.finishTriggered && this.car?.chassisBody) {
      const carPos = this.car.chassisBody.position;
      const finishPos = this.finishLineBody.position;
      const distance = carPos.vsub(finishPos).length();

      const allCheckpointsPassed = this.checkpoints.every((cp) => cp.passed);

      if (distance < 2 && allCheckpointsPassed) {
        this.finishTriggered = true;
        const finalTimeMs = performance.now() - this.timerStartTime;
        const seconds = (finalTimeMs / 1000).toFixed(2);

        // Affiche l'écran de fin
        const endScreen = document.getElementById("end-screen")!;
        const endTime = document.getElementById("end-time")!;
        endTime.textContent = `⏱️ Temps final : ${seconds} secondes`;
        endScreen.style.display = "flex";
      }
    }

    // Suivi de la caméra
    if (this.car.pivot) {
      const carWorldPos = new THREE.Vector3();
      this.car.pivot.getWorldPosition(carWorldPos);

      const carWorldQuat = new THREE.Quaternion();
      this.car.pivot.getWorldQuaternion(carWorldQuat);

      // 👉 Offset caméra (toujours relatif à la voiture)
      const offset = new THREE.Vector3(
        this.cameraParams.offsetX,
        this.cameraParams.offsetY,
        this.cameraParams.offsetZ + 3
      );
      offset.applyQuaternion(carWorldQuat);

      // ✅ Position caméra interpolée
      const desiredPos = carWorldPos.clone().add(offset);
      this.camera.position.lerp(desiredPos, this.cameraParams.smoothFactor);

      // 🎯 Créer un point devant la voiture pour le regard
      const lookAhead = new THREE.Vector3(0, 0, 3); // -Z = devant la voiture
      lookAhead.applyQuaternion(carWorldQuat); // on applique l'orientation
      const lookAtTarget = carWorldPos.clone().add(lookAhead); // vers l’avant

      lookAtTarget.y += this.cameraParams.lookAtOffsetY; // petit offset vertical si tu veux

      this.camera.lookAt(lookAtTarget);
    }
    this.cube.update();

    this.barrels.forEach((barrel) => barrel.update());

    this.renderer.render(this.scene, this.camera);
    this.stats.end();
  };

  private initPhysics() {
    // Création du monde physique
    this.physicsWorld = new CANNON.World();
    this.physicsWorld.gravity.set(0, -9.81, 0);

    // Configuration de la détection des collisions
    this.physicsWorld.broadphase = new CANNON.SAPBroadphase(this.physicsWorld);

    // Configure solver parameters for better stability
    // These settings help with the car physics stability
    this.physicsWorld.defaultContactMaterial.friction = 0.3;
    this.physicsWorld.defaultContactMaterial.restitution = 0.1;
  }

  private onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}
