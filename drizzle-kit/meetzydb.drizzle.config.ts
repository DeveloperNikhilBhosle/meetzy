import { defineConfig } from "drizzle-kit"
export default defineConfig({
    schema: "./src/dbmodels/drizzel/meetzydb/schema/*.ts",
    out: "./src/dbmodels/drizzel/meetzydb/migrations",
    dialect: "postgresql", // "postgresql" | "mysql"
    dbCredentials: {
        url: ""
    },
    introspect: {
        casing: 'preserve'
    },
    schemaFilter: ['public', 'masters'],
})