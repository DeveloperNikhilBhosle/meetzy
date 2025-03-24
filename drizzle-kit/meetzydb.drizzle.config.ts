import { defineConfig } from "drizzle-kit"
export default defineConfig({
    schema: "./src/dbmodels/drizzel/meetzydb/schema/*.ts",
    out: "./src/dbmodels/drizzel/meetzydb/migrations",
    dialect: "postgresql", // "postgresql" | "mysql"
    dbCredentials: {
        url: "postgresql://pguser:R5sWDsMWc7aYHfQc@ec2-13-235-15-173.ap-south-1.compute.amazonaws.com:5432/MeetZyDBDev"
    },
    introspect: {
        casing: 'preserve'
    },
    schemaFilter: ['public', 'masters'],
})