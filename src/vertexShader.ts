const vertexShader: string = /*glsl*/`#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

in vec2 blender_vertex_position_in_pixel;

uniform vec2 blender_srcOffset;
uniform sampler2D blender_dstImage;
uniform sampler2D blender_srcImage;
uniform vec4 blender_srcArea;

out highp vec2 blender_dstCoord;
out highp vec2 blender_srcCoord;

void main() {
    highp vec2 dstSize = vec2(textureSize(blender_dstImage, 0));
    highp vec2 srcSize = vec2(textureSize(blender_srcImage, 0));
    vec2 normalized = blender_vertex_position_in_pixel / dstSize;
        
    gl_Position = vec4(normalized * 2.0 - 1.0, 0.0, 1.0);
    blender_dstCoord = normalized;
    blender_srcCoord = (blender_vertex_position_in_pixel - blender_srcOffset) / srcSize;
}`;

export default vertexShader;