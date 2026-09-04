declare module "three/examples/jsm/loaders/GLTFLoader.js" {
  export class GLTFLoader {
    constructor(manager?: any);
    load(
      url: string,
      onLoad: (gltf: any) => void,
      onProgress?: (event: ProgressEvent) => void,
      onError?: (event: ErrorEvent) => void
    ): void;
    setPath(path: string): this;
    setResourcePath(path: string): this;
    parse(data: ArrayBuffer | string, path: string, onLoad: (gltf: any) => void, onError?: (event: ErrorEvent) => void): void;
  }
}

declare module "three/examples/jsm/controls/OrbitControls.js" {
  export class OrbitControls {
    constructor(object: any, domElement?: HTMLElement);
    update(): void;
    dispose(): void;
  }
}
