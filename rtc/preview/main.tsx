import { createRoot } from "react-dom/client";
import "@fontsource-variable/inter-tight";
import "@fontsource/bebas-neue";
import "../src/app/globals.css";
import { GameApp } from "../src/components/GameApp";

createRoot(document.getElementById("root")!).render(<GameApp />);
