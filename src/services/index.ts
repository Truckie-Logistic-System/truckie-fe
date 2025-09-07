// Export API client
import httpClient from "./api";

// Export services
import authService from "./auth";
import orderService from "./order";
import { vietmapService, openmapService, trackasiaService } from "./map";
import issueService from "./issue";
import penaltyService from "./penalty";
import categoryService from "./category";
import addressService from "./address";
import orderSizeService from "./order-size";

// Export types
export * from "./api/types";
export * from "./auth/types";
export * from "./order/types";
export * from "./map/types";
export * from "./issue/types";
export * from "./penalty/types";
export * from "./category/types";
export * from "./address/types";
export * from "./order-size/types";

export {
  httpClient,
  authService,
  orderService,
  vietmapService,
  openmapService,
  trackasiaService,
  issueService,
  penaltyService,
  categoryService,
  addressService,
  orderSizeService
};
