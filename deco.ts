/// <reference no-default-lib="true"/>
/// <reference lib="deno.ns" />
/// <reference lib="esnext" />
/// <reference lib="dom" />
/// <reference lib="dom.iterable" />

import "./utils/patched_fetch.ts";

import { AsyncLocalStorage } from "node:async_hooks";
import { ImportMap } from "./blocks/app.ts";
import { ReleaseResolver } from "./engine/core/mod.ts";
import { Release } from "./engine/releases/provider.ts";
import { AppManifest } from "./mod.ts";
import { randId } from "./utils/rand.ts";

export interface DecoRuntimeState {
  manifest: AppManifest;
  // deno-lint-ignore no-explicit-any
  resolver: ReleaseResolver<any>;
  importMap: ImportMap;
}

export interface InstanceInfo {
  startedAt: Date;
  id: string;
  readyAt?: Date;
}

export type RequestContext = {
  /** Cancelation token used for early processing halt */
  signal?: AbortSignal;
};

// The global deco context
export type DecoContext = {
  deploymentId: string | undefined;
  isDeploy: boolean;
  site: string;
  siteId: number;
  loginUrl?: string;
  base?: string;
  namespace?: string;
  release?: Release;
  runtime?: Promise<DecoRuntimeState>;
  play?: boolean;
  instance: InstanceInfo;
  request?: RequestContext;
};

const defaultContext: Omit<DecoContext, "schema"> = {
  deploymentId: Deno.env.get("DENO_DEPLOYMENT_ID"),
  isDeploy: Boolean(Deno.env.get("DENO_DEPLOYMENT_ID")),
  site: "",
  siteId: 0,
  play: Deno.env.has("USE_LOCAL_STORAGE_ONLY"),
  instance: {
    id: randId(),
    startedAt: new Date(),
  },
};

const asyncLocalStorage = new AsyncLocalStorage<DecoContext>();

export const Context = {
  // Function to retrieve the active context
  active: (): DecoContext => {
    // Retrieve the context associated with the async ID
    return asyncLocalStorage.getStore() ?? defaultContext;
  },
  bind: <R, TArgs extends unknown[]>(
    ctx: DecoContext,
    f: (...args: TArgs) => R,
  ): (...args: TArgs) => R => {
    return (...args: TArgs): R => {
      return asyncLocalStorage.run(ctx, f, ...args);
    };
  },
};

export const RequestContext = {
  active: () => Context.active().request,
  bind: <R, TArgs extends unknown[]>(
    request: RequestContext,
    f: (...args: TArgs) => R,
  ): (...args: TArgs) => R => {
    return Context.bind({ ...Context.active(), request }, f);
  },
  get signal() {
    return Context.active().request?.signal;
  },
};

export const context = Context.active();
