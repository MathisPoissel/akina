import * as THREE from "three";

export class Floor {
  mesh: THREE.Mesh;

  constructor(scene: THREE.Scene) {
    const geometry = new THREE.PlaneGeometry(400, 400, 20, 20);
    const material = new THREE.MeshBasicMaterial({
      color: 0x000000,
      wireframe: true,
      side: THREE.DoubleSide,
    });

    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.rotation.x = -Math.PI / 2;
    this.mesh.receiveShadow = true;

    scene.add(this.mesh);
  }
}
