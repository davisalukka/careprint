// GitHub Pages serves this project at /careprint/, so every in-app link has to
// carry that prefix. Vite injects it as BASE_URL, which keeps the dev server
// (served from /) and the deployed site working from the same source.
const base = import.meta.env.BASE_URL;

export const HOME_PATH = base;
export const DEMO_PATH = `${base}demo/`;
export const METHODOLOGY_PATH = `${base}methodology/`;
