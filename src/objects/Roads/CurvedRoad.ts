import * as THREE from "three";
import * as CANNON from "cannon-es";

export class CurvedRoad {
  constructor(scene: THREE.Scene, physicsWorld: CANNON.World) {
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, -4, 0),
      new THREE.Vector3(20, -4, 10),
      new THREE.Vector3(40, -4, 0),
      new THREE.Vector3(60, -4, -20),
      new THREE.Vector3(80, -4, 0),
    ]);

    const tubeGeometry = new THREE.TubeGeometry(curve, 100, 2, 8, false);
    const material = new THREE.MeshStandardMaterial({ color: 0x444444 });

    const mesh = new THREE.Mesh(tubeGeometry, material);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    scene.add(mesh);

    // Ajout physique (optionnel, ici c’est un corps statique sans friction)
    const shape = new CANNON.Box(new CANNON.Vec3(40, 1, 10)); // simplifié pour la démo
    const body = new CANNON.Body({
      mass: 0,
      position: new CANNON.Vec3(0, -2, 0),
      shape,
    });
    physicsWorld.addBody(body);
  }
}
