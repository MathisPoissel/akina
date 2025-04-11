import * as THREE from "three";

export interface Checkpoint {
  position: THREE.Vector3;
  radius: number;
  passed: boolean;
}

export const checkpoints: Checkpoint[] = [
  {
    position: new THREE.Vector3(-107.65, -1, 40.37),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(-98.25, -1, 21),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(-98.27, -1, -100.18),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(-68.41, -1, -108.22),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(-75.38, -1, -68.26),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(-62.34, -1, -46.51),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(-75.84, -1, -10.49),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(18.01, -1, -7.35),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(38.61, -1, -99.61),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(62.28, -1, -87.05),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(60.37, -1, 3.56),
    radius: 4,
    passed: false,
  },
  {
    position: new THREE.Vector3(20.57, -1, 22.13),
    radius: 4,
    passed: false,
  },
  // 🔁 Ajoute ici autant de checkpoints que tu veux
];
