#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define TAU 6.283185307

uniform vec2 u_resolution;
uniform float u_time;

vec4 stalk(in vec2 st) {
  // wrap the position for continuous scrolling
  float x = mod(st.x, 8.0) - 0.5;
  // taper the stalk toward the top
  float taper = 1.0 + (st.y * 0.1);
  x *= taper;
  // curve nodes
  float y = st.y + cos(x * 1.5);
  float f = fract(y);
  // kink segments
  float kink = sin(st.x + (y * 0.1)) * 0.08;
  x += (mod(y, 2.0) < 1.0 ? f * kink : (1.0 - f) * kink);
  // shrink center of segments so nodes bulge a bit
  x = abs(x * 8.0) + 
    (sin(f * PI) * 0.1);
  // draw nodes, reducing their line weight toward the top
  float inner = 0.02 / taper;
  float outer = inner + 0.01;
  float color = smoothstep(inner, outer, f) -
                smoothstep(1.0 - outer, 1.0 - inner, f);
  // draw outline
  color = smoothstep(1.02, 1.0, x) * color;
  float alpha = smoothstep(1.37, 1.35, x);
  return(vec4(vec3(color), alpha));
}

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

void overlay(inout vec4 back, in vec4 front) {
  back.rgb = mix(back.rgb, front.rgb, front.a);
  back.a = 1.0;
}

void main() {
  vec2 st = gl_FragCoord.xy / u_resolution;
  st.y *= u_resolution.y / u_resolution.x;
  vec4 color = vec4(vec3(0.0), 1.0);
  // moon
  vec2 moon = vec2(0.68, 0.71);
  color.rgb += smoothstep(0.155, 0.15, distance(st, moon));
  // lake
  float t = u_time;
  float t1 = sin(u_time * 0.05) * 3.0;
  float t2 = sin(u_time * 0.07) * 2.0;
  float t3 = sin(u_time * 0.09) * 5.0;
  float ripple =
    sin(t + distance(st, vec2(0.1, 3.0)) * (200.0 + t1)) +
    sin(t + distance(st, vec2(1.1, 3.13)) * (150.0 + t2)) +
    sin(t + distance(st, vec2(3.0, -8.0)) * 170.0);
  float reflection = 0.3 + smoothstep(0.3, 0.1, abs(st.x - moon.x) + (st.y * 0.4));
  float lake = smoothstep(0.42, 0.4, st.y);
  float land = smoothstep(0.0, 0.01, 
    st.y - (0.03 + sin(st.x + (u_time * 0.05)) * 0.05));
  // draw reflection on lake
  color.rgb += 
    smoothstep(0.7, 0.71, ripple * reflection * lake * land);
  // brighten horizon
  float horizon = smoothstep(0.02, 0.0, abs(st.y - 0.41));
  color.rgb += smoothstep(0.5, 0.51, horizon * ripple);
  // scroll bamboo
  vec2 st2 = st;
  st2.x += (u_time * 0.05);
  // zoom out
  st2 *= 4.0;
  // jumble the angles of the stalks
  float angle1 = 1.0 + (sin(u_time * 0.011) * 0.25);
  float angle2 = 1.0 + (sin(u_time * 0.013) * 0.25);
  float angle3 = 1.0 + (sin(u_time * 0.017) * 0.25);
  mat2 r1 = rotate2d(0.05 * angle1);
  mat2 r2 = rotate2d(-0.06 * angle2);
  mat2 r3 = rotate2d(0.12 * angle3);
  mat2 r4 = rotate2d(-0.07 * angle1);
  mat2 r5 = rotate2d(0.03 * angle2);
  mat2 r6 = rotate2d(-0.09 * angle3);
  // back layer bamboo
  overlay(color, stalk(r1 * st2));
  overlay(color, stalk(r2 * st2 + vec2(1.1, 0.0)));
  overlay(color, stalk(r6 * st2 + vec2(5.1, 0.0)));
  // parallax and perspective
  st2.x += u_time * 0.08;
  st2 *= 0.85;
  // middle layer bamboo
  overlay(color, stalk(r3 * st2 + vec2(4.1, 0.0)));
  overlay(color, stalk(r4 * st2 + vec2(2.3, 0.0)));
  overlay(color, stalk(r1 * st2 + vec2(1.1, 0.0)));
  // parallax and perspective
  st2.x += u_time * 0.08;
  st2 *= 0.85;
  // front layer bamboo
  overlay(color, stalk(r5 * st2 + vec2(7.7, 0.0)));
  overlay(color, stalk(r6 * st2 + vec2(1.3, 0.0)));
  overlay(color, stalk(r5 * st2 + vec2(1.9, 0.0)));

  gl_FragColor = color;
}