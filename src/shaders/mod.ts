import { Args, type Shader, type ShaderSource } from "../mod.ts";
import type { ShaderArgs } from "../shader/ShaderArg.ts";
import * as src from "../shader_sources/mod.ts";

const porterDuffArg: unique symbol = Symbol();
export type PorterDuffArg = 0 | 1 | (number & { [porterDuffArg]: typeof porterDuffArg; });

type PorterDuffFactory =
    ((fa: PorterDuffArg, fb: PorterDuffArg) => CompositeMethod) & {
        readonly srcAlpha: PorterDuffArg;
        readonly dstAlpha: PorterDuffArg;
        readonly srcAlphaComplement: PorterDuffArg;
        readonly dstAlphaComplement: PorterDuffArg;
    };

export class CompositeMethod {
    static readonly porterDuff: PorterDuffFactory = (() => {
        function f(fa: PorterDuffArg, fb: PorterDuffArg): CompositeMethod {
            return new CompositeMethod(fa, fb);
        };

        Object.defineProperty(f, "dstAlpha", { value: -1 });
        Object.defineProperty(f, "srcAlpha", { value: -2 });
        Object.defineProperty(f, "dstAlphaComplement", { value: -3 });
        Object.defineProperty(f, "srcAlphaComplement", { value: -4 });
        Object.freeze(f);

        return f as PorterDuffFactory;
    })();
    static readonly clear: CompositeMethod = CompositeMethod.porterDuff(0, 0);
    static readonly copy: CompositeMethod = CompositeMethod.porterDuff(1, 0);
    static readonly destination: CompositeMethod = CompositeMethod.porterDuff(0, 1);
    static readonly sourceOver: CompositeMethod = CompositeMethod.porterDuff(1, CompositeMethod.porterDuff.srcAlphaComplement);
    static readonly destinationOver: CompositeMethod = CompositeMethod.porterDuff(CompositeMethod.porterDuff.dstAlphaComplement, 1);
    static readonly sourceIn: CompositeMethod = CompositeMethod.porterDuff(CompositeMethod.porterDuff.dstAlpha, 0);
    static readonly destinationIn: CompositeMethod = CompositeMethod.porterDuff(0, CompositeMethod.porterDuff.srcAlpha);
    static readonly sourceOut: CompositeMethod = CompositeMethod.porterDuff(CompositeMethod.porterDuff.dstAlphaComplement, 0);
    static readonly destinationOut: CompositeMethod = CompositeMethod.porterDuff(0, CompositeMethod.porterDuff.srcAlphaComplement);
    static readonly sourceAtop: CompositeMethod = CompositeMethod.porterDuff(CompositeMethod.porterDuff.dstAlpha, CompositeMethod.porterDuff.srcAlphaComplement);
    static readonly destinationAtop: CompositeMethod = CompositeMethod.porterDuff(CompositeMethod.porterDuff.dstAlphaComplement, CompositeMethod.porterDuff.srcAlpha);
    static readonly xor: CompositeMethod = CompositeMethod.porterDuff(CompositeMethod.porterDuff.dstAlphaComplement, CompositeMethod.porterDuff.srcAlphaComplement);
    static readonly lighter: CompositeMethod = CompositeMethod.porterDuff(1, 1);

    #fa: PorterDuffArg;
    #fb: PorterDuffArg;

    constructor(fa: PorterDuffArg, fb: PorterDuffArg) {
        this.#fa = fa;
        this.#fb = fb;
    }

    get fa(): PorterDuffArg {
        return this.#fa;
    }

    get fb(): PorterDuffArg {
        return this.#fb;
    }
}

export class BlendShader implements Shader {
    static readonly normal: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "1" }), CompositeMethod.sourceOver);
    static readonly multiply: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "2" }), CompositeMethod.sourceOver);
    static readonly screen: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "3" }), CompositeMethod.sourceOver);
    static readonly overlay: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "4" }), CompositeMethod.sourceOver);
    static readonly darken: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "5" }), CompositeMethod.sourceOver);
    static readonly lighten: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "6" }), CompositeMethod.sourceOver);
    static readonly colorDodge: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "7" }), CompositeMethod.sourceOver);
    static readonly colorBurn: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "8" }), CompositeMethod.sourceOver);
    static readonly hardLight: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "9" }), CompositeMethod.sourceOver);
    static readonly softLight: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "10" }), CompositeMethod.sourceOver);
    static readonly difference: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "11" }), CompositeMethod.sourceOver);
    static readonly exclusion: BlendShader = new BlendShader(src.blend.withDefine({ METHOD: "12" }), CompositeMethod.sourceOver);

    readonly src: ShaderSource;
    readonly args: ShaderArgs;
    private constructor(src: ShaderSource, method: CompositeMethod) {
        this.src = src;
        this.args = { u_porterDuff: Args.int(method.fa, method.fb) };
    }
    withCompositeMethod(method: CompositeMethod): BlendShader {
        return new BlendShader(this.src, method);
    }
}