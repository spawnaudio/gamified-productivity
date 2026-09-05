import { useEffect, useRef, useState } from "react";

export function WalletBadge({ balance }: { balance: number }) {
  const previous = useRef(balance);
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    if (balance > previous.current) {
      setFlash(true);
      const timer = window.setTimeout(() => setFlash(false), 600);
      previous.current = balance;
      return () => window.clearTimeout(timer);
    }
    previous.current = balance;
  }, [balance]);

  return <p className={flash ? "wallet credited" : "wallet"}>Wallet {balance}</p>;
}
