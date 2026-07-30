import { shaderMaterial } from '@react-three/drei'
import * as THREE from 'three'
import { SUN_DIRECTION } from '@/components/scene/PlanetMaterial'

/**
 * Additive rim-glow shell on a BackSide sphere slightly larger than the
 * planet. Grades from a saturated horizon color to a lighter zenith tint,
 * brightens on the sunlit side, and flares along the terminator. uBoost is
 * driven by hover for a live flare.
 */
export const AtmosphereMaterial = shaderMaterial(
  {
    uColorHorizon: new THREE.Color('#5B9DFF'),
    uColorZenith: new THREE.Color('#9EC8FF'),
    uSunDir: SUN_DIRECTION.clone(),
    uIntensity: 1.0,
    uBoost: 0,
  },
  /* vertex */ `
  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vWorldPos = worldPos.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }`,
  /* fragment */ `
  uniform vec3 uColorHorizon;
  uniform vec3 uColorZenith;
  uniform vec3 uSunDir;
  uniform float uIntensity;
  uniform float uBoost;

  varying vec3 vWorldNormal;
  varying vec3 vWorldPos;

  void main() {
    vec3 N = normalize(vWorldNormal);
    vec3 viewDir = normalize(cameraPosition - vWorldPos);
    // BackSide shell: normals face away from the camera, so flip for the rim test.
    float rim = pow(1.0 - abs(dot(viewDir, N)), 3.2);
    float sunDot = dot(N, normalize(uSunDir));
    float sunlit = 0.45 + 0.6 * max(sunDot, 0.0);
    // Terminator flare: brightest band where day meets night.
    float terminator = exp(-pow(sunDot / 0.22, 2.0)) * 0.85;
    vec3 color = mix(uColorZenith, uColorHorizon, clamp(rim * 1.5, 0.0, 1.0));
    float strength = rim * (sunlit + terminator) * uIntensity * (1.0 + uBoost * 0.6);
    gl_FragColor = vec4(color * strength, strength);
  }`
)
