import { CLIENT_NAV_ATTR, PARTIAL_ATTR } from "$fresh/src/constants.ts";
import { SectionContext } from "deco/components/section.tsx";
import { IS_BROWSER } from "deco/deps.ts";
import { FieldResolver } from "deco/engine/core/resolver.ts";
import { ComponentType } from "preact";
import { useContext } from "preact/hooks";

type Options<P> = {
  /** Section props partially applied */
  props?: Partial<P extends ComponentType<infer K> ? K : P>;

  /** Path where section is to be found */
  href?: string;
};

export const usePartialSection = <P>(
  { props = {}, href }: Options<P> = {},
) => {
  const ctx = useContext(SectionContext);

  if (IS_BROWSER) {
    throw new Error("Partials cannot be used inside an Island!");
  }

  if (!ctx) {
    throw new Error("Missing context in rendering tree");
  }

  const {
    resolveChain,
    request,
    renderSalt,
    context: { state: { pathTemplate } },
  } = ctx;

  const params = new URLSearchParams([
    ["props", JSON.stringify(props)],
    ["href", href ?? request.url],
    ["pathTemplate", pathTemplate],
    ["renderSalt", `${renderSalt ?? crypto.randomUUID()}`],
    [
      "resolveChain",
      JSON.stringify(FieldResolver.minify(resolveChain.slice(0, -1))),
    ],
    ["fresh-partial", "true"],
  ]);

  return {
    [CLIENT_NAV_ATTR]: true,
    [PARTIAL_ATTR]: `/deco/render?${params}`,
  };
};
