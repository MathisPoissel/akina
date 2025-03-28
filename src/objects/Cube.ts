import * as THREE from "three";

export class Cube {
  public mesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    // Création du cube Three.js
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    // Position initiale (placé en hauteur pour observer la chute)
    this.mesh.position.set(-2, 5, 0);
    scene.add(this.mesh);
  }
}
