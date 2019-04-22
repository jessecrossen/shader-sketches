#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define TAU 6.283185307

uniform vec2 u_resolution;
uniform float u_time;

mat2 rotate2d(float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s,  c);
}

void branch(inout float color, in vec2 p, in float t, in float wiggle) {
  // move vertically
  p.y += t;
  // wiggle horizontally
  p.x += sin(p.y) * (cos(t * 1.3) * wiggle);
  // bilateral symmetry
  p.x = abs(p.x);
  // sweep fronds
  p.y -= pow(p.x, 1.1 + (cos(t) * 0.9));
  // draw frond
  float cy = p.y * 4.0;
  float y = floor(cy + 0.5);
  float leaf = 0.2 - pow((p.x * 0.5) - 0.5, 2.0);
  if (abs(cy - y) < leaf) color = 1.0;
  // central line
  else if (p.x < 0.03) color = 0.0;
  // rib
  else if (p.x < 0.1) color = 1.0;
  // frond border
  else if (abs(cy - y) < leaf + 0.2) color = 0.0;
  // rib border
  else if (p.x < 0.16) color = 0.0;
}

void main() {
  vec2 st = (gl_FragCoord.xy / (u_resolution * 0.5)) - vec2(1.0);
  st.y *= u_resolution.y / u_resolution.x;
  float t = u_time;
  // bulge in the center
  st *= 2.0 + length(st);
  // ripple the whole display
  st.x += sin(st.y - (t * 0.33)) * 0.2;
  // draw the fronds
  float color = 0.0;
  float offset = 2.3;
  branch(color, st + vec2(-offset, 0.0), t * 0.31 + 0.97, 0.15);
  branch(color, st + vec2(offset, 0.0), t * 0.37 + 0.17, 0.15);
  branch(color, st, t * 0.51, 0.2);
  gl_FragColor = vec4(vec3(color), 1.0);
}