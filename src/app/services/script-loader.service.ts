import { Injectable } from '@angular/core';

export interface ScriptAttributes {
  async?: boolean;
  defer?: boolean;
  type?: string;
  crossOrigin?: 'anonymous' | 'use-credentials';
  integrity?: string;
  nonce?: string;
  referrerPolicy?: HTMLScriptElement['referrerPolicy'];
  noModule?: boolean;
  [key: string]: string | boolean | undefined;
}

export interface ScriptConfig {
  src: string;
  attrs?: ScriptAttributes;
}

@Injectable({
  providedIn: 'root',
})
export class ScriptLoaderService {
  private loadedScripts = new Set<string>();
  private loadingPromises = new Map<string, Promise<void>>();
  private scriptElements = new Map<string, HTMLScriptElement>();

  loadScript(src: string, attrs: ScriptAttributes = {}): Promise<void> {
    if (this.loadedScripts.has(src)) {
      return Promise.resolve();
    }

    const existingPromise = this.loadingPromises.get(src);
    if (existingPromise) {
      return existingPromise;
    }

    const promise = new Promise<void>((resolve, reject) => {
      const existingDomScript = document.querySelector(
        `script[src="${src}"]`
      ) as HTMLScriptElement | null;

      if (existingDomScript) {
        this.scriptElements.set(src, existingDomScript);
        this.loadedScripts.add(src);
        this.loadingPromises.delete(src);
        resolve();
        return;
      }

      const script = document.createElement('script');
      script.src = src;

      if (attrs.async !== undefined) script.async = attrs.async;
      if (attrs.defer !== undefined) script.defer = attrs.defer;
      if (attrs.type) script.type = attrs.type;
      if (attrs.crossOrigin) script.crossOrigin = attrs.crossOrigin;
      if (attrs.integrity) script.integrity = attrs.integrity;
      if (attrs.nonce) script.nonce = attrs.nonce;
      if (attrs.referrerPolicy) script.referrerPolicy = attrs.referrerPolicy;
      if (attrs.noModule !== undefined) script.noModule = attrs.noModule;

      Object.entries(attrs).forEach(([key, value]) => {
        if (typeof value === 'string' && !(key in script)) {
          script.setAttribute(key, value);
        }
      });

      script.onload = () => {
        this.loadedScripts.add(src);
        this.scriptElements.set(src, script);
        this.loadingPromises.delete(src);
        resolve();
      };

      script.onerror = () => {
        this.loadingPromises.delete(src);
        this.scriptElements.delete(src);
        reject(new Error(`Error al cargar el script: ${src}`));
      };

      document.body.appendChild(script);
    });

    this.loadingPromises.set(src, promise);
    return promise;
  }

  loadAll(scripts: ScriptConfig[]): Promise<void[]> {
    return Promise.all(
      scripts.map(script => this.loadScript(script.src, script.attrs))
    );
  }

  isScriptLoaded(src: string): boolean {
    return this.loadedScripts.has(src);
  }

  removeScript(src: string): boolean {
    const script = this.scriptElements.get(src)
      || (document.querySelector(`script[src="${src}"]`) as HTMLScriptElement | null);

    if (script?.parentNode) {
      script.parentNode.removeChild(script);
    }

    this.scriptElements.delete(src);
    this.loadingPromises.delete(src);
    return this.loadedScripts.delete(src);
  }

  async reloadScript(src: string, attrs: ScriptAttributes = {}): Promise<void> {
    this.removeScript(src);
    return this.loadScript(src, attrs);
  }
}