import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Load Inter and Fira Code fonts
const interFont = document.createElement('link');
interFont.rel = 'stylesheet';
interFont.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap';
document.head.appendChild(interFont);

const firaCodeFont = document.createElement('link');
firaCodeFont.rel = 'stylesheet';
firaCodeFont.href = 'https://fonts.googleapis.com/css2?family=Fira+Code:wght@400;500&display=swap';
document.head.appendChild(firaCodeFont);

// Bootstrap icons
const bootstrapIcons = document.createElement('link');
bootstrapIcons.rel = 'stylesheet';
bootstrapIcons.href = 'https://cdn.jsdelivr.net/npm/bootstrap-icons@1.8.0/font/bootstrap-icons.css';
document.head.appendChild(bootstrapIcons);

// Add title
document.title = "CodePair - Collaborative Programming Platform";

createRoot(document.getElementById("root")!).render(<App />);
