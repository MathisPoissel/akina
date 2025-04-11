import * as THREE from "three";
import * as CANNON from "cannon-es";

export class Barrel {
  public mesh: THREE.Mesh;
  public physicsBody: CANNON.Body;

  constructor(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    position: THREE.Vector3,
    radius = 0.3,
    height = 0.8,
    mass = 15
  ) {
    // ✅ Mesh visuel
    const geometry = new THREE.CylinderGeometry(radius, radius, height, 16);
    const material = new THREE.MeshStandardMaterial({ color: 0x884422 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.mesh.position.copy(position);
    scene.add(this.mesh);

    // ✅ Corps physique
    const shape = new CANNON.Cylinder(radius, radius, height, 16);

    // Tourner pour aligner avec l’axe Y (Cannon utilise Z par défaut)
    const quat = new CANNON.Quaternion();
    quat.setFromEuler(Math.PI / 2, 0, 0); // rotation pour être debout
    shape.transformAllPoints(new CANNON.Vec3(), quat);

    this.physicsBody = new CANNON.Body({
      mass,
      position: new CANNON.Vec3(position.x, position.y, position.z),
    });
    this.physicsBody.addShape(shape);
    physicsWorld.addBody(this.physicsBody);
  }

  // ✅ Synchronisation position physique → visuel
  public update(): void {
    this.mesh.position.copy(this.physicsBody.position);
    this.mesh.quaternion.copy(this.physicsBody.quaternion);
  }
}
