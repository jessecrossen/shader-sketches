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

float ripple(in vec2 st) {
    float d = sin(length(st));
    float t = 1.0 + cos(u_time * 0.1) * 0.1;
    float color = sin((d - t) * 40.0) * cos(d);
    return(color);
}

vec2 swirl(in vec2 st) {
    return(rotate2d((u_time + length(st) * cos(u_time)) * 0.25) * st);
}

vec2 zoom(in vec2 st) {
    return(st * vec2(4.0 + (sin(u_time) * 0.1)));
}

void main() {
    vec2 st = (gl_FragCoord.xy / (u_resolution * 0.5)) - vec2(1.0);
    st.y *= u_resolution.y / u_resolution.x;
    // zoom in and out periodically
    st = zoom(st);
    // swirl CW and CCW periodically
    st = swirl(st);
    // vary the rotational symmetry
    float symmetry = (sin(u_time / 17.0) * 12.0);
    // vary the spread of the ripple centers
    float radius = 0.8 + (sin(u_time * 1.07) * 0.43);
    // repeat the ripple pattern with rotational symmetry
    vec2 dv = vec2(radius, 0.0);
    float color = 0.0;
    float angle = 0.0;
    for (int i = 0; i < 12; i++) {
        if (abs(angle) <= 1.0) {
            color += ripple(st + (rotate2d(angle * TAU) * dv));
            angle += 1.0 / symmetry;
        }
    }
    // anti-aliasing
    color = smoothstep(0.49, 0.51, color);
    gl_FragColor = vec4(vec3(color), 1.0);
}