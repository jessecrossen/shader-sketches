#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define TAU 6.283185307

#define DEPTH 8

uniform vec2 u_resolution;
uniform float u_time;

// create and perform affine transforms
mat3 rotate(in mat3 m, in float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return(mat3(c,    -s,  0.0, 
              s,    c,   0.0, 
              0.0,  0.0, 1.0) * m);
}
mat3 scale(in mat3 m, in vec2 factor) {
  return(mat3(1.0 / factor.x, 0.0,            0.0, 
              0.0,            1.0 / factor.y, 0.0, 
              0.0,            0.0,            1.0) * m);
}
mat3 translate(in mat3 m, in vec2 pos) {
  m[2].xy -= pos;
  return(m);
}
mat3 branch(in vec2 connect, in float angle, in float shrink) {
  return(scale(rotate(translate(
    mat3(1.0), connect), - angle), vec2(shrink)));
}
mat3 unbranch(in vec2 connect, in float angle, in float shrink) {
  return(translate(rotate(scale(
    mat3(1.0), vec2(1.0 / shrink)), angle), - connect));
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float branches(in vec2 p, float depth, vec2 connect, float shrink) {
  float len = length(connect);
  float angle = atan(connect.y, connect.x);
  // rotate the branch to connect it
  p = rotate2d(angle) * p;
  // add some bulge at the base
  p.y *= 1.0 - (0.4 * smoothstep(connect.x, 0.0, p.x));
  // determine the radius of the branch at the base and connecting points
  float base_radius = 0.02 / pow(shrink, depth * 0.3);
  float connect_radius = base_radius * shrink * 1.2;
  // don't render past the length of the branch
  if (p.x > len) return(0.0);
  // draw a line with varying weight
  float radius = connect_radius + 
    (smoothstep(len, 0.0, p.x) * (base_radius - connect_radius));
  return(abs(p.y) < radius ? 1.0 : 0.0);
}

// floaty things
float floaty(in vec2 p, vec2 c, float depth) {
  if (depth <= 5.0) {
    float d = distance(p, c);
    if (d >= 0.02 && d <= 0.04) return(1.0);
  }
  return(0.0);
}

float stalk(in vec2 p, float depth, float shrink, float len) {
  float t = 3.5 - depth;
  // seed
  float radius = 0.02;
  len = 0.02 + (len * t);
  vec2 tip = vec2(0.0, len);
  float d = distance(tip, p);
  if (d <= radius && (d >= radius * 0.5 || t < 2.0)) return(1.0);
  if (d > len) return(0.0);
  // stalk
  float r = pow((len - d) / len, 4.0) * TAU * (2.1 - t);
  p = tip + (rotate2d(r) * (p - tip));
  float taper = 0.0; 
  if (t > 1.5) {
    taper = smoothstep(0.0, tip.y, p.y) * (radius * 1.5) * (t - 1.5);
  }
  if (p.y >= 0.0 && p.y <= tip.y &&
      abs(p.x) <= radius - taper) return(1.0);
  // ejected capsules
  float a = 0.0;
  float spread = max(0.0, 0.1 * (t - 1.7));
  for (int i = 0; i < 5; i++) {
    d = distance(p, vec2(tip.x + cos(a) * spread, tip.y + sin(a) * spread));
    if (d <= radius * 0.5) return(1.0);
    a += TAU / 5.0;
  }
  return(0.0);
}

// draw the self-similar component
float frame(in vec2 p, float depth, vec2 connect, float shrink) {
  float color = 0.0;
  // make a point that's reflected across the y axis for bilateral symmetry
  vec2 rp = vec2(abs(p.x), p.y);
  color += branches(rp, depth, connect, shrink);
  color += stalk(p, depth, shrink, 0.2);
  color += stalk(rotate2d(-0.33 * TAU) * p, depth, shrink, 0.15);
  color += stalk(rotate2d(-0.33 * TAU) * vec2(- p.x, p.y), depth, shrink, 0.15);
  // color += floaty(p, vec2(0.2 * (3.5 - depth), (1.5 - depth) * 0.3), depth);
  // color += floaty(p, vec2(0.1 + 0.1 * (6.0 - depth), -0.1 + (1.5 - depth) * 0.3), depth);
  if (distance(p, vec2(0.0, 0.02)) <= 0.02) color = 0.0;
  return(color);
}

mat3 zoom(in float angle, in float len, in float shrink, in float f) {
  float a1 = (PI - angle) * 0.5;
  float a2 = ((0.25 * TAU) - a1) + (angle * f);
  float r = (len * 0.5) / cos(a1);
  vec2 c = vec2(sin(a1) * r, - (0.5 * len));
  vec2 d = c + vec2(- (cos(a2) * r), (sin(a2) * r));
  return(unbranch(d, angle * f, mix(1.0, shrink, f)));
}

void main() {
    vec2 st = (gl_FragCoord.xy / u_resolution);
    st.y *= u_resolution.y / u_resolution.x;
    st.x -= 0.6;
    st.y -= 0.4;
    st *= 1.5;
    vec3 p = vec3(st, 1.0);
    // make a self-similarity transform and its inverse
    vec2 connect = vec2(0.25 + sin(u_time * 0.37) * 0.01, 
                        0.3 + cos(u_time * 0.23) * 0.01);
    float angle = atan(connect.x, connect.y);
    float len = length(connect);
    float shrink = 0.55;
    mat3 inward = branch(connect, angle, shrink);
    mat3 outward = unbranch(connect, angle, shrink);
    // zoom in continuously to the next level of depth
    float f = mod(u_time * 0.3, 1.0);
    p = zoom(angle, len, shrink, f) * p;
    // start drawing one level out in case the left branch 
    //  is visible while zooming
    p = outward * p;
    // make a series of branching transforms back to unit space,
    //  drawing the self-similar shape at each depth level
    float color = 0.0;
    for (int i = 0; i < DEPTH + 1; i++) {
      color += frame(p.xy, float(i) - f, connect, shrink);
      p.x = abs(p.x);
      p = inward * p;
    }

    // float color = 0.0;
    // if (distance(p.xy, connect) <= 0.02) color = 0.5;
    // if (length(p.xy) <= 0.02) color = 0.5;
    // if (distance(p.xy, c) <= 0.02) color = 0.5;
    // if (distance(p.xy, d) <= 0.02) color = 1.0;

    gl_FragColor = vec4(vec3(1.0 - color), 1.0);
}