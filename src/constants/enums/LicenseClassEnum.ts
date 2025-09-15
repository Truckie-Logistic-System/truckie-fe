export enum LicenseClassEnum {
    B2 = 'B2',  // duoi 3.5 tan
    C = 'C'     // tren 3.5 tan
}

export const LicenseClassLabels = {
    [LicenseClassEnum.B2]: 'B2 (dưới 3.5 tấn)',
    [LicenseClassEnum.C]: 'C (trên 3.5 tấn)'
}; 