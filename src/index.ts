import "./styles/index.scss";
import { IExchangeRates, IRequestParams } from "types/ExchangeInterface";
import axios, { AxiosRequestConfig, AxiosResponse } from "axios";

class APIExchangeClass {
  static api_url: string = "https://xecdapi.xe.com/v1/convert_from.json/";
  static currencies: string[] = ["USD", "EUR", "BYN", "CNY", "RUB"];

  static async fetchRates(from: string, amount: number, decimal_places: number) {
    const url: URL = new URL(this.api_url);

    const params: IRequestParams = {
      from: from,
      to: this.currencies.filter((currency) => currency != from).join(","),
      amount: amount,
      decimal_places: decimal_places,
      apiKey: `${process.env.API_KEY}`,
      apiID: `${process.env.API_ID}`,
    };

    url.search = new URLSearchParams({
      from: params.from,
      to: params.to,
      amount: params.amount.toString(),
      decimal_places: params.decimal_places.toString(),
    }).toString();

    const buffer: Buffer = Buffer.from(params.apiID + ":" + params.apiKey);

    const axiosConfig: AxiosRequestConfig = {
      headers: {
        Authorization: `Basic ` + buffer.toString("base64"),
      },
    };

    const res: AxiosResponse = await axios.get(url.href, axiosConfig);

    const exchange_rates: IExchangeRates[] = res.data["to"];
    return exchange_rates;
  }
}

class Utils {
  static getElement(selector: string): Element {
    const el: Element | null = document.querySelector(selector);
    if (el != null) {
      return el;
    } else {
      throw new Error(`Query by Selector failed. Element ${selector} could not be found`);
    }
  }

  static getElementHTML(selector: string): HTMLElement {
    const el: HTMLElement | null = document.getElementById(selector);
    if (el != null) {
      return el;
    } else {
      throw new Error(`Query by ID failed. Element ${selector} could not be found`);
    }
  }
}

class UILogicClass {
  constructor() {
    this.initListeners();
  }
  public currencySelectorEl: HTMLElement | any = Utils.getElementHTML("currency-selector");
  public inputAmountEl: HTMLElement | any = Utils.getElementHTML("input-amount");
  public submitButtonEl: Element = Utils.getElement("#submit-button");
  public converterContentEl: Element = Utils.getElement(".converter_content");
  private isExchangeListVisible: boolean = false;
  private selectedISO: string = "";
  private currencyAmount: number = 0;
  // private exchangeNodes: IExchangeRates[] = [];
  public countries = { USD: "usa", RUB: "russian-federation", CNY: "china", BYN: "belarus", EUR: "flag-of-europe" };
  public spanNodes: HTMLElement[] = [];

  public initListeners() {
    this.submitButtonEl.addEventListener("click", this.maintainExchangeList);
    this.currencySelectorEl.addEventListener("change", this.fetchCurrencyISO);
    this.inputAmountEl.addEventListener("input", this.fetchInputAmount);
  }

  public fetchInputAmount = () => {
    this.currencyAmount = this.inputAmountEl.value;
  };

  public fetchCurrencyISO = () => {
    this.selectedISO = this.currencySelectorEl.value;
  };

  public createRateLabelEl(amount: number, iso: string): HTMLLabelElement {
    const label = document.createElement("label");
    const img = document.createElement("img");
    const span = document.createElement("span");
    const flag = this.countries[iso as keyof Object];
    img.src = `https://img.icons8.com/office/25/000000/${flag}.png`;
    label.appendChild(img);
    span.id = iso;
    span.innerHTML = amount.toString();
    label.appendChild(span);
    this.spanNodes.push(label);
    return label;
  }

  public addExchangeListContainer() {
    const exchangeCntTemplate = document.createElement("div");
    if (this.currencyAmount == 0 || this.selectedISO == "") {
      throw "Currency selector and currency amount are empty";
    } else {
      exchangeCntTemplate.className = "exchange_rates_component";
      exchangeCntTemplate.id = "exchanged-list";
      return this.converterContentEl.appendChild(exchangeCntTemplate);
    }
  }

  public updateExchangeNodes(nodes: Element[], rates: Promise<IExchangeRates[]>): void {
    rates.then((new_rates) => {
      new_rates.forEach((new_rate, idx) => {
        nodes[idx].children[1].id = new_rate.quotecurrency;
        nodes[idx].children[1].innerHTML = new_rate.mid.toString();
        nodes[idx].children[0].attributes[0].value = `https://img.icons8.com/office/25/000000/${
          this.countries[new_rate.quotecurrency as keyof Object]
        }.png`;
      });
    });
  }

  public maintainExchangeList = () => {
    if (!this.isExchangeListVisible) {
      const exchangedListNode: Element = this.addExchangeListContainer();
      const rates = APIExchangeClass.fetchRates(this.selectedISO, this.currencyAmount, 3);
      rates.then((exc_rates: IExchangeRates[]) => {
        exc_rates.forEach((node: IExchangeRates) => {
          exchangedListNode.appendChild(this.createRateLabelEl(node.mid, node.quotecurrency));
        });
      });
      this.isExchangeListVisible = !this.isExchangeListVisible;
    } else {
      try {
        if (this.currencyAmount == 0 || this.selectedISO == "") {
          throw "Currency selector and currency amount are empty";
        } else {
          const new_rates = APIExchangeClass.fetchRates(this.selectedISO, this.currencyAmount, 3);
          this.updateExchangeNodes(this.spanNodes, new_rates);
        }
      } catch (err) {
        alert("Error: " + err);
      }
    }
  };
}

const UILogic = new UILogicClass();
