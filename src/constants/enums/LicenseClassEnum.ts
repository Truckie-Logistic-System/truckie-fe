export enum LicenseClassEnum {
    B2 = 'B2',  // duoi 3.5 tan
    C = 'C'     // tren 3.5 tan
}

export const LicenseClassLabels = {
    [LicenseClassEnum.B2]: 'B2 (dưới 3.5 tấn)',
    [LicenseClassEnum.C]: 'C (trên 3.5 tấn)'
};

export const LicenseClassColors = {
    [LicenseClassEnum.B2]: 'bg-blue-500 text-white',
    [LicenseClassEnum.C]: 'bg-purple-500 text-white'
}; 