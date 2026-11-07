import React from "react";
import {createRoot} from "react-dom/client";
import {ShoreApp} from "./ShoreApp.tsx";
import "./styles.css";
const root=document.getElementById("root");if(!root)throw Error("Missing app root");createRoot(root).render(<React.StrictMode><ShoreApp/></React.StrictMode>);
