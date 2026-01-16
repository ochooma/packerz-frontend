export type PackageType = 'FC' | 'SL' | 'RSC';
export type Material = 'SC350' | 'IV300' | 'EG';
export type PrintType = 'NP' | '4C' | '4C2';
export type LeadTime = 'STD' | 'EXP';
export type SizeBasis = 'internal' | 'external';

export type PackageConfig = {
  type?: PackageType;
  size?: { w?: number; d?: number; h?: number; basis?: SizeBasis };
  material?: Material;
  print?: PrintType;
  quantity?: number;
  lead?: LeadTime;
};

export type Estimate = {
  currency: 'KRW';
  min: number;
  max: number;
  unit: number;
};