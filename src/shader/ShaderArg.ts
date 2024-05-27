export const SHADER_ARG_INIT: unique symbol = Symbol();
export type ShaderArgs = { readonly [name: string]: ShaderArg; };
export type ShaderArg = {
    [SHADER_ARG_INIT](ctx: WebGL2RenderingContext, location: WebGLUniformLocation | null): void;
};