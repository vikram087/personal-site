import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'

/**
 * World-space sun direction — must match the key light in SceneCanvas.
 * From the upper-left-front: planets read three-quarter lit from the Director,
 * with the terminator sweeping the right limb in destination views.
 */
export const SUN_DIRECTION = new THREE.Vector3(-6, 3, 4).normalize()

/**
 * Texture-driven planet surface: baked albedo + tangent-space normal map +
 * night-side emissive (see scripts/generate-planet-textures.mjs), lit by a
 * soft-terminator sun with an accent fresnel rim for bloom to catch.
 */
export const PlanetMaterial = shaderMaterial(
  {
    uAlbedo: null,
    uNormalMap: null,
    uEmissiveMap: null,
    uCloudTex: null,
    uSunDir: SUN_DIRECTION.clone(),
    uAccent: new THREE.Color('#5B9DFF'),
    uEmissive: 1.0,
    uNormalScale: 1.0,
    uHover: 0,
    uCloudRot: 0,
    uCloudShadow: 0,
  },
  /* vertex */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vUv = uv;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }`,
  /* fragment */ `
  uniform sampler2D uAlbedo;
  uniform sampler2D uNormalMap;
  uniform sampler2D uEmissiveMap;
  uniform sampler2D uCloudTex;
  uniform vec3 uSunDir;
  uniform vec3 uAccent;
  uniform float uEmissive;
  uniform float uNormalScale;
  uniform float uHover;
  uniform float uCloudRot;
  uniform float uCloudShadow;

  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 albedo = texture2D(uAlbedo, vUv).rgb;
    vec3 normalTex = texture2D(uNormalMap, vUv).xyz * 2.0 - 1.0;
    vec3 emissiveTex = texture2D(uEmissiveMap, vUv).rgb;

    // Analytic sphere TBN: east = up × N (degenerate only exactly at poles).
    vec3 N = normalize(vWorldNormal);
    vec3 T = normalize(cross(vec3(0.0, 1.0, 0.0), N));
    vec3 B = cross(N, T);
    vec3 shadingNormal = normalize(
      T * normalTex.x * uNormalScale + B * normalTex.y * uNormalScale + N * normalTex.z
    );

    vec3 sunDir = normalize(uSunDir);
    float sun = dot(shadingNormal, sunDir);
    float daylight = smoothstep(-0.15, 0.32, dot(N, sunDir));
    float relief = clamp(sun, 0.0, 1.0);

    // Day: relief-shaded albedo (blended so normal maps sculpt, not darken);
    // night: near-black with emissive detail.
    float shadedDay = mix(daylight, relief * daylight, 0.6);
    vec3 lit = albedo * (0.07 + 1.25 * shadedDay);

    // Cloud shadows: sample the drifting cloud layer via the world normal so
    // shadows track the clouds regardless of surface rotation.
    if (uCloudShadow > 0.001) {
      float cloudU = fract(atan(N.z, N.x) / 6.2831853 + 0.5 - uCloudRot / 6.2831853);
      float cloudV = clamp(asin(clamp(N.y, -1.0, 1.0)) / 3.14159265 + 0.5, 0.0, 1.0);
      float shadow = texture2D(uCloudTex, vec2(cloudU, cloudV)).r * uCloudShadow;
      lit *= 1.0 - shadow * 0.45 * daylight;
    }

    // Specular: subtle glint on land, strong glint on dark oceans/basins.
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    vec3 halfDir = normalize(sunDir + viewDir);
    float luminance = dot(albedo, vec3(0.299, 0.587, 0.114));
    float oceanMask = 1.0 - smoothstep(0.06, 0.24, luminance);
    float shininess = mix(38.0, 130.0, oceanMask);
    float specStrength = mix(0.08, 0.55, oceanMask);
    lit += vec3(1.0, 0.96, 0.9) * pow(max(dot(shadingNormal, halfDir), 0.0), shininess) * specStrength * daylight;

    // Night-side emissive (city grids, filaments, aurora)
    float night = 1.0 - daylight;
    lit += emissiveTex * uEmissive * (0.15 + 0.85 * night);

    // Accent fresnel rim — the part bloom picks up.
    float fresnel = pow(1.0 - max(dot(N, viewDir), 0.0), 2.6);
    lit += uAccent * fresnel * (0.55 + uHover * 0.6);

    gl_FragColor = vec4(lit, 1.0);
  }`
)
