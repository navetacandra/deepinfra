import typescript from "@rollup/plugin-typescript";
export default {
  input: "src/index.ts",
  output: [
    { file: "dist/deepinfra.cjs.js", format: "cjs" },
    { file: "dist/deepinfra.esm.js", format: "esm" },
    { file: "dist/deepinfra.umd.js", format: "umd", name: "Deepinfra" },
  ],
  plugins: [typescript()],
};