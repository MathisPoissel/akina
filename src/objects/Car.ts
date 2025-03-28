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

  // Controls state
  private forwardVelocity: number = 0;
  private rightVelocity: number = 0;
  private maxSteerValue: number = 0.5;
  private maxForce: number = 8000; // Reduced to prevent flying
  private brakeForce: number = 50;

  // Current speed for display
  public currentSpeed: number = 0;

  // Wheel positions (ajustez ces valeurs selon les besoins)
  private wheelPositions = [
    { x: 0.35, y: -0.045, z: 0.6 }, // Front left (ajustez selon vos besoins)
    { x: -0.35, y: -0.045, z: 0.6 }, // Front right (ajustez selon vos besoins)
    { x: 0.35, y: -0.045, z: -0.5 }, // Back left (ajustez selon vos besoins)
    { x: -0.35, y: -0.045, z: -0.5 }, // Back right (ajustez selon vos besoins)
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
        this.model.position.set(0, -0.2, 0);

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

    // Create chassis body from model bounding box
    const box = new THREE.Box3().setFromObject(this.model);
    const size = new THREE.Vector3();
    box.getSize(size);

    // Reduce the size a bit to make the car more stable
    const halfExtents = new CANNON.Vec3(
      (size.x / 2) * 0.8,
      (size.y / 2) * 0.6,
      (size.z / 2) * 0.8
    );

    const chassisShape = new CANNON.Box(halfExtents);
    const mass = 1000; // Reduced mass for stability
    this.chassisBody = new CANNON.Body({ mass: mass });
    this.chassisBody.addShape(chassisShape);

    // Position the chassis above the ground
    this.chassisBody.position.set(
      this.pivot.position.x,
      this.pivot.position.y + halfExtents.y + 0.5,
      this.pivot.position.z
    );

    // Add damping to reduce bouncing and increase stability
    this.chassisBody.linearDamping = 0.1;
    this.chassisBody.angularDamping = 0.1;

    physicsWorld.addBody(this.chassisBody);

    // Create vehicle
    this.vehicle = new CANNON.RaycastVehicle({
      chassisBody: this.chassisBody,
      indexRightAxis: 0, // X axis
      indexUpAxis: 1, // Y axis (verticale)
      indexForwardAxis: 2, // Z axis (avant)
    });
  }

  private setupWheels(physicsWorld: CANNON.World): void {
    if (!this.vehicle) return;

    // Wheel options (ajustez le radius selon vos besoins)
    const wheelOptions = {
      radius: 0.3, // Réduisez cette valeur pour correspondre à l'échelle correcte
      directionLocal: new CANNON.Vec3(0, -1, 0), // Down direction
      suspensionStiffness: 25,
      suspensionRestLength: 0.02,
      frictionSlip: 2,
      dampingRelaxation: 2.5,
      dampingCompression: 2.5,
      maxSuspensionForce: 50000,
      rollInfluence: 0.05,
      axleLocal: new CANNON.Vec3(1, 0, 0),
      chassisConnectionPointLocal: new CANNON.Vec3(0, 0, 0),
      maxSuspensionTravel: 0.3,
      customSlidingRotationalSpeed: -30,
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

  // Reset car position if it flips or falls off
  private resetCar(): void {
    if (!this.chassisBody) return;

    this.chassisBody.position.set(0, 1, 0);
    this.chassisBody.quaternion.setFromEuler(0, 0, 0);
    this.chassisBody.velocity.set(0, 0, 0);
    this.chassisBody.angularVelocity.set(0, 0, 0);
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
          pivot.rotation.y = this.rightVelocity; // Apply steering angle
        }
      }
    }
  }
}
