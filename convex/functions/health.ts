// API aggregator (B-18): pure re-export of the health feature's public
// functions, so the frontend imports a flat `api.functions.health.*` path.
export { ping } from '../features/health/queries.public';
