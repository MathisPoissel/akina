import * as THREE from "three";
import * as CANNON from "cannon-es";

export class Ramp {
  public mesh: THREE.Mesh;
  public physicsBody: CANNON.Body;

  constructor(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    position: THREE.Vector3,
    width: number,
    height: number,
    depth: number
  ) {
    // Création de la rampe Three.js
    const rampGeometry = new THREE.BoxGeometry(width, height, depth);
    const rampMaterial = new THREE.MeshStandardMaterial({ color: 0x3366cc });
    this.mesh = new THREE.Mesh(rampGeometry, rampMaterial);
    this.mesh.position.copy(position); // Position initiale de la rampe
    this.mesh.rotation.x = Math.PI / 32; // Inclinaison de la rampe
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    scene.add(this.mesh);

    // Création du corps physique pour la rampe
    const shape = new CANNON.Box(
      new CANNON.Vec3(width / 2, height / 2, depth / 2)
    ); // Taille du corps physique
    this.physicsBody = new CANNON.Body({
      mass: 0, // Statique
      position: new CANNON.Vec3(position.x, position.y, position.z), // Position initiale
    });

    // Inclinaison de la hitbox
    this.physicsBody.quaternion.setFromEuler(Math.PI / 32, 0, 0); // Inclinaison de la hitbox

    this.physicsBody.addShape(shape);

    // Ajouter la physique de la rampe au monde
    physicsWorld.addBody(this.physicsBody);
  }

  // Méthode pour mettre à jour la position de la rampe en fonction de la physique
  public update(): void {
    // Mettre à jour la position de la rampe Three.js avec la position physique
    this.mesh.position.copy(this.physicsBody.position);
    this.mesh.quaternion.copy(this.physicsBody.quaternion);
  }
}
