import { SHADER_ARG_INIT, type ShaderArg } from "./ShaderArg.ts";

export function int(v0: number): ShaderArg;
export function int(v0: number, v1: number): ShaderArg;
export function int(v0: number, v1: number, v2: number): ShaderArg;
export function int(v0: number, v1: number, v2: number, v3: number): ShaderArg;
export function int(nums: Int32Array): ShaderArg;
export function int(nums: number[]): ShaderArg;
export function int(...nums: number[] | [Int32Array] | [number[]]): ShaderArg {
    return {
        [SHADER_ARG_INIT](ctx, location) {
            if (nums.length === 1) {
                const head = nums[0];
                if (head instanceof Int32Array || head instanceof Array) {
                    ctx.uniform1iv(location, head);
                    return;
                }
                ctx.uniform1i(location, head);
                return;
            }

            switch (nums.length) {
                case 2: ctx.uniform2i(location, nums[0], nums[1]); break;
                case 3: ctx.uniform3i(location, nums[0], nums[1], nums[2]); break;
                case 4: ctx.uniform4i(location, nums[0], nums[1], nums[2], nums[3]); break;
            }
        }
    };
}
export function float(v0: number): ShaderArg;
export function float(v0: number, v1: number): ShaderArg;
export function float(v0: number, v1: number, v2: number): ShaderArg;
export function float(v0: number, v1: number, v2: number, v3: number): ShaderArg;
export function float(nums: Float32Array): ShaderArg;
export function float(nums: number[]): ShaderArg;
export function float(...nums: number[] | [Float32Array] | [number[]]): ShaderArg {
    return {
        [SHADER_ARG_INIT](ctx, location) {
            if (nums.length === 1) {
                const head = nums[0];
                if (head instanceof Float32Array || head instanceof Array) {
                    ctx.uniform1fv(location, head);
                    return;
                }
                ctx.uniform1f(location, head);
                return;
            }

            switch (nums.length) {
                case 2: ctx.uniform2f(location, nums[0], nums[1]); break;
                case 3: ctx.uniform3f(location, nums[0], nums[1], nums[2]); break;
                case 4: ctx.uniform4f(location, nums[0], nums[1], nums[2], nums[3]); break;
            }
        }
    };
}

export function uint(v0: number): ShaderArg;
export function uint(v0: number, v1: number): ShaderArg;
export function uint(v0: number, v1: number, v2: number): ShaderArg;
export function uint(v0: number, v1: number, v2: number, v3: number): ShaderArg;
export function uint(nums: Uint32Array): ShaderArg;
export function uint(nums: number[]): ShaderArg;
export function uint(...nums: number[] | [Uint32Array] | [number[]]): ShaderArg {
    return {
        [SHADER_ARG_INIT](ctx, location) {
            if (nums.length === 1) {
                const head = nums[0];
                if (head instanceof Uint32Array || head instanceof Array) {
                    ctx.uniform1uiv(location, head);
                    return;
                }
                ctx.uniform1ui(location, head);
                return;
            }

            switch (nums.length) {
                case 2: ctx.uniform2ui(location, nums[0], nums[1]); break;
                case 3: ctx.uniform3ui(location, nums[0], nums[1], nums[2]); break;
                case 4: ctx.uniform4ui(location, nums[0], nums[1], nums[2], nums[3]); break;
            }
        }
    };
}

type MatrixSize = 2 | 3 | 4;
/** @param nums - column major ordered elements. */
export function matrix(row: MatrixSize, column: MatrixSize, nums: Float32List): ShaderArg {
    return {
        [SHADER_ARG_INIT](ctx, location) {
            switch (row) {
                case 2:
                    switch (column) {
                        case 2: ctx.uniformMatrix2fv(location, false, nums); break;
                        case 3: ctx.uniformMatrix2x3fv(location, false, nums); break;
                        case 4: ctx.uniformMatrix2x4fv(location, false, nums); break;
                    }
                    break;
                case 3:
                    switch (column) {
                        case 2: ctx.uniformMatrix3x2fv(location, false, nums); break;
                        case 3: ctx.uniformMatrix3fv(location, false, nums); break;
                        case 4: ctx.uniformMatrix3x4fv(location, false, nums); break;
                    }
                    break;
                case 4:
                    switch (column) {
                        case 2: ctx.uniformMatrix4x2fv(location, false, nums); break;
                        case 3: ctx.uniformMatrix4x3fv(location, false, nums); break;
                        case 4: ctx.uniformMatrix4fv(location, false, nums); break;
                    }
                    break;
            }
        }
    };
}
