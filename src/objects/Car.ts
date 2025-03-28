// objects/Car.ts
import * as THREE from "three";
import { GLTFLoader, GLTF } from "three/examples/jsm/loaders/GLTFLoader.js";

export class Car {
  private loader: GLTFLoader;
  public pivot: THREE.Group;
  public model: THREE.Group | null = null;

  public wheelFrontLeft!: THREE.Mesh;
  public wheelFrontRight!: THREE.Mesh;
  public wheelBackLeft!: THREE.Mesh;
  public wheelBackRight!: THREE.Mesh;

  public wheelFrontLeftPivot!: THREE.Group;
  public wheelFrontRightPivot!: THREE.Group;

  // Propriété pour le corps physique (Ammo.js)
  public physicsBody: any = null;

  constructor(scene: THREE.Scene) {
    this.loader = new GLTFLoader();
    this.pivot = new THREE.Group();
    scene.add(this.pivot);

    this.loader.load(
      "./public/models/gltf/car/car.gltf",
      (gltf: GLTF) => {
        this.model = gltf.scene;
        this.model.scale.set(0.005, 0.005, 0.005);
        this.pivot.add(this.model);
        this.model.position.set(0, 0, -0.5);

        this.model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            console.log(child.name, child);
          }
        });

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

        this.wheelFrontLeftPivot = new THREE.Group();
        const initialPosFL = this.wheelFrontLeft.position.clone();
        if (this.wheelFrontLeft.geometry instanceof THREE.BufferGeometry) {
          this.wheelFrontLeft.geometry.center();
        }
        this.wheelFrontLeftPivot.position.copy(initialPosFL);
        this.model.add(this.wheelFrontLeftPivot);
        this.wheelFrontLeft.position.set(0, 0, 0);
        this.wheelFrontLeftPivot.add(this.wheelFrontLeft);

        this.wheelFrontRightPivot = new THREE.Group();
        const initialPosFR = this.wheelFrontRight.position.clone();
        if (this.wheelFrontRight.geometry instanceof THREE.BufferGeometry) {
          this.wheelFrontRight.geometry.center();
        }
        this.wheelFrontRightPivot.position.copy(initialPosFR);
        this.model.add(this.wheelFrontRightPivot);
        this.wheelFrontRight.position.set(0, 0, 0);
        this.wheelFrontRightPivot.add(this.wheelFrontRight);
      },
      (xhr) => {
        console.log(`${(xhr.loaded / xhr.total) * 100}% loaded`);
      },
      (error) => {
        console.error("An error happened", error);
      }
    );
  }

  public updateWheels(speed: number, delta: number): void {
    const rotationFactor = 3.5;
    const rotationAngle = speed * rotationFactor * delta;

    if (this.wheelFrontLeft) {
      this.wheelFrontLeft.rotation.x += rotationAngle;
    }
    if (this.wheelFrontRight) {
      this.wheelFrontRight.rotation.x += rotationAngle;
    }
    if (this.wheelBackLeft) {
      this.wheelBackLeft.rotation.x += rotationAngle;
    }
    if (this.wheelBackRight) {
      this.wheelBackRight.rotation.x += rotationAngle;
    }
  }
}
