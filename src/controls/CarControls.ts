// CarControls.ts
import * as THREE from "three";
import GUI from "lil-gui";
import { Car } from "../objects/Car";

export class CarControls {
  private car: Car;
  private accelerating: boolean = false;
  private reversing: boolean = false;
  private turningLeft: boolean = false;
  private turningRight: boolean = false;
  private currentSpeed: number = 0;

  // Paramètres pour l'accélération en avant
  public forwardAcceleration: number = 4; // unité/s²
  public forwardMaxSpeed: number = 35; // vitesse maximale en avant (unités/s)
  // Paramètres pour la marche arrière
  public reverseAcceleration: number = 2; // unité/s²
  public reverseMaxSpeed: number = 5; // vitesse maximale en marche arrière (unités/s)
  // Décélération par friction
  public friction: number = 8; // unité/s²
  // Décélération lors du freinage (lorsqu'on passe de l'avance au reverse)
  public brakeDeceleration: number = 16; // unité/s²

  // Propriétés pour la direction
  public steeringAngle: number = 0; // angle actuel en radians
  public maxSteeringAngle: number = 0.3; // valeur de base de braquage à basse vitesse (ex : 0.3 rad)
  public steeringSpeed: number = 1; // vitesse d'incrémentation (radians/s)
  public steeringReturnSpeed: number = 2; // vitesse de retour à zéro (radians/s)

  // Paramètre physique : empattement de la voiture
  public wheelBase: number = 4; // distance entre essieux

  /* !IMPORTANT, QUAND ON APPUYE SUR ESPACE whellbase à 1 */

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
        this.accelerating = true;
        break;
      case "KeyS":
      case "ArrowDown":
        this.reversing = true;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.turningLeft = true;
        break;
      case "KeyD":
      case "ArrowRight":
        this.turningRight = true;
        break;
    }
  }

  private onKeyUp(event: KeyboardEvent): void {
    switch (event.code) {
      case "KeyW":
      case "ArrowUp":
        this.accelerating = false;
        break;
      case "KeyS":
      case "ArrowDown":
        this.reversing = false;
        break;
      case "KeyA":
      case "ArrowLeft":
        this.turningLeft = false;
        break;
      case "KeyD":
      case "ArrowRight":
        this.turningRight = false;
        break;
    }
  }

  public update(delta: number): void {
    // Accélération / décélération
    if (this.accelerating) {
      this.currentSpeed += this.forwardAcceleration * delta;
      if (this.currentSpeed > this.forwardMaxSpeed)
        this.currentSpeed = this.forwardMaxSpeed;
    } else if (this.reversing) {
      if (this.currentSpeed > 0) {
        this.currentSpeed -= this.brakeDeceleration * delta;
        if (this.currentSpeed < 0) this.currentSpeed = 0;
      } else {
        this.currentSpeed -= this.reverseAcceleration * delta;
        if (this.currentSpeed < -this.reverseMaxSpeed)
          this.currentSpeed = -this.reverseMaxSpeed;
      }
    } else {
      if (this.currentSpeed > 0) {
        this.currentSpeed -= this.friction * delta;
        if (this.currentSpeed < 0) this.currentSpeed = 0;
      } else if (this.currentSpeed < 0) {
        this.currentSpeed += this.friction * delta;
        if (this.currentSpeed > 0) this.currentSpeed = 0;
      }
    }

    // Calcul d'un max effectif de braquage qui diminue avec la vitesse.
    const speedRatio = Math.abs(this.currentSpeed) / this.forwardMaxSpeed; // de 0 à 1
    // Par exemple, à vitesse max on limite le braquage à 0.2 rad (vous pouvez ajuster cette valeur)
    const effectiveMaxSteering = THREE.MathUtils.lerp(
      this.maxSteeringAngle,
      0.2,
      speedRatio
    );

    // Mise à jour de l'angle de braquage en fonction des entrées
    if (this.turningLeft) {
      this.steeringAngle += this.steeringSpeed * delta;
      if (this.steeringAngle > effectiveMaxSteering)
        this.steeringAngle = effectiveMaxSteering;
    } else if (this.turningRight) {
      this.steeringAngle -= this.steeringSpeed * delta;
      if (this.steeringAngle < -effectiveMaxSteering)
        this.steeringAngle = -effectiveMaxSteering;
    } else {
      // Retour progressif à zéro
      if (this.steeringAngle > 0) {
        this.steeringAngle -= this.steeringReturnSpeed * delta;
        if (this.steeringAngle < 0) this.steeringAngle = 0;
      } else if (this.steeringAngle < 0) {
        this.steeringAngle += this.steeringReturnSpeed * delta;
        if (this.steeringAngle > 0) this.steeringAngle = 0;
      }
    }

    // Modèle bicycle : changement d'orientation
    if (this.car.pivot && Math.abs(this.currentSpeed) > 0.1) {
      const effectiveSteering =
        Math.abs(this.steeringAngle) > 0.001 ? this.steeringAngle : 0.001;
      const turningRadius = this.wheelBase / Math.tan(effectiveSteering);
      const deltaHeading = (this.currentSpeed / turningRadius) * delta;
      const headingChange =
        this.currentSpeed < 0 ? -deltaHeading : deltaHeading;
      this.car.pivot.rotation.y += headingChange;
      this.car.pivot.translateZ(this.currentSpeed * delta);
    }

    // Mise à jour des roues (roulement sur l'axe X)
    this.car.updateWheels(this.currentSpeed, delta);

    // Animation du braquage des roues avant via leurs pivots (axe Y)
    if (this.car.wheelFrontLeftPivot && this.car.wheelFrontRightPivot) {
      const targetWheelAngle = this.steeringAngle;
      this.car.wheelFrontLeftPivot.rotation.y = THREE.MathUtils.lerp(
        this.car.wheelFrontLeftPivot.rotation.y,
        targetWheelAngle,
        0.1
      );
      this.car.wheelFrontRightPivot.rotation.y = THREE.MathUtils.lerp(
        this.car.wheelFrontRightPivot.rotation.y,
        targetWheelAngle,
        0.1
      );
    }
  }

  // Méthode pour ajouter des contrôles GUI afin d'ajuster les paramètres en temps réel
  public setupGUI(gui: GUI): void {
    const params = {
      forwardAcceleration: this.forwardAcceleration,
      forwardMaxSpeed: this.forwardMaxSpeed,
      reverseAcceleration: this.reverseAcceleration,
      reverseMaxSpeed: this.reverseMaxSpeed,
      friction: this.friction,
      brakeDeceleration: this.brakeDeceleration,
      maxSteeringAngle: this.maxSteeringAngle,
      steeringSpeed: this.steeringSpeed,
      steeringReturnSpeed: this.steeringReturnSpeed,
      wheelBase: this.wheelBase,
    };

    const folder = gui.addFolder("Car Steering & Dynamics");
    folder
      .add(params, "forwardAcceleration", 0, 10, 0.1)
      .onChange((value: number) => {
        this.forwardAcceleration = value;
      });
    folder
      .add(params, "forwardMaxSpeed", 0, 50, 0.1)
      .onChange((value: number) => {
        this.forwardMaxSpeed = value;
      });
    folder
      .add(params, "reverseAcceleration", 0, 10, 0.1)
      .onChange((value: number) => {
        this.reverseAcceleration = value;
      });
    folder
      .add(params, "reverseMaxSpeed", 0, 20, 0.1)
      .onChange((value: number) => {
        this.reverseMaxSpeed = value;
      });
    folder.add(params, "friction", 0, 20, 0.1).onChange((value: number) => {
      this.friction = value;
    });
    folder
      .add(params, "brakeDeceleration", 0, 30, 0.1)
      .onChange((value: number) => {
        this.brakeDeceleration = value;
      });
    folder
      .add(params, "maxSteeringAngle", 0, 1, 0.01)
      .onChange((value: number) => {
        this.maxSteeringAngle = value;
      });
    folder
      .add(params, "steeringSpeed", 0, 5, 0.01)
      .onChange((value: number) => {
        this.steeringSpeed = value;
      });
    folder
      .add(params, "steeringReturnSpeed", 0, 5, 0.01)
      .onChange((value: number) => {
        this.steeringReturnSpeed = value;
      });
    folder.add(params, "wheelBase", 0.5, 5, 0.1).onChange((value: number) => {
      this.wheelBase = value;
    });
    folder.open();
  }
}
