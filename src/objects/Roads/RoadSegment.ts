import * as THREE from "three";
import * as CANNON from "cannon-es";

export class RoadSegment {
  public mesh: THREE.Mesh;
  public physicsBody: CANNON.Body;
  private markers: THREE.Mesh[] = []; // Tableau pour les markers de délimitation
  private markerPhysicsBodies: CANNON.Body[] = []; // Tableau pour les corps physiques des markers

  constructor(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    position: THREE.Vector3,
    width: number = 20,
    length: number = 20,
    height: number = 1,
    markerOffset: number = 10 // Décalage des markers de chaque côté de la route
  ) {
    // Création de la géométrie de la portion de route
    const roadGeometry = new THREE.BoxGeometry(width, height, length);
    const roadMaterial = new THREE.MeshStandardMaterial({ color: 0x666666 }); // Route en gris
    this.mesh = new THREE.Mesh(roadGeometry, roadMaterial);
    this.mesh.position.copy(position); // Position initiale de la portion de route
    this.mesh.receiveShadow = true;
    this.mesh.castShadow = true;
    scene.add(this.mesh);

    // Création du corps physique pour la portion de route
    const roadShape = new CANNON.Box(
      new CANNON.Vec3(width / 2, height / 2, length / 2)
    );
    this.physicsBody = new CANNON.Body({
      mass: 0, // La route est statique
      position: new CANNON.Vec3(position.x, position.y, position.z), // Position initiale
    });
    this.physicsBody.addShape(roadShape);

    // Ajouter la physique de la portion de route au monde physique
    physicsWorld.addBody(this.physicsBody);

    // Ajout des bandes délimitantes
    this.addMarkers(scene, physicsWorld, width, length, markerOffset);
  }

  // Méthode pour ajouter les deux bandes délimitantes de chaque côté de la route
  private addMarkers(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    roadWidth: number,
    roadLength: number,
    markerOffset: number
  ): void {
    const markerHeight = 1; // Hauteur des bandes délimitantes
    const markerWidth = 1; // Largeur des bandes délimitantes

    // Créer une bande rouge (côté gauche)
    const redMarkerGeometry = new THREE.BoxGeometry(
      markerWidth,
      markerHeight,
      roadLength
    );
    const redMarker = new THREE.Mesh(
      redMarkerGeometry,
      new THREE.MeshStandardMaterial({ color: 0xff0000 })
    );
    redMarker.position.set(markerOffset, markerHeight / 2, 0);
    this.markers.push(redMarker);
    scene.add(redMarker);

    // Créer une bande blanche (côté droit)
    const whiteMarkerGeometry = new THREE.BoxGeometry(
      markerWidth,
      markerHeight,
      roadLength
    );
    const whiteMarker = new THREE.Mesh(
      whiteMarkerGeometry,
      new THREE.MeshStandardMaterial({ color: 0xffffff })
    );
    whiteMarker.position.set(-markerOffset, markerHeight / 2, 0);
    this.markers.push(whiteMarker);
    scene.add(whiteMarker);

    // Ajouter la physique aux bandes délimitantes
    const redMarkerShape = new CANNON.Box(
      new CANNON.Vec3(markerWidth / 2, markerHeight / 2, roadLength / 2)
    );
    const redMarkerBody = new CANNON.Body({ mass: 0 }); // Statique
    redMarkerBody.position.set(markerOffset, markerHeight / 2, 0);
    redMarkerBody.addShape(redMarkerShape);
    this.markerPhysicsBodies.push(redMarkerBody);

    const whiteMarkerShape = new CANNON.Box(
      new CANNON.Vec3(markerWidth / 2, markerHeight / 2, roadLength / 2)
    );
    const whiteMarkerBody = new CANNON.Body({ mass: 0 }); // Statique
    whiteMarkerBody.position.set(-markerOffset, markerHeight / 2, 0);
    whiteMarkerBody.addShape(whiteMarkerShape);
    this.markerPhysicsBodies.push(whiteMarkerBody);

    // Ajouter les corps physiques des markers au monde physique
    physicsWorld.addBody(redMarkerBody);
    physicsWorld.addBody(whiteMarkerBody);
  }

  // Méthode pour mettre à jour la position et la rotation de la portion de route
  public update(): void {
    // Mettre à jour la position et la rotation de la portion de route dans Three.js
    this.mesh.position.copy(this.physicsBody.position);
    this.mesh.quaternion.copy(this.physicsBody.quaternion);

    // Mettre à jour les markers de délimitation
    this.updateMarkers();
  }

  // Méthode pour mettre à jour la position des markers
  private updateMarkers(): void {
    this.markers.forEach((marker, index) => {
      const physicsBody = this.markerPhysicsBodies[index];
      marker.position.copy(physicsBody.position); // Suivre le déplacement de la route
      marker.quaternion.copy(physicsBody.quaternion);
    });
  }
}
