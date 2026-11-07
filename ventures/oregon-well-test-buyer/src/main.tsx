import React from "react";
import {createRoot} from "react-dom/client";
import {WellApp} from "./WellApp.tsx";
import "./styles.css";
const root=document.getElementById("root");if(!root)throw new Error("Missing root");
createRoot(root).render(<React.StrictMode><WellApp/></React.StrictMode>);
