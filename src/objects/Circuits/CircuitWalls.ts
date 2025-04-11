import * as THREE from "three";

export const circuitWalls: {
  position: THREE.Vector3;
  size: { width: number; height: number; depth: number };
  rotation?: THREE.Euler; // Optionnel si tu veux des murs inclinés ou tournés
}[] = [
  {
    position: new THREE.Vector3(-30, -1, 50),
    size: { width: 200, height: 1, depth: 1 }, // un long mur horizontal
    rotation: new THREE.Euler(0, 0, 0), // ↪️ rotation Y de 45°
  },
  {
    position: new THREE.Vector3(-125.16, -1, 43.43),
    size: { width: 1, height: 1, depth: 20 }, // un mur vertical
    rotation: new THREE.Euler(0, 0, 0), // ↪️ rotation Y de 45°
  },
  {
    position: new THREE.Vector3(-117.63, -1, 34.35),
    size: { width: 40, height: 1, depth: 1 },
    rotation: new THREE.Euler(0, Math.PI / 4, 0), // ↪️ rotation Y de 45°
  },
  {
    position: new THREE.Vector3(-106.13, -1, 12.63),
    size: { width: 1, height: 1, depth: 16 },
    rotation: new THREE.Euler(0, Math.PI / 13, 0), // ↪️ rotation Y de 45°
  },
  {
    position: new THREE.Vector3(-107.433, -1, -60.86),
    size: { width: 1, height: 1, depth: 135 },
    rotation: new THREE.Euler(0, 0, 0), // ↪️ rotation Y de 45°
  },
  {
    position: new THREE.Vector3(-103.83, -1, -123.35),
    size: { width: 10, height: 1, depth: 1 },
    rotation: new THREE.Euler(0, Math.PI / 4, 0), // ↪️ rotation Y de 45°
  },
  {
    position: new THREE.Vector3(-88.71, -1, -128.01),
    size: { width: 40, height: 1, depth: 1 },
    rotation: new THREE.Euler(0, Math.PI / 12, 0), // ↪️ rotation Y de 45°
  },
  {
    position: new THREE.Vector3(-63.43, -1, -116.06),
    size: { width: 1, height: 1, depth: 45 },
    rotation: new THREE.Euler(0, Math.PI / 8, 0), // ↪️ rotation Y de 45°
  },
  {
    position: new THREE.Vector3(-46.61, -1, -63.96),
    size: { width: 1, height: 1, depth: 101 },
    rotation: new THREE.Euler(0, Math.PI / 16, 0), // ↪️ rotation Y de 45°
  },
  {
    position: new THREE.Vector3(-12, -1, -14.19),
    size: { width: 48, height: 1, depth: 1 },
    rotation: new THREE.Euler(0, 0, 0), // ↪️ rotation Y de 45°
  },
  // ➕ Ajoute autant de murs que nécessaire autour du circuit
];
