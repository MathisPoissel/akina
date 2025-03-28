import * as THREE from "three";
import * as CANNON from "cannon-es";

export class Cube {
  public mesh: THREE.Mesh;
  public physicsBody: CANNON.Body;

  constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
    // Création du cube Three.js
    const geometry = new THREE.BoxGeometry(1, 1, 1);
    const material = new THREE.MeshStandardMaterial({ color: 0xff0000 });
    this.mesh = new THREE.Mesh(geometry, material);
    this.mesh.position.set(-2, 0, 0); // Position initiale en hauteur
    scene.add(this.mesh);

    // Création du corps physique pour le cube
    const shape = new CANNON.Box(new CANNON.Vec3(0.5, 0.5, 0.5)); // Taille du cube physique
    this.physicsBody = new CANNON.Body({
      mass: 1000, // La masse du cube (le cube tombe sous l'effet de la gravité)
      position: new CANNON.Vec3(-2, 5, 0), // Position initiale
    });
    this.physicsBody.addShape(shape);

    // Ajouter la physique du cube au monde
    physicsWorld.addBody(this.physicsBody);
  }

  // Méthode pour mettre à jour la position du cube en fonction de la physique
  public update(): void {
    // Mettre à jour la position du cube Three.js avec la position physique
    this.mesh.position.copy(this.physicsBody.position);
    this.mesh.quaternion.copy(this.physicsBody.quaternion);
  }
}
