import next from "eslint-config-next";
import nextTypeScript from "eslint-config-next/typescript";

/** ESLint 9/10 flat config (Next.js 16 ships a flat-compatible config). */
export default [
  ...next,
  ...nextTypeScript,
  {
    ignores: [
      ".next/**",
      "node_modules/**",
      "out/**",
      "build/**",
      "public/**",
      "next-env.d.ts",
    ],
  },
];
