#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define TAU 6.283185307

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
vec2 rotate(in vec2 p, in float angle) {
  mat3 m = rotate(mat3(1.), angle);
  return((m * vec3(p, 1.)).xy);
}

// see: https://stackoverflow.com/questions/12964279/whats-the-origin-of-this-glsl-rand-one-liner
float rand(vec2 co){
  return fract(sin(dot(co, vec2(12.9898, 78.233))) * 43758.5453);
}

// fold the coordinate space like a 6-pointed paper snowflake:
//  https://www.instructables.com/id/How-to-Make-6-Pointed-Paper-Snowflakes/
vec2 fold(vec2 st, float angle) {
  vec3 p = vec3(st, 1.0);
  mat3 r = rotate(mat3(1.0), - (2. * angle));
  float foldslope = cos(angle) / sin(angle);
  p.x = abs(p.x);
  if (p.y / p.x < foldslope) {
    p = r * p;
    p.x = abs(p.x);
  }
  if (p.y / p.x < foldslope) {
    p = r * p;
    p.x = abs(p.x);
  }
  if (p.y / p.x < foldslope) {
    p = r * p;
    p.x = abs(p.x);
  }
  return(p.xy);
}

// generate some randomish jagged lines for cuts on the fold
float jagxi(in float i, in float t) {
  float x = 1.;
  if (mod(i, 3.) == 0.) x *= - cos(t * 0.91) * 0.5;
  if (mod(i, 2.) == 0.) x *= cos(t * 0.97) * 0.5;
  if (mod(i, 5.) <= 1.) x = 0.6;
  if (mod(i, 7.) <= 1.) x *= 0.25;
  if ((mod(i, 11.) <= 1.) && (x <= 0.8)) x += 0.2;
  return(x - (0.3 + sin(t) * 0.1));
}
float jagx(in vec2 p, in float t) {
  p.y = p.y * 8.;
  float i = floor(p.y);
  return(mix(jagxi(i, t), jagxi(i + 1., t), fract(p.y)));
}

// make pretty cuts in the paper while keeping it in one piece
float cut(in vec2 p, in float angle, in float t) {
  // make a center cut (or non-cut)
  float y1 = (cos(t * 1.13) * 0.05);
  if (p.y < abs(y1)) return(y1 > 0. ? 0. : 1.);
  // cut the outside edge at an angle
  float y2 = 1. + (p.x * (0.45 + (cos(t) * 0.15)));
  if ((p.y < y1) || (p.y > y2)) return(0.);
  // scale all other cuts to fit the wegde shape
  float s = p.y * sin(angle) * 0.8;
  p.x /= s;
  // cut along folds
  float x1 = - 0.5 + 
    jagx(p + vec2(0., t), t);
  float x2 = 0.5 + 
    jagx(p + vec2(0., t + (13. * sin(t * 0.05))), t);
  // prevent cuts from meeting
  float w = (p.y * 0.25) / s;
  if ((p.x > x1) && (p.x < x1 + w)) {
    return(1.);
  }
  return (p.x < x1 || p.x > x2 ? 0. : 1.);
}

// draw a paper snowflake
float snowflake(in vec2 p, in vec2 offset, in float size, in float angle, in float t) {
  p -= offset;
  p = rotate(p, - angle);
  const float symmetry = TAU / 12.;
  p = fold(p, symmetry);
  p = rotate(p, - symmetry * 0.5);
  return(cut(p / size, symmetry, t));
}

// animate a paper snowflake falling
float animate(in vec2 p, in vec2 offset, in float t) {
  float id = offset.x + floor(t + offset.y);
  float depth = rand(vec2(id, id + 0.6));
  float size = 0.02 + (depth * 0.16);
  float speed = 1.25 + depth;
  float y = mix(speed, - speed, fract(t + offset.y));
  float drift = 0.8 * (0.5 - rand(vec2(id, id - 0.6))) + 
    (size * sin(offset.x + y));
  float spin = 1. - (3. * rand(vec2(id + 0.2, id - 0.3)));
  float x = offset.x + (y * drift);
  return(snowflake(p, vec2(x, y), size, (t * spin) + drift, id));
}

void main() {
  vec2 p = (gl_FragCoord.xy / (u_resolution * 0.5)) - vec2(1.0);
  p.y *= u_resolution.y / u_resolution.x;

  float color = 0.0;

  float t = (u_time + 137.) * 0.2;

  color += animate(p, vec2(-0.474277, 0.468185), t + -0.717748);
  color += animate(p, vec2(-0.996724, -0.608627), t + -0.562712);
  color += animate(p, vec2(0.817004, 0.113504), t + 0.304861);
  color += animate(p, vec2(0.33844, -0.4585904), t + 0.2036763);
  color += animate(p, vec2(0.1143632, -0.737643), t + -0.1946511);
  color += animate(p, vec2(-0.1736955, 0.29996), t + -0.1133225);
  color += animate(p, vec2(-0.711102, -0.2341896), t + -0.939567);
  color += animate(p, vec2(0.1799859, -0.447433), t + -0.281237);
  color += animate(p, vec2(-0.3991343, 0.726465), t + -0.1509156);
  color += animate(p, vec2(0.582827, -0.1261069), t + -0.142386);
  color += animate(p, vec2(-0.3712460, 0.822418), t + 0.385772);
  color += animate(p, vec2(0.1429855, -0.3741468), t + 0.1310697);
  
  gl_FragColor = vec4(vec3(color), 1.0);
}