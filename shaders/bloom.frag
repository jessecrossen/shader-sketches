#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define TAU 6.283185307

uniform vec2 u_resolution;
uniform float u_time;

#define LAYERS 9

// make a triangle wave between 0.0 and 1.0
float triangle(in float x) {
  x *= 2.0;
  return(mod(x, 2.0) < 1.0 ? fract(x) : 1.0 - fract(x));
}
// make a triangle wave with a rounded base
float round_triangle(in float x) {
  float d = 0.25;
  float y = triangle(x);
  if (y < d) y = y * smoothstep(0.0, d, y);
  return(y);
}

// make a bloom shape in polar coordinates
void bloom(inout float color, in vec2 p, in int petals, 
           in float inner, in float outer, in float rotate) {
  if (outer < inner) inner = 0.0;
  float x = (rotate + p.x) * float(petals);
  float y = inner + (round_triangle(x) * (outer - inner));
  float border = (0.05 / p.y) * outer;
  // outside the bloom, draw nothing
  if (p.y > y + border) return;
  // dark outer border
  else if (p.y > y) color = 0.0;
  // light inner margin
  else if (p.y > y - border) color = 1.0;
  // inner circle
  else if (p.y < inner) color = 1.0;
  // stripes
  else {
    float s = cos((rotate + p.x) * (float(petals) * 11.0) * TAU);
    s = s * smoothstep(y - border, y - (2.5 * border), p.y);
    color = (s < -0.8) ? 0.0 : 1.0;
  }
}

void main() {
  vec2 st = (gl_FragCoord.xy / (u_resolution * 0.5)) - vec2(1.0);
  st.y *= u_resolution.y / u_resolution.x;
  st *= 1.1;
  // convert to polar coordinates
  vec2 p = vec2((atan(st.y, st.x) + PI) / TAU, length(st));
  // pulse in and out slightly
  p.y = pow(p.y, 1.0 + sin(u_time) * 0.05);
  // make a background
  float bt1 = - u_time * 0.11;
  float bt2 = - u_time * 0.13;
  float background = 
    sin(bt1 + p.y * 41.0) * 
    sin(bt2 + p.y * 39.0) * 
    sin(((p.x + p.y) * TAU * 2.0) + (u_time * 0.21))
      + (st.y * 0.5);
  float color = background < 0.3 ? 0.0 : 1.0;
  // draw blooms
  float t = ((u_time - 0.5) * 0.5) - float(LAYERS - 1);
  float f = fract(t);
  float offset = 1.0 / float(LAYERS);
  float layerTime, size, index, petals;
  for (int i = 0; i < LAYERS; i++) {
    // give each bloom a stable index
    index = floor(t) + float(i);
    // vary the symmetry
    petals = 3.0 + floor((6.0 * triangle(index / 36.0)) + 0.5);
    // compute the time for the bloom with the current index
    layerTime = ((float(LAYERS - i - 1) + f) * offset);
    // grow and shrink each bloom
    size = sin(layerTime * PI);
    // draw blooms
    if (index >= 0.0) {
      bloom(color, p, int(petals), min(0.2 * size, 0.2), size, 
        fract(t * 0.04 * fract(abs(sin((0.13 + index) * 100000.0)))));
    }
  }
  // put a black dot at the center
  if (p.y < 0.05) color = 0.0;
  gl_FragColor = vec4(vec3(color), 1.0);
}