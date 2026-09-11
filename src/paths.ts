// GitHub Pages serves this project at /careprint/, so every in-app link has to
// carry that prefix. Vite injects it as BASE_URL, which keeps the dev server
// (served from /) and the deployed site working from the same source.
const base = import.meta.env.BASE_URL;

export const HOME_PATH = base;
export const DEMO_PATH = `${base}demo/`;
export const METHODOLOGY_PATH = `${base}methodology/`;

/** The only public contact path already published for this project. No inbox exists. */
export const REPO_URL = "https://github.com/davisalukka/careprint";
export const REPO_ISSUES_URL = `${REPO_URL}/issues`;
