import { useQuery } from "@tanstack/react-query";
import contractSettingService from "../services/contract/contractSettingService";
import type { ContractSettingsResponse } from "@/models/Contract";

export interface InsuranceRates {
  normalRate: number; // decimal, e.g. 0.00088
  fragileRate: number; // decimal, e.g. 0.00165
  vatRate: number; // decimal, e.g. 0.1
}

export const useInsuranceRates = () => {
  const service = contractSettingService();

  const { data, isLoading, isError } = useQuery<ContractSettingsResponse>({
    queryKey: ["contractSettings"],
    queryFn: () => service.getContractSettings(),
    staleTime: 1000 * 60 * 30,
  });

  const first = data?.data?.[0];

  const normalRatePercent =
    first?.insuranceRateNormal ??
    (first?.insuranceRate ? first.insuranceRate * 100 : 0.088);
  const fragileRatePercent =
    first?.insuranceRateFragile ??
    (first?.insuranceRate ? first.insuranceRate * 100 : 0.165);
  const vatRatePercent = first?.vatRate ?? 10;

  const normalRate = normalRatePercent / 100;
  const fragileRate = fragileRatePercent / 100;
  const vatRate = vatRatePercent / 100;

  const rates: InsuranceRates = {
    normalRate,
    fragileRate,
    vatRate,
  };

  return {
    rates,
    isLoading,
    isError,
    rawSettings: first,
    normalRatePercent,
    fragileRatePercent,
    vatRatePercent,
  };
};

export default useInsuranceRates;
