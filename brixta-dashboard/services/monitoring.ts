// services/monitoring.ts

import { api } from "./api";

export const getHealth = () =>
    api.get("/prod/health");

export const getStorage = () =>
    api.get("/prod/storage");

export const getDocker = () =>
    api.get("/prod/docker");

export const getKubernetes = () =>
    api.get("/prod/kubernetes");

export const getCelery = () =>
    api.get("/prod/celery");

export const getRedis = () =>
    api.get("/prod/redis");