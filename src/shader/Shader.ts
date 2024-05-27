import type { ShaderArgs } from "./ShaderArg.ts";
import type { ShaderSource } from "./ShaderSource.ts";

export type Shader = {
    readonly src: ShaderSource;
    readonly args: ShaderArgs;
};