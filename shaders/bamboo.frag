#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define TAU 6.283185307

uniform vec2 u_resolution;
uniform float u_time;

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

vec4 stalk(in vec2 st, in float offset, in float angle, in float scroll) {
  // rotate the stalk
  st = rotate2d(angle) * st;
  st += rotate2d(angle) * vec2(offset + scroll, 0.0);
  // wrap the position for continuous scrolling
  float x = mod(st.x, 8.0) - 0.5;
  // taper the stalk toward the top
  float taper = 1.0 + (st.y * 0.1);
  x *= taper;
  // curve nodes
  float y = st.y + cos(x * 1.5);
  float f = fract(y);
  // kink segments
  float kink = sin(st.x + (y * 0.1)) * 0.05;
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
  float t1 = sin(u_time * 0.05) * 3.0;
  float t2 = cos(u_time * 0.07) * 2.0;
  float t3 = sin(u_time * 0.09) * 5.0;
  float ripple =
    sin(u_time + distance(st, vec2(0.1, 3.0)) * (200.0 + t1)) +
    sin(u_time + distance(st, vec2(1.1, 3.13)) * (150.0 + t2)) +
    sin(u_time + distance(st, vec2(3.0, -8.0)) * 170.0);
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
  // jumble the angles of the stalks
  float angle1 = 1.0 + (sin(u_time * 0.011) * 0.25);
  float angle2 = 1.0 + (cos(u_time * 0.013) * 0.25);
  float angle3 = 1.0 + (sin(u_time * 0.017) * 0.25);
  float r1 = 0.05 * angle1;
  float r2 = -0.06 * angle2;
  float r3 = 0.12 * angle3;
  float r4 = -0.07 * angle1;
  float r5 = 0.03 * angle2;
  float r6 = -0.09 * angle3;
  // scroll bamboo
  float scroll = u_time * 0.2;
  float parallax = 1.1;
  float perspective = 0.85;
  // zoom out
  st *= 4.0;
  // back layer bamboo
  overlay(color, stalk(st, 0.0, r1, scroll));
  overlay(color, stalk(st, 1.1, r2, scroll));
  overlay(color, stalk(st, 5.1, r6, scroll));
  // parallax and perspective
  scroll *= parallax;
  st *= perspective;
  // middle layer bamboo
  overlay(color, stalk(st, 4.1, r3, scroll));
  overlay(color, stalk(st, 2.3, r4, scroll));
  overlay(color, stalk(st, 1.1, r1, scroll));
  // parallax and perspective
  scroll *= parallax;
  st *= perspective;
  // front layer bamboo
  overlay(color, stalk(st, 7.7, r5, scroll));
  overlay(color, stalk(st, 1.3, r6, scroll));
  overlay(color, stalk(st, 1.9, r5, scroll));

  gl_FragColor = color;
}