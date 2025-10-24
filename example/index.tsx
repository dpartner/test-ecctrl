import "./style.css";
import React from "react";
import ReactDOM from "react-dom/client";
import RootComponent from "./components/RootComponent";
import { AppKitProvider } from "./providers/AppKitProvider";

const root = ReactDOM.createRoot(document.querySelector("#root") as HTMLElement);

root.render(
  <>
    <AppKitProvider>
      <RootComponent />
    </AppKitProvider>
  </>
);
