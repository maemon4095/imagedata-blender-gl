import { ShaderSource } from "../shader/mod.ts";

export default new ShaderSource(`
uniform sampler2D blender_srcImage;
uniform sampler2D blender_dstImage;
uniform vec4 blender_srcArea;
uniform ivec2 u_porterDuff;

in vec2 blender_dstCoord;
in vec2 blender_srcCoord;

out vec4 fragColor;

vec4 porterDuff(float fa, float fb, vec4 below, vec4 above);
float getPorterDuffArg(int f, float ba, float aa);
void main() {
    vec2 dstSize = vec2(textureSize(blender_dstImage, 0));
    vec2 srcSize = vec2(textureSize(blender_srcImage, 0));
    vec4 srcCoordBounds = vec4(blender_srcArea.xy / srcSize, (blender_srcArea.xy + blender_srcArea.zw) / srcSize);
    bool outside = any(bvec4(lessThan(blender_srcCoord, srcCoordBounds.xy), greaterThan(blender_srcCoord, srcCoordBounds.zw)));
    vec4 dst = texture(blender_dstImage, blender_dstCoord);
    vec4 src = texture(blender_srcImage, blender_srcCoord);

    if (outside) {
        fragColor = dst;
        return;
    }

    float fa = getPorterDuffArg(u_porterDuff.x, dst.a, src.a);
    float fb = getPorterDuffArg(u_porterDuff.y, dst.a, src.a);
    fragColor = porterDuff(fa, fb, dst, src);
}

vec3 blend(vec3 src, vec3 dst);
vec4 porterDuff(float fa, float fb, vec4 below, vec4 above) {
    float aa = above.a;
    float ab = below.a;
    vec3 ca = above.rgb;
    vec3 cb = below.rgb;

    float ao = aa * fa + ab * fb;
    vec3 cm = (1.0 - ab) * ca + ab * blend(ca, cb);
    vec3 co = aa * fa * cm + ab * fb * cb;

    return step(0.0, ao) * vec4(co / ao, ao);
}

float getPorterDuffArg(int f, float ba, float aa) {
    switch(f) {
        case -1: return ba;
        case -2: return aa;
        case -3: return 1.0 - ba;
        case -4: return 1.0 - aa;
        default: return float(f);
    }
}

float multiply(float a, float b) {
    return b * a;
}
float screen(float a, float b) {
    return b + a - b * a;
}
float hardLight(float a, float b) {
    if (a <= 0.5) {
        return multiply(b, 2.0 * a);
    } else {
        return screen(b, 2.0 * a - 1.0);
    }
}

#if (METHOD == 1) // normal
#define CHANNEL_BLEND true
float blendCh(float src, float dst) {
    return src;
}
#endif

#if (METHOD == 2) // multiply
#define CHANNEL_BLEND true
float blendCh(float src, float dst) {
    return multiply(src, dst);
}
#endif

#if (METHOD == 3) // screen
#define CHANNEL_BLEND true
float blendCh(float src, float dst) {
    return screen(src, dst);
}
#endif

#if (METHOD == 4) // overlay
#define CHANNEL_BLEND true
float blendCh(float src, float dst) {
    return hardLight(dst, src);
}
#endif

#if (METHOD == 5) // darken
#define CHANNEL_BLEND true
float blendCh(float src, float dst) {
    return min(dst, src);
}
#endif

#if (METHOD == 6) // lighten
#define CHANNEL_BLEND true
float blendCh(float src, float dst) {
    return max(dst, src);
}
#endif

#if (METHOD == 7) // colorDodge
#define CHANNEL_BLEND true
float blendCh(float src, float dst) {
    if (dst == 0.0) {
        return 0.0;
    }
    if (src == 1.0) {
        return 1.0;
    }
    return min(1.0, dst / (1.0 - src));
}
#endif

#if (METHOD == 8) // colorBurn
#define CHANNEL_BLEND true
float blendCh(float src, float dst) {
    if (dst == 1.0) {
        return 1.0;
    }
    if (src == 0.0) {
        return 0.0;
    }
    return 1.0 - min(1.0, (1.0 - dst) / src);
}
#endif

#if (METHOD == 9) // hardLight
#define CHANNEL_BLEND true
float blendCh(float src, float dst) {
    return hardLight(src, dst);
}
#endif

#if (METHOD == 10) // softLight
#define CHANNEL_BLEND true
float blendCh(float a, float b) {
    if (a <= 0.5) {
        return b - (1.0 - 2.0 * a) * b * (1.0 - b);
    } else
        {
    const d = b <= 0.25 ? ((16.0 * b - 12.0) * b + 4.0) * b : sqrt(b);

    return b + (2.0 * a - 1) * (d - b);
}
}
#endif

#if (METHOD == 11)  // difference
#define CHANNEL_BLEND true
float blendCh(float a, float b) {
    return abs(b - a);
}
#endif

#if (METHOD == 12)
#define CHANNEL_BLEND true
float blendCh(float a, float b) {
    return b + a - 2 * b * a;
}
#endif

#ifdef CHANNEL_BLEND
vec3 blend(vec3 a, vec3 b) {
    return vec3(
        blendCh(a.r, b.r),
        blendCh(a.g, b.g),
        blendCh(a.b, b.b)
    );
}
#endif
`);

