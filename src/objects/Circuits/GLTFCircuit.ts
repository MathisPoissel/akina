import * as THREE from "three";
import * as CANNON from "cannon-es";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";

export class GLTFCircuit {
  constructor(
    scene: THREE.Scene,
    physicsWorld: CANNON.World,
    loadingManager: THREE.LoadingManager,
    path: string = "/models/gltf/circuit/scene.gltf",
    position: THREE.Vector3 = new THREE.Vector3(-25, -6.4, -30)
  ) {
    const loader = new GLTFLoader(loadingManager);

    loader.load(path, (gltf) => {
      const model = gltf.scene;
      model.scale.set(0.6, 0.6, 0.6);

      model.position.copy(position); // <== déplace le modèle visuellement
      scene.add(model);
    });

    // --- Sol physique (et visuel si tu veux) ---
    const groundSize = { width: 400, height: 1, depth: 200 }; // ajuste à ton circuit

    // ✅ Corps physique
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromEuler(-Math.PI / 2, 0, 0); // à plat
    groundBody.position.set(0, -1.5, 0); // positionne-le bien

    physicsWorld.addBody(groundBody);

    // ✅ Sol visible (facultatif, si tu veux voir où il est)
    const groundMesh = new THREE.Mesh(
      new THREE.BoxGeometry(
        groundSize.width,
        groundSize.height,
        groundSize.depth
      ),
      new THREE.MeshStandardMaterial({
        color: 0x555555,
        transparent: true,
        opacity: 0.5,
      }) // semi-transparent
    );
    groundMesh.position.copy(groundBody.position as unknown as THREE.Vector3);
    scene.add(groundMesh);
  }
}
