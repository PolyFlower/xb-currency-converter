export interface IRequestParams {
  from: string;
  to: string;
  apiKey: string;
  apiID: string;
  amount: number;
  decimal_places: number;
}

export interface IExchangeRates {
  mid: number;
  quotecurrency: string;
}
