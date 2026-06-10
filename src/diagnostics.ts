import { WebGLRenderer } from "three";

export function createRendererDiagnostics(renderer: WebGLRenderer) {
  const LOG_INTERVAL = 60;
  let frameCount = 0;
  let prevGeometries = -1;
  let prevTextures = -1;

  return function update() {
    frameCount++;
    if (frameCount % LOG_INTERVAL !== 0) return;

    const info = renderer.info;
    const dGeom = prevGeometries < 0 ? 0 : info.memory.geometries - prevGeometries;
    const dTex = prevTextures < 0 ? 0 : info.memory.textures - prevTextures;

    console.log(
      `[D3D] ` +
      `calls=${info.render.calls} ` +
      `triangles=${info.render.triangles} ` +
      `| ` +
      `geometries=${info.memory.geometries}${dGeom > 0 ? ` (+${dGeom})` : ""} ` +
      `textures=${info.memory.textures}${dTex > 0 ? ` (+${dTex})` : ""} ` +
      `programs=${info.programs} ` +
      `| ` +
      `frame=${info.render.frame}`
    );

    prevGeometries = info.memory.geometries;
    prevTextures = info.memory.textures;
  };
}
