export class ShaderSource {
    readonly #source: string;
    readonly #sourceWithPrelude: string;
    constructor(source: string) {
        this.#source = source;
        this.#sourceWithPrelude = prelude + source;
    }

    get source(): string {
        return this.#source;
    }

    get sourceWithPrelude(): string {
        return this.#sourceWithPrelude;
    }

    withDefine(values: { [name: string]: string; }): ShaderSource {
        let source = this.#source;
        for (const [name, value] of Object.entries(values)) {
            source = `#define ${name} ${value}\n` + source;
        }
        return new ShaderSource(source);
    }
}

const prelude = `#version 300 es
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
`;