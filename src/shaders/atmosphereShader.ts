// Fresnel-based atmosphere glow shader
// Creates a beautiful rim glow around planets with atmospheres

export const atmosphereVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vFresnel;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vPosition = (modelViewMatrix * vec4(position, 1.0)).xyz;

    // Fresnel factor: stronger glow at edges
    vec3 viewDir = normalize(-vPosition);
    vFresnel = 1.0 - abs(dot(viewDir, vNormal));
    vFresnel = pow(vFresnel, 2.5);

    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const atmosphereFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vPosition;
  varying float vFresnel;

  void main() {
    // Base glow from Fresnel
    float glow = vFresnel * uIntensity;

    // Add subtle animation
    float pulse = 1.0 + sin(uTime * 0.8) * 0.08;
    glow *= pulse;

    // Slight color shift at the edges
    vec3 edgeColor = uColor * 1.4 + vec3(0.1, 0.1, 0.3);
    vec3 finalColor = mix(uColor, edgeColor, vFresnel);

    gl_FragColor = vec4(finalColor, glow * 0.7);
  }
`;

// Shader for a more dramatic outer glow (used as a second pass)
export const outerGlowVertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewDir = normalize(-mvPosition.xyz);
    gl_Position = projectionMatrix * mvPosition;
  }
`;

export const outerGlowFragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uPower;
  uniform float uTime;

  varying vec3 vNormal;
  varying vec3 vViewDir;

  void main() {
    float fresnel = 1.0 - dot(vViewDir, vNormal);
    fresnel = pow(fresnel, uPower);

    // Animate subtly
    float anim = 1.0 + sin(uTime * 0.5 + fresnel * 3.0) * 0.05;
    fresnel *= anim;

    vec3 col = uColor * (1.0 + fresnel * 0.5);
    gl_FragColor = vec4(col, fresnel * 0.55);
  }
`;
