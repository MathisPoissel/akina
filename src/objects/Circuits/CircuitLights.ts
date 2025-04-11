import * as THREE from "three";

export const circuitLights: {
  position: THREE.Vector3;
  target: THREE.Vector3;
  color?: number;
  intensity?: number;
}[] = [
  {
    position: new THREE.Vector3(-10.46, 5, -15.28),
    target: new THREE.Vector3(-10.46, 1, -10), // vers le circuit
    color: 0xffffff,
    intensity: 100,
  },
  {
    position: new THREE.Vector3(-19.92, 5, -14.97),
    target: new THREE.Vector3(-19.5, 1, -10),
    color: 0xffffff,
    intensity: 100,
  },
  {
    position: new THREE.Vector3(-28.73, 5, -14.66),
    target: new THREE.Vector3(-28.7, 1, -10),
    color: 0xffffff,
    intensity: 100,
  },
  {
    position: new THREE.Vector3(-37.8, 5, -17.05),
    target: new THREE.Vector3(-43, 1, -12),
    color: 0xffffff,
    intensity: 100,
  },
  {
    position: new THREE.Vector3(-0.63, 5, -15.16),
    target: new THREE.Vector3(-0.63, 1, -10),
    color: 0xffffff,
    intensity: 100,
  },
  {
    position: new THREE.Vector3(8.84, 5, -15.59),
    target: new THREE.Vector3(8.84, 1, -10),
    color: 0xffffff,
    intensity: 100,
  },
  // ajoute autant de spots que nécessaire...
];
