import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Car {
  private loader: GLTFLoader;
  public pivot: THREE.Group;
  public model: THREE.Group | null = null;

  // Wheel meshes from the model
  public wheelFrontLeft: THREE.Mesh | null = null;
  public wheelFrontRight: THREE.Mesh | null = null;
  public wheelBackLeft: THREE.Mesh | null = null;
  public wheelBackRight: THREE.Mesh | null = null;

  // Wheel pivot groups for rotation
  public wheelFrontLeftPivot: THREE.Group | null = null;
  public wheelFrontRightPivot: THREE.Group | null = null;
  public wheelBackLeftPivot: THREE.Group | null = null;
  public wheelBackRightPivot: THREE.Group | null = null;

  // Physics
  public chassisBody: CANNON.Body | null = null;
  public vehicle: CANNON.RaycastVehicle | null = null;

  // Paramètres configurables
  private maxSteerValue: number = 0.7; // Valeur de braquage maximale
  private maxForce: number = 30000; // Force maximale
  private brakeForce: number = 50; // Force de freinage

  // Current speed for display
  public currentSpeed: number = 0;

  // Wheel positions
  private wheelPositions = [
    { x: 0.35, y: -0.17, z: 0.6 }, // Front left
    { x: -0.35, y: -0.17, z: 0.6 }, // Front right
    { x: 0.35, y: -0.17, z: -0.5 }, // Back left
    { x: -0.35, y: -0.17, z: -0.5 }, // Back right
  ];

  constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
    this.loader = new GLTFLoader();
    this.pivot = new THREE.Group();
    scene.add(this.pivot);

    this.loader.load(
      "/models/gltf/car/car.gltf",
      (gltf: GLTF) => {
        this.model = gltf.scene;
        this.model.scale.set(0.005, 0.005, 0.005);
        this.pivot.add(this.model);
        this.model.position.set(0, -0.25, 0);

        // Activer les ombres pour le modèle de la voiture
        this.model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            child.castShadow = true; // La voiture projette des ombres
            child.receiveShadow = true; // La voiture reçoit des ombres
          }
        });

        // Debug: Display object names
        this.model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            console.log(child.name, child);
          }
        });

        // Get wheel meshes from the model
        this.wheelFrontLeft = this.model.getObjectByName(
          "Wiel_Voor_L_Mat_InitialDCar_0"
        ) as THREE.Mesh;
        this.wheelFrontRight = this.model.getObjectByName(
          "Wiel_Voor_R_Mat_InitialDCar_0"
        ) as THREE.Mesh;
        this.wheelBackLeft = this.model.getObjectByName(
          "Wiel_Achter_L_Mat_InitialDCar_0"
        ) as THREE.Mesh;
        this.wheelBackRight = this.model.getObjectByName(
          "Wiel_Achter_R_Mat_InitialDCar_0"
        ) as THREE.Mesh;

        // Adjust wheel scales
        const wheelScaleFactor = 0.005;
        if (this.wheelFrontLeft)
          this.wheelFrontLeft.scale.set(
            wheelScaleFactor,
            wheelScaleFactor,
            wheelScaleFactor
          );
        if (this.wheelFrontRight)
          this.wheelFrontRight.scale.set(
            wheelScaleFactor,
            wheelScaleFactor,
            wheelScaleFactor
          );
        if (this.wheelBackLeft)
          this.wheelBackLeft.scale.set(
            wheelScaleFactor,
            wheelScaleFactor,
            wheelScaleFactor
          );
        if (this.wheelBackRight)
          this.wheelBackRight.scale.set(
            wheelScaleFactor,
            wheelScaleFactor,
            wheelScaleFactor
          );

        // Set up wheel pivots for better control
        this.setupWheelPivots();

        // Create physics chassis
        this.setupPhysics(physicsWorld);

        // Add wheels to the vehicle
        this.setupWheels(physicsWorld);

        // Start the car in a stable position
        if (this.chassisBody) {
          this.chassisBody.position.set(0, 0, 0);
          this.chassisBody.quaternion.setFromEuler(0, 0, 0);
          this.chassisBody.velocity.set(0, 0, 0);
          this.chassisBody.angularVelocity.set(0, 0, 0);
        }

        // Create headlights
        this.createHeadlights();
      },
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error("An error happened", error);
      }
    );
  }

  private setupWheelPivots(): void {
    if (!this.model) return;

    // Front Left Wheel
    if (this.wheelFrontLeft) {
      this.wheelFrontLeftPivot = new THREE.Group();
      this.wheelFrontLeftPivot.position.set(
        this.wheelPositions[0].x,
        this.wheelPositions[0].y,
        this.wheelPositions[0].z
      );
      this.pivot.add(this.wheelFrontLeftPivot);
      this.wheelFrontLeft.position.set(0, 0, 0);
      this.wheelFrontLeftPivot.add(this.wheelFrontLeft);
    }

    // Front Right Wheel
    if (this.wheelFrontRight) {
      this.wheelFrontRightPivot = new THREE.Group();
      this.wheelFrontRightPivot.position.set(
        this.wheelPositions[1].x,
        this.wheelPositions[1].y,
        this.wheelPositions[1].z
      );
      this.pivot.add(this.wheelFrontRightPivot);
      this.wheelFrontRight.position.set(0, 0, 0);
      this.wheelFrontRightPivot.add(this.wheelFrontRight);
    }

    // Back Left Wheel
    if (this.wheelBackLeft) {
      this.wheelBackLeftPivot = new THREE.Group();
      this.wheelBackLeftPivot.position.set(
        this.wheelPositions[2].x,
        this.wheelPositions[2].y,
        this.wheelPositions[2].z
      );
      this.pivot.add(this.wheelBackLeftPivot);
      this.wheelBackLeft.position.set(0, 0, 0);
      this.wheelBackLeftPivot.add(this.wheelBackLeft);
    }

    // Back Right Wheel
    if (this.wheelBackRight) {
      this.wheelBackRightPivot = new THREE.Group();
      this.wheelBackRightPivot.position.set(
        this.wheelPositions[3].x,
        this.wheelPositions[3].y,
        this.wheelPositions[3].z
      );
      this.pivot.add(this.wheelBackRightPivot);
      this.wheelBackRight.position.set(0, 0, 0);
      this.wheelBackRightPivot.add(this.wheelBackRight);
    }

    // Update wheel positions based on actual pivot positions (sans multiplication par scaleFactor)
    if (
      this.wheelFrontLeftPivot &&
      this.wheelFrontRightPivot &&
      this.wheelBackLeftPivot &&
      this.wheelBackRightPivot
    ) {
      this.wheelPositions = [
        {
          x: this.wheelFrontLeftPivot.position.x,
          y: this.wheelFrontLeftPivot.position.y,
          z: this.wheelFrontLeftPivot.position.z,
        },
        {
          x: this.wheelFrontRightPivot.position.x,
          y: this.wheelFrontRightPivot.position.y,
          z: this.wheelFrontRightPivot.position.z,
        },
        {
          x: this.wheelBackLeftPivot.position.x,
          y: this.wheelBackLeftPivot.position.y,
          z: this.wheelBackLeftPivot.position.z,
        },
        {
          x: this.wheelBackRightPivot.position.x,
          y: this.wheelBackRightPivot.position.y,
          z: this.wheelBackRightPivot.position.z,
        },
      ];

      console.log("Wheel positions:", this.wheelPositions);
    }
  }

  private setupPhysics(physicsWorld: CANNON.World): void {
    if (!this.model) return;

    // // Récupérer le mesh de la voiture
    // const carMesh = this.model.getObjectByName(
    //   "InitialDCar_Mat_InitialDCar_0"
    // ) as THREE.Mesh;

    // // Créer une forme de châssis à partir de la géométrie du mesh
    // const geometry = carMesh.geometry as THREE.BufferGeometry;
    // const vertices = geometry.attributes.position.array;

    // // Appliquer l'échelle au mesh
    // const scaleFactor = 0.005;
    // const scaledVertices = new Float32Array(vertices.length);
    // for (let i = 0; i < vertices.length; i++) {
    //   scaledVertices[i] = vertices[i] * scaleFactor; // Appliquer l'échelle
    // }

    // const indices = geometry.index ? geometry.index.array : undefined;

    // // Créer le mesh de collision
    // const chassisShape = new CANNON.Trimesh(
    //   Array.from(scaledVertices),
    //   indices ? Array.from(indices) : [] // Fallback to an empty array if indices is undefined
    // );

    const chassisShape = new CANNON.Box(new CANNON.Vec3(0.38, 0.1, 0.9));

    // Créer le corps physique
    const mass = 3000; // Masse réduite pour la stabilité
    this.chassisBody = new CANNON.Body({ mass: mass });
    this.chassisBody.addShape(chassisShape);

    // Positionner le châssis au-dessus du sol
    this.chassisBody.position.set(
      this.pivot.position.x,
      this.pivot.position.y + 1, // Ajustez la position selon vos besoins
      this.pivot.position.z
    );

    // Ajouter un amortissement pour réduire les rebonds et augmenter la stabilité
    this.chassisBody.linearDamping = 0.5; // Amortissement linéaire (réduction de la vitesse)
    this.chassisBody.angularDamping = 0.5; // Amortissement angulaire (réduction de la rotation)

    physicsWorld.addBody(this.chassisBody);

    // Créer le véhicule
    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.chassisBody,
      indexRightAxis: 0, // Axe X
      indexUpAxis: 1, // Axe Y (vertical)
      indexForwardAxis: 2, // Axe Z (avant)
    });
  }
  private setupWheels(physicsWorld: CANNON.World): void {
    if (!this.vehicle) return;

    // Wheel options (ajustez le radius selon vos besoins)
    const wheelOptions = {
      radius: 0.19, // Réduisez cette valeur pour correspondre à l'échelle correcte
      directionLocal: new CANNON.Vec3(0, -1, 0), // Down direction
      suspensionStiffness: 23,
      suspensionRestLength: 0.1,
      frictionSlip: 1.5,
      dampingRelaxation: 10,
      dampingCompression: 2.5,
      maxSuspensionForce: 80000,
      rollInfluence: 0.05,
      axleLocal: new CANNON.Vec3(1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0),
      maxSuspensionTravel: 5,
      customSlidingRotationalSpeed: 0,
      useCustomSlidingRotationalSpeed: true,
    };

    // Add wheels to the vehicle
    this.wheelPositions.forEach((position, index) => {
      wheelOptions.chassisConnectionPointLocal.set(
        position.x,
        position.y,
        position.z
      );
      this.vehicle?.addWheel(wheelOptions);
    });
    this.vehicle.addToWorld(physicsWorld);
  }

  // Control methods
  public applyControls(controls: {
    forward: boolean;
    backward: boolean;
    left: boolean;
    right: boolean;
    brake: boolean;
  }): void {
    if (!this.vehicle) return;

    // Calcul de la force moteur
    let engineForce = 0;
    if (controls.forward) {
      engineForce = this.maxForce;
    } else if (controls.backward) {
      engineForce = -this.maxForce / 2;
    } else {
      engineForce = 0;
    }

    // Calcul de la valeur de braquage
    let steering = 0;
    if (controls.left) {
      steering = this.maxSteerValue;
    } else if (controls.right) {
      steering = -this.maxSteerValue;
    } else {
      steering = 0;
    }

    // Appliquer la force uniquement aux roues arrière (indices 2 et 3)
    this.vehicle.applyEngineForce(engineForce, 2);
    this.vehicle.applyEngineForce(engineForce, 3);

    // Appliquer le braquage aux roues avant (indices 0 et 1)
    this.vehicle.setSteeringValue(steering, 0);
    this.vehicle.setSteeringValue(steering, 1);

    // Appliquer le freinage sur toutes les roues si besoin
    const brakeValue = controls.brake ? this.brakeForce : 0;
    for (let i = 0; i < 4; i++) {
      this.vehicle.setBrake(brakeValue, i);
    }
  }

  // Update method to be called in the animation loop
  public update(): void {
    if (!this.chassisBody || !this.model || !this.vehicle) return;

    // Update model position and rotation based on physics
    this.pivot.position.copy(
      new THREE.Vector3(
        this.chassisBody.position.x,
        this.chassisBody.position.y,
        this.chassisBody.position.z
      )
    );

    this.pivot.quaternion.copy(
      new THREE.Quaternion(
        this.chassisBody.quaternion.x,
        this.chassisBody.quaternion.y,
        this.chassisBody.quaternion.z,
        this.chassisBody.quaternion.w
      )
    );

    // Update wheel visuals
    this.updateWheelVisuals();
  }

  // Update wheel visuals based on physics
  private updateWheelVisuals(): void {
    if (!this.vehicle) return;

    const wheels = [
      this.wheelFrontLeft,
      this.wheelFrontRight,
      this.wheelBackLeft,
      this.wheelBackRight,
    ];

    const pivots = [
      this.wheelFrontLeftPivot,
      this.wheelFrontRightPivot,
      this.wheelBackLeftPivot,
      this.wheelBackRightPivot,
    ];

    for (let i = 0; i < this.vehicle.wheelInfos.length; i++) {
      this.vehicle.updateWheelTransform(i);
      const t = this.vehicle.wheelInfos[i].worldTransform;

      // Apply rotation to wheel mesh (spinning)
      if (wheels[i]) {
        // Apply wheel rotation for forward/backward movement
        const wheelInfo = this.vehicle.wheelInfos[i];
        if (wheelInfo.deltaRotation) {
          wheels[i]!.rotation.x += wheelInfo.deltaRotation;
        }
      }

      // Apply steering to front wheel pivots
      if (i < 2) {
        // Only front wheels
        const pivot = pivots[i];
        if (pivot) {
          // Interpoler la rotation pour un mouvement plus fluide
          const targetSteeringAngle = this.vehicle.wheelInfos[i].steering; // Utiliser la valeur de braquage
          pivot.rotation.y += (targetSteeringAngle - pivot.rotation.y) * 0.1; // Interpolation
        }
      }
    }
  }

  // Méthode pour ajuster la vitesse maximale
  public setMaxSpeed(speed: number): void {
    this.maxSpeed = speed;
  }

  // Méthode pour ajuster le rayon de braquage
  public setTurnRadius(radius: number): void {
    this.turnRadius = radius;
  }

  // Méthode pour obtenir la vitesse actuelle
  public getCurrentSpeed(): number {
    return this.currentSpeed;
  }

  private createHeadlights(): void {
    // Créer une lumière ponctuelle pour le phare gauche (SpotLight)
    const leftHeadlight = new THREE.SpotLight(
      0xffffff,
      4,
      10,
      Math.PI / 4,
      0.5,
      2
    );
    leftHeadlight.position.set(0.25, 0.2, 0.85); // Positionner le phare gauche
    leftHeadlight.castShadow = true; // Activer l'ombre
    this.pivot.add(leftHeadlight); // Ajouter à la voiture

    // Créer une lumière directionnelle pour la cible du phare gauche
    const leftTarget = new THREE.Object3D();
    leftTarget.position.set(0.25, 0, 2); // Position initiale de la cible (avant de la voiture)
    this.pivot.add(leftTarget); // Ajouter la cible à la voiture
    leftHeadlight.target = leftTarget; // Associer le phare gauche à la cible

    // Créer une lumière ponctuelle pour le phare droit (SpotLight)
    const rightHeadlight = new THREE.SpotLight(
      0xffffff,
      4,
      10,
      Math.PI / 4,
      0.5,
      2
    );
    rightHeadlight.position.set(-0.25, 0.2, 0.85); // Positionner le phare droit
    rightHeadlight.castShadow = true; // Activer l'ombre
    this.pivot.add(rightHeadlight); // Ajouter à la voiture

    // Créer une lumière directionnelle pour la cible du phare droit
    const rightTarget = new THREE.Object3D();
    rightTarget.position.set(-0.25, 0, 2); // Position initiale de la cible (avant de la voiture)
    this.pivot.add(rightTarget); // Ajouter la cible à la voiture
    rightHeadlight.target = rightTarget; // Associer le phare droit à la cible
  }

  private updateHeadlights(): void {
    if (!this.chassisBody) return;

    // Récupérer la direction actuelle du véhicule
    const forward = new THREE.Vector3(0, 0, 1); // Vecteur directionnel de la voiture (vers l'avant)
    const worldDirection = new THREE.Vector3();

    // Récupérer la direction globale de la voiture
    this.pivot.getWorldDirection(worldDirection);

    // Mettre à jour les cibles des phares pour les orienter en fonction de la direction de la voiture
    if (this.pivot && this.pivot.children) {
      // Mettre à jour la position de la cible du phare gauche
      if (this.pivot.children[1] && this.pivot.children[1].target) {
        this.pivot.children[1].target.position
          .copy(worldDirection)
          .multiplyScalar(2)
          .add(this.pivot.position);
      }

      // Mettre à jour la position de la cible du phare droit
      if (this.pivot.children[2] && this.pivot.children[2].target) {
        this.pivot.children[2].target.position
          .copy(worldDirection)
          .multiplyScalar(2)
          .add(this.pivot.position);
      }
    }
  }
}
