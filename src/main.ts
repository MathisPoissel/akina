import { App } from "./App";

const app = new App();

document.getElementById("start-button")?.addEventListener("click", () => {
  console.log("ok");
  document.getElementById("start-screen")!.style.display = "none";
  app.init();
  app.animate();
});
