import type { Balance, RuntimeDispatchInfo } from '@polkadot/types/interfaces';
import { ApiPromise } from '@polkadot/api';
import { SYSTEM_ASSET_ID, SYSTEM_ASSET_DECIMALS, Transaction, bnum, TradeRouter } from '@galacticcouncil/sdk';

import { Account } from '../db';
import { formatAmount, multipleAmounts } from '../utils/amount';

export type PaymentFee = { amount: string; amountNative: string; asset: string; ed: string };

export class PaymentApi {
  private _api: ApiPromise;
  private _router: TradeRouter;

  public constructor(api: ApiPromise, router: TradeRouter) {
    this._api = api;
    this._router = router;
  }

  async getPaymentFeeAsset(account: Account): Promise<string> {
    const feeAsset = await this._api.query.multiTransactionPayment.accountCurrencyMap(account.address);
    return feeAsset.toHuman() ? feeAsset.toString() : SYSTEM_ASSET_ID;
  }

  async getPaymentInfo(transaction: Transaction, account: Account): Promise<RuntimeDispatchInfo> {
    const transactionExtrinsic = this._api.tx(transaction.hex);
    return await transactionExtrinsic.paymentInfo(account.address);
  }

  async getPaymentFee(
    feeAssetId: string,
    feeAssetSymbol: string,
    feeAssetNativeBalance: Balance,
    feeAssetEd: string
  ): Promise<PaymentFee> {
    const feeAssetEdBN = bnum(feeAssetEd.toString());
    const feeNativeBN = bnum(feeAssetNativeBalance.toString());
    const feeHuman = formatAmount(feeNativeBN, SYSTEM_ASSET_DECIMALS);

    if (feeAssetId == SYSTEM_ASSET_ID) {
      const ed = formatAmount(feeAssetEdBN, SYSTEM_ASSET_DECIMALS);
      return {
        amount: feeHuman,
        amountNative: feeAssetNativeBalance.toString(),
        asset: feeAssetSymbol,
        ed: ed,
      } as PaymentFee;
    }

    const feeAssetPrice = await this._router.getBestSpotPrice(SYSTEM_ASSET_ID, feeAssetId);
    const fee = multipleAmounts(feeHuman, feeAssetPrice);
    const ed = formatAmount(feeAssetEdBN, feeAssetPrice.decimals);
    return {
      amount: fee.toString(),
      amountNative: feeAssetNativeBalance.toString(),
      asset: feeAssetSymbol,
      ed: ed,
    } as PaymentFee;
  }
}