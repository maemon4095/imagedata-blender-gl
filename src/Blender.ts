import type { ShaderSource, Shader, ShaderArgs } from "./shader/mod.ts";
import vertexShaderSource from "./vertexShader.ts";
import * as webgl from "./webgl.ts";


export class Blender {
    #canvas: OffscreenCanvas;
    #gl: WebGL2RenderingContext | null;
    #vertexShader: WebGLShader | null;
    #shaderCache: Map<ShaderSource, WebGLProgram>;
    #inputTexture: WebGLTexture | null;
    #outputTexture: WebGLTexture | null;
    #outputFrameBuffer: WebGLFramebuffer | null;
    #currentTexture: WebGLTexture | null;
    #currentFrameBuffer: WebGLFramebuffer | null;

    constructor(width: number, height: number) {
        const canvas = new OffscreenCanvas(width, height);
        this.#canvas = canvas;
        this.#shaderCache = new Map();
        this.#gl = null;
        this.#vertexShader = null;
        this.#inputTexture = null;
        this.#outputTexture = null;
        this.#currentTexture = null;
        this.#outputFrameBuffer = null;
        this.#currentFrameBuffer = null;
        this.#init();
    }

    get width(): number {
        return this.#canvas.width;
    }

    get height(): number {
        return this.#canvas.height;
    }

    #init(): void {
        const canvas = this.#canvas;
        const gl = canvas.getContext("webgl2");
        if (gl === null) {
            throw new Error("Failed to initialize WebGL.");
        }
        this.#gl = gl;
        const vs = webgl.loadShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
        this.#vertexShader = vs;

        const inputTexture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, inputTexture);
        webgl.setTextureParams(gl);
        const [outputTexture, outputFrameBuffer] = webgl.createFrameBuffer(gl);
        const [currentTexture, currentFrameBuffer] = webgl.createFrameBuffer(gl);

        this.#inputTexture = inputTexture;
        this.#outputTexture = outputTexture;
        this.#outputFrameBuffer = outputFrameBuffer;
        this.#currentTexture = currentTexture;
        this.#currentFrameBuffer = currentFrameBuffer;
    }

    /** NOTE: blender must be initialized. */
    #loadProgram(shader: ShaderSource): WebGLProgram {
        const cache = this.#shaderCache.get(shader);
        if (cache !== undefined) {
            return cache;
        }

        const source = shader.sourceWithPrelude;
        const gl = this.#gl!;
        const fs = webgl.loadShader(gl, gl.FRAGMENT_SHADER, source);
        const program = gl.createProgram()!;
        gl.attachShader(program, this.#vertexShader!);
        gl.attachShader(program, fs);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            const info = gl.getProgramInfoLog(program);
            throw new Error("Failed to compile WebGL program. \n\n" + info);
        }

        this.#shaderCache.set(shader, program);
        return program;
    }

    #endPass(): void {
        // swap output and current
        const outputTexture = this.#outputTexture;
        const outputFrameBuffer = this.#outputFrameBuffer;
        this.#outputTexture = this.#currentTexture;
        this.#outputFrameBuffer = this.#currentFrameBuffer;
        this.#currentTexture = outputTexture;
        this.#currentFrameBuffer = outputFrameBuffer;
    }

    /** NOTE: blender must be initialized */
    #pass(dx: number, dy: number, srcArea: Rect, program: WebGLProgram, shaderArgs: ShaderArgs): void {
        const gl = this.#gl!;

        webgl.useProgram(gl, program, shaderArgs);

        gl.viewport(0, 0, gl.canvas.width, gl.canvas.height);
        const positionBuffer = gl.createBuffer();
        webgl.writeRectangle(gl, positionBuffer, 0, 0, gl.canvas.width, gl.canvas.height);

        // setup attributes
        const positionLocation = gl.getAttribLocation(program, "blender_vertex_position_in_pixel");
        gl.enableVertexAttribArray(positionLocation);
        gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

        // set output
        gl.bindTexture(gl.TEXTURE_2D, this.#outputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.canvas.width, gl.canvas.height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#outputFrameBuffer);

        // clear buffer
        gl.clearColor(0.0, 0.0, 0.0, 0.0);
        gl.clear(gl.COLOR_BUFFER_BIT);

        // setup spetial shader arguments
        const srcOffsetLocation = gl.getUniformLocation(program, "blender_srcOffset");
        const srcAreaLocation = gl.getUniformLocation(program, "blender_srcArea");
        const srcImageLocation = gl.getUniformLocation(program, "blender_srcImage");
        const dstImageLocation = gl.getUniformLocation(program, "blender_dstImage");

        gl.uniform2f(srcOffsetLocation, dx, dy);
        gl.uniform4f(srcAreaLocation, srcArea.x, srcArea.y, srcArea.width, srcArea.height);

        gl.uniform1i(dstImageLocation, 0);  // texture unit 0
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.#currentTexture);

        gl.uniform1i(srcImageLocation, 1);  // texture unit 1
        gl.activeTexture(gl.TEXTURE1);
        gl.bindTexture(gl.TEXTURE_2D, this.#inputTexture);

        // draw
        gl.drawArrays(gl.TRIANGLES, 0, 6 /** vertex count; a rectangle = two triangles = 3 * 2 vertices. */);

        // swap buffer
        this.#endPass();
    }

    blend(image: ImageData, dx: number, dy: number, shader: Shader): void {
        if (this.#gl === null) {
            this.#init();
        }
        const gl = this.#gl!;
        gl.bindTexture(gl.TEXTURE_2D, this.#inputTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);

        const blendProgram = this.#loadProgram(shader.src);
        this.#pass(dx, dy, { x: 0, y: 0, width: image.width, height: image.height }, blendProgram, shader.args);
    }

    createImageData(): ImageData {
        const w = this.width;
        const h = this.height;
        const gl = this.#gl;
        if (gl === null) {
            throw new Error("Blender does not initialized.");
        }
        const buffer = new Uint8ClampedArray(w * h * 4);
        gl.bindFramebuffer(gl.FRAMEBUFFER, this.#currentFrameBuffer);
        gl.readPixels(0, 0, this.width, this.height, gl.RGBA, gl.UNSIGNED_BYTE, buffer);
        return new ImageData(buffer, w, h);
    }
}
type Rect = {
    x: number;
    y: number;
    width: number;
    height: number;
};