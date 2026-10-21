import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  serverExternalPackages: ["@electric-sql/pglite"],
  // Ficheros que se leen en tiempo de ejecución y el empaquetado no detecta solo.
  outputFileTracingIncludes: {
    "/**": ["./db/schema.sql", "./data/catalogos/**", "./node_modules/@electric-sql/pglite/dist/**"],
  },
};

export default nextConfig;
