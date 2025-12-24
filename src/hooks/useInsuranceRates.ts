import { useQuery } from "@tanstack/react-query";
import contractSettingService from "../services/contract/contractSettingService";
import type { ContractSettingsResponse } from "@/models/Contract";

export interface InsuranceRates {
  normalRate: number; // decimal with VAT included, e.g. 0.000968 (0.088% * 1.1)
  fragileRate: number; // decimal with VAT included, e.g. 0.001815 (0.165% * 1.1)
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

  // Base rates (without VAT) in percentage
  const normalRatePercentBase =
    first?.insuranceRateNormal ??
    (first?.insuranceRate ? first.insuranceRate * 100 : 0.088);
  const fragileRatePercentBase =
    first?.insuranceRateFragile ??
    (first?.insuranceRate ? first.insuranceRate * 100 : 0.165);
  
  // VAT rate from contract settings (stored as decimal, e.g., 0.1 = 10%)
  const vatRate = first?.vatRate ?? 0.1;
  const vatRatePercent = vatRate * 100;

  // Calculate rates with VAT included (in percentage)
  const normalRatePercent = normalRatePercentBase * (1 + vatRate);
  const fragileRatePercent = fragileRatePercentBase * (1 + vatRate);

  // Convert to decimal for calculation
  const normalRate = normalRatePercent / 100;
  const fragileRate = fragileRatePercent / 100;

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
    normalRatePercent, // with VAT
    fragileRatePercent, // with VAT
    normalRatePercentBase, // without VAT
    fragileRatePercentBase, // without VAT
    vatRatePercent,
  };
};

export default useInsuranceRates;
