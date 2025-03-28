// CarControls.ts
import * as THREE from "three";
import GUI from "lil-gui";
import { Car } from "../objects/Car";

export class CarControls {
  private car: Car;
  private controls = {
    forward: false,
    backward: false,
    left: false,
    right: false,
    brake: false,
  };

  // Speed display for GUI
  private speedDisplay = { speed: 0 };

  constructor(car: Car) {
    this.car = car;
    this.initListeners();
  }

  private initListeners(): void {
    window.addEventListener("keydown", this.onKeyDown.bind(this));
    window.addEventListener("keyup", this.onKeyUp.bind(this));
  }

  private onKeyDown(event: KeyboardEvent): void {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.controls.backward = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.controls.forward = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.controls.left = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.controls.right = true;
        break;
      case "Space":
        this.controls.brake = true;
        break;
      case "KeyR": // Add reset functionality
        this.resetCar();
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.controls.backward = false;
        break;
      case "KeyS":
      case "ArrowDown":
        this.controls.forward = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.controls.left = false;
        break;
      case "KeyD":
      case "ArrowRight":
        this.controls.right = false;
        break;
      case "Space":
        this.controls.brake = false;
        break;
    }
  }

  // Reset car to starting position
  private resetCar(): void {
    if (this.car.chassisBody) {
      this.car.chassisBody.position.set(0, 1, 0);
      this.car.chassisBody.quaternion.setFromEuler(0, 0, 0);
      this.car.chassisBody.velocity.set(0, 0, 0);
      this.car.chassisBody.angularVelocity.set(0, 0, 0);
    }
  }

  public update(delta: number): void {
    // Apply controls to the car physics system
    this.car.applyControls(this.controls);

    // Update speed display
    this.speedDisplay.speed = this.car.currentSpeed;
  }

  public setupGUI(gui: GUI): void {
    const carFolder = gui.addFolder("Car Controls");
    carFolder.add(this.speedDisplay, "speed").name("Speed (km/h)").listen();

    // Add physics tuning parameters
    const physicsFolder = gui.addFolder("Car Physics");
    const physicsParams = {
      reset: () => this.resetCar(),
      help: "WASD/Arrows to drive, Space to brake, R to reset",
    };

    physicsFolder.add(physicsParams, "reset").name("Reset Car Position");
    physicsFolder.add(physicsParams, "help").name("Controls");

    carFolder.open();
    physicsFolder.open();
  }
}
