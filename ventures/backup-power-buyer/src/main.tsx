import React from "react";
import {createRoot} from "react-dom/client";
import {BackupApp} from "./BackupApp.tsx";
import "./styles.css";
const root=document.getElementById("root");if(!root)throw Error("Missing app root");
createRoot(root).render(<React.StrictMode><BackupApp/></React.StrictMode>);
