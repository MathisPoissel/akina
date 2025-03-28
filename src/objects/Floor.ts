import * as THREE from "three";
import * as CANNON from "cannon-es";

export class Floor {
  public mesh!: THREE.Mesh;
  private size: number = 100;
  private segments: number = 128;

  constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
    // Création du sol principal
    this.createMainFloor(scene, physicsWorld);
  }

  private createMainFloor(
    scene: THREE.Scene,
    physicsWorld: CANNON.World
  ): void {
    // Géométrie plus grande pour le circuit
    const geometry = new THREE.PlaneGeometry(
      this.size,
      this.size,
      this.segments,
      this.segments
    );

    // Création d'une texture de circuit
    const floorTexture = new THREE.MeshStandardMaterial({
      color: 0x333333,
      roughness: 0.8,
      metalness: 0.2,
    });

    // Création du mesh et configuration
    this.mesh = new THREE.Mesh(geometry, floorTexture);
    this.mesh.receiveShadow = true;
    this.mesh.position.y = -0.5; // Positionnez le sol légèrement en dessous de l'origine
    this.mesh.rotation.x = -Math.PI / 2;

    // Ajouter à la scène
    scene.add(this.mesh);

    // Création de la hitbox du sol
    const shape = new CANNON.Plane();
    const physicsBody = new CANNON.Body({
      mass: 0, // statique
    });
    physicsBody.addShape(shape);
    physicsWorld.addBody(physicsBody);

    // Le plan Cannon est initialement sur le plan X-Y, on le fait pivoter pour l'aligner avec Three.js
    physicsBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0);
  }

  public animate(): void {
    // Si besoin d'animation du sol (mouvement d'éléments, etc.)
  }

  public getHeight(x: number, z: number): number {
    // Méthode pour obtenir la hauteur du terrain à une position donnée
    // À implémenter pour une détection de collision avec le terrain
    return -0.5; // Hauteur par défaut
  }
}
