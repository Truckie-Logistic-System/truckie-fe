// Export API client
import httpClient from "./api";

// Export services
import authService from "./auth";
import api from "./api";
import { vietmapService, openmapService, trackasiaService } from "./map";

// Export types
export * from "./api/types";
export * from "./auth/types";
export * from "./order/types";
export * from "./map/types";
import { categoryService } from "./categoryService";
import { addressService } from "./addressService";
import { orderService } from "./orderService";

export {
  httpClient,
  authService,
  orderService,
  vietmapService,
  openmapService,
  trackasiaService,
  categoryService,
  addressService,
  api,
};
