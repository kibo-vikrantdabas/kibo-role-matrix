/**
 * Role Matrix Aggregation Module
 * Re-exports all tenant, user, and role functionality from sub-modules.
 * Provides a convenient single import point for role matrix operations.
 *
 * This module aggregates exports from:
 * - tenants: Tenant and site information retrieval
 * - users: User data fetching and enrichment
 * - roles: Role information and helper functions
 *
 * @module rolematrix
 * @exports All exports from ./tenants, ./users, ./roles
 *
 */

// Re-export tenant functions
export * from "./tenants";

// Re-export user functions
export * from "./users";

// Re-export role functions
export * from "./roles";
