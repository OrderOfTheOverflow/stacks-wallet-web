import { forwardRef } from 'react';

import { StackProps } from '@stacks/ui';

import type { AllCryptoCurrencyAssetBalances } from '@shared/models/crypto-asset-balance.model';

import { CryptoCurrencyAssetItemLayout } from './crypto-currency-asset-item.layout';

interface CryptoCurrencyAssetItemProps extends StackProps {
  assetBalance: AllCryptoCurrencyAssetBalances;
  assetSubBalance?: AllCryptoCurrencyAssetBalances;
  icon: JSX.Element;
  isPressable?: boolean;
}
export const CryptoCurrencyAssetItem = forwardRef((props: CryptoCurrencyAssetItemProps, ref) => {
  const { assetBalance, assetSubBalance, icon, isPressable, ...rest } = props;
  const { balance, asset } = assetBalance;

  return (
    <CryptoCurrencyAssetItemLayout
      balance={balance}
      caption={assetBalance.balance.symbol}
      icon={icon}
      isPressable={isPressable}
      ref={ref}
      subBalance={assetSubBalance?.balance}
      title={asset.name}
      {...(rest as any)}
    />
  );
});
