import { humanizeAmount } from '../../utils/amount';
import { IChartApi, ISeriesApi } from 'lightweight-charts';

export function subscribeCrosshair(
  chart: IChartApi,
  chartContainer: HTMLElement,
  series: ISeriesApi<'Area'>,
  selected: HTMLElement,
  actual: HTMLElement,
  onPriceSelection: (price: string) => string
): void {
  chart.subscribeCrosshairMove(function (param) {
    if (
      param.point === undefined ||
      !param.time ||
      param.point.x < 0 ||
      param.point.x > chartContainer.clientWidth ||
      param.point.y < 0 ||
      param.point.y > chartContainer.clientHeight
    ) {
      selected.style.display = 'none';
      actual.style.display = 'flex';
    } else {
      const asset = actual.getElementsByClassName('asset');
      if (asset.length == 0) {
        return;
      }

      selected.style.display = 'block';
      actual.style.display = 'none';
      const price = param.seriesPrices.get(series);
      const usdPrice = onPriceSelection(price.toString());
      const assetText = asset[0].textContent;
      const priceHtml =
        `<div class="price price__selected">` + humanizeAmount(price.toString()) + ` ${assetText}</div>`;
      const usdHtml = `<div class="usd price__selected"><span>` + `≈$${usdPrice}` + `</span></div>`;
      selected.innerHTML = usdPrice ? priceHtml + usdHtml : priceHtml;
    }
  });
}
