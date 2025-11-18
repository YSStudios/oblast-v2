export const ledFragmentShader = `
uniform float pixelSize;
uniform float maskStagger;

const float MASK_BORDER = 0.9;
const float MASK_INTENSITY = 1.25;

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  vec2 normalizedPixelSize = pixelSize / resolution;
  vec2 coord = uv/normalizedPixelSize;

  float columnStagger = mod(floor(coord.x), 2.0) * maskStagger;
  vec2 subcoord = coord * vec2(3,1);
  float subPixelIndex = mod(floor(subcoord.x), 3.0);
  float subPixelStagger = subPixelIndex * maskStagger;

  vec2 offsetUV = uv;
  offsetUV.y += (columnStagger + subPixelStagger) * normalizedPixelSize.y;

  vec2 uvPixel = normalizedPixelSize * floor(offsetUV / normalizedPixelSize);
  vec4 color = texture2D(inputBuffer, uvPixel);

  float luma = dot(vec3(0.2126, 0.7152, 0.0722), color.rgb);

  vec2 cellOffset = vec2(0.0, columnStagger + subPixelStagger);
  vec2 subCellUV = fract(subcoord + cellOffset) * 2.0 - 1.0;

  float mask = 1.0;
  vec2 border = 1.0 - subCellUV * subCellUV * (MASK_BORDER - luma * 0.25);
  mask *= border.x * border.y;
  float maskStrength = smoothstep(0.0, 0.95, mask);

  color += 0.005;
  color.rgb *=  1.0 + (maskStrength - 1.0) * MASK_INTENSITY;

  outputColor = color;
}
`;
