import { useAppKit } from "@reown/appkit/react";

export const useReownOpenWallet = () => {
  const { open } = useAppKit();

  const openWallet = () => {
    open();
  };
  return { openWallet };
};
