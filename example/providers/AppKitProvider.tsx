import type { ReactNode } from "react";
import { createAppKit, useAppKitEvents } from "@reown/appkit/react";
import { WagmiProvider } from "wagmi";
import type { AppKitNetwork } from "@reown/appkit/networks";
import { base } from "@reown/appkit/networks";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import React, { useEffect } from "react";
import { AuthSIWX } from "../utils/siwx";
import { ReownProjectId } from "../utils/client";

const queryClient = new QueryClient();

export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [base];

const wagmiAdapter = new WagmiAdapter({
  networks,
  projectId: ReownProjectId,
  ssr: true,
});

export const appkit = createAppKit({
  adapters: [wagmiAdapter],
  networks,
  siwx: new AuthSIWX(),
  projectId: ReownProjectId,
  defaultNetwork: networks[0],
  features: {
    analytics: true,
    onramp: false,
    swaps: false,
  },
});

export function AppKitProvider({ children }: { children: ReactNode }) {
  const eventsAppKit = useAppKitEvents();

  const events = ["click", "mousedown", "mouseup", "mousemove", "keydown", "keyup", "keypress", "touchstart", "touchend", "touchmove"];

  useEffect(() => {
    const preventDefault = (event: Event) => {
      event.stopPropagation();
    };
    const rootElement = document.querySelector("w3m-modal");
    if (rootElement) {
      events.forEach((eventName) => {
        rootElement.addEventListener(eventName, preventDefault);
      });
    }
    return () => {
      if (rootElement) {
        events.forEach((eventName) => {
          rootElement.removeEventListener(eventName, preventDefault);
        });
      }
    };
  }, [eventsAppKit]);

  return (
    <WagmiProvider config={wagmiAdapter.wagmiConfig}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </WagmiProvider>
  );
}
