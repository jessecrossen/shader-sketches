#ifdef GL_ES
precision mediump float;
#endif

#define PI 3.1415926535
#define TAU 6.283185307

uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_time;

mat2 rotate2d(float _angle){
    return mat2(cos(_angle),-sin(_angle),
                sin(_angle),cos(_angle));
}

float ripple(in vec2 st) {
    float d = sin(length(st));
    float t = 1.0 + cos(u_time * 0.1) * 0.1;
    float color = sin((d - t) * 40.0) * cos(d);
    return(color);
}

void main() {
    vec2 st = (gl_FragCoord.xy / (u_resolution * 0.5)) - vec2(1.0);
    vec2 m = (u_mouse / (u_resolution * 0.5)) - vec2(1.0);
    
    st *= vec2(4.0 + (sin(u_time) * 0.1));
    
    st = rotate2d((u_time + length(st) * cos(u_time)) * 0.25) * st;
    
    float d = 0.8 + (sin(u_time * 1.07) * 0.43);
    vec2 dv = vec2(d, 0.0);
    float color = 0.0;
    float angle = 0.0;
    
    float angleStep = 1.0 / (sin(u_time / 17.0) * 12.0);
    
    for (int i = 0; i < 12; i++) {
        if (abs(angle) <= 1.0) {
            color += ripple(st + (rotate2d(angle * TAU) * dv));
            angle += angleStep;
        }
    }
    
    color = smoothstep(0.49, 0.51, color);
    
    gl_FragColor = vec4(vec3(color),1.0);
}