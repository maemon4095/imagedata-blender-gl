import { type ShaderArgs, SHADER_ARG_INIT } from "./mod.ts";

export function loadShader(gl: WebGL2RenderingContext, type: number, source: string): WebGLShader {
    const shader = gl.createShader(type);
    if (shader === null) {
        throw new Error("Failed to load shader");
    }
    gl.shaderSource(shader, source);
    gl.compileShader(shader);

    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        const info = gl.getShaderInfoLog(shader);
        gl.deleteShader(shader);
        throw new Error("Failed to load shader: " + info);
    }

    return shader;
}

export function setTextureParams(gl: WebGL2RenderingContext): void {
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
}

export function createFrameBuffer(gl: WebGL2RenderingContext): [WebGLTexture | null, WebGLFramebuffer | null] {
    const texture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, texture);
    setTextureParams(gl);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);

    const frameBuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, frameBuffer);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

    return [texture, frameBuffer];
}

export function writeRectangle(gl: WebGL2RenderingContext, buffer: WebGLBuffer | null, x: number, y: number, w: number, h: number): void {
    const x0 = x;
    const x1 = x + w;
    const y0 = y;
    const y1 = y + h;

    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
        // list vertices in clockwise order.
        // triangle 0: top left half of the rectangle
        x0, y0, //    top left
        x1, y0, //    top right
        x0, y1, // bottom left
        // triangle 1: bottom right half of the rectangle
        x0, y1, // bottom left
        x1, y0, //    top right
        x1, y1, // bottom right
    ]), gl.STATIC_DRAW);
}

export function useProgram(gl: WebGL2RenderingContext, program: WebGLProgram, args: ShaderArgs): void {
    gl.useProgram(program);
    for (const [name, arg] of Object.entries(args)) {
        const location = gl.getUniformLocation(program, name);
        arg[SHADER_ARG_INIT](gl, location);
    }
}
