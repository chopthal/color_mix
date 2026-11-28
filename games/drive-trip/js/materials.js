/**
 * 공용 머티리얼 (여행이 바뀌어도 재사용 — dispose 대상 아님).
 * 셰이더 주입: 눈(위를 향한 면을 하얗게) · 발광(가로등·창문·터널등) · 물결 반짝임.
 */
import * as THREE from '../vendor/three.module.min.js';

export const U = {
  snow: { value: 0 },
  lamp: { value: 0 },
  time: { value: 0 },
};

/**
 * glow 속성: -1 = 노면(눈 안 쌓임), 0 = 보통, 0~1 = 날씨에 따라 켜지는 불빛, 2 = 항상 켜짐
 */
function injectWorld(shader) {
  shader.uniforms.uSnow = U.snow;
  shader.uniforms.uLamp = U.lamp;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nattribute float glow;\nvarying float vGlow;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvGlow = glow;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uSnow;\nuniform float uLamp;\nvarying float vGlow;')
    .replace(
      '#include <normal_fragment_maps>',
      [
        '#include <normal_fragment_maps>',
        'if (uSnow > 0.0 && vGlow > -0.5) {',
        '  vec3 upV = normalize((viewMatrix * vec4(0.0, 1.0, 0.0, 0.0)).xyz);',
        '  float upn = dot(normal, upV);',
        '  diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.95, 0.97, 1.0), uSnow * smoothstep(0.42, 0.8, upn));',
        '}',
      ].join('\n')
    )
    .replace(
      '#include <emissivemap_fragment>',
      [
        '#include <emissivemap_fragment>',
        'float gk = clamp(vGlow, 0.0, 1.0) * uLamp + step(1.5, vGlow);',
        'totalEmissiveRadiance += mix(diffuseColor.rgb, vec3(1.0, 0.82, 0.5), 0.6) * gk * 0.95;',
      ].join('\n')
    );
}

function worldMaterial(key) {
  const m = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });
  m.onBeforeCompile = injectWorld;
  m.customProgramCacheKey = () => 'drive-world-' + key;
  return m;
}

/** 청크·소품·랜드마크 */
export const worldMat = worldMaterial('static');
/** 인스턴스 나무 */
export const treeMat = worldMaterial('tree');

/** 움직이는 친구들(경운기·동물·차·기차 등) */
export const actorMat = new THREE.MeshLambertMaterial({ vertexColors: true, flatShading: true });

/** 바다·강: 잔물결 밝기 + 반짝 */
export const waterMat = new THREE.MeshLambertMaterial({ color: 0x5fb9ea });
waterMat.onBeforeCompile = (shader) => {
  shader.uniforms.uTime = U.time;
  shader.vertexShader = shader.vertexShader
    .replace('#include <common>', '#include <common>\nvarying vec3 vWP;')
    .replace('#include <begin_vertex>', '#include <begin_vertex>\nvWP = (modelMatrix * vec4(transformed, 1.0)).xyz;');
  shader.fragmentShader = shader.fragmentShader
    .replace('#include <common>', '#include <common>\nuniform float uTime;\nvarying vec3 vWP;')
    .replace(
      '#include <color_fragment>',
      [
        '#include <color_fragment>',
        'float wv = 0.5 + 0.5 * sin(vWP.x * 0.16 + vWP.z * 0.11 + uTime * 0.9) * sin(vWP.z * 0.07 - uTime * 0.5);',
        'diffuseColor.rgb *= 0.9 + 0.16 * wv;',
      ].join('\n')
    )
    .replace(
      '#include <emissivemap_fragment>',
      [
        '#include <emissivemap_fragment>',
        'float sp = sin(vWP.x * 0.9 + uTime * 1.7) * sin(vWP.z * 1.1 - uTime * 1.3) * sin((vWP.x - vWP.z) * 0.37 + uTime * 0.9);',
        'sp = pow(max(sp, 0.0), 9.0);',
        'totalEmissiveRadiance += vec3(1.0) * sp * 0.85;',
      ].join('\n')
    );
};
waterMat.customProgramCacheKey = () => 'drive-water';

/** 늘 밝게 보이는 램프 (신호등·건널목 경보등) */
export function lampMaterial(color) {
  return new THREE.MeshBasicMaterial({ color, fog: false, toneMapped: false });
}
