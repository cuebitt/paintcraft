import type { StoreApi } from "zustand/vanilla";
import type { TemporalState } from "zundo";

declare module "zustand/vanilla" {
  interface StoreMutators<S, A> {
    temporal: S & { temporal: StoreApi<TemporalState<Partial<S>>> };
  }
}
