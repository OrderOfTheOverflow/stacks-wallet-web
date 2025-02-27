import { useNavigate } from 'react-router-dom';

import { Form, Formik } from 'formik';
import * as yup from 'yup';

import { logger } from '@shared/logger';
import { FeeTypes } from '@shared/models/fees/_fees.model';
import { RouteUrls } from '@shared/route-urls';

import { formatPrecisionError } from '@app/common/error-formatters';
import { btcAddressValidator } from '@app/common/validation/forms/address-validators';
import { btcAmountValidator } from '@app/common/validation/forms/currency-validators';
import { btcFeeValidator } from '@app/common/validation/forms/fee-validators';
import { FeesRow } from '@app/components/fees-row/fees-row';
import { BtcIcon } from '@app/components/icons/btc-icon';
import { useBitcoinCryptoCurrencyAssetBalance } from '@app/query/bitcoin/address/address.hooks';
import { useBitcoinFees } from '@app/query/bitcoin/fees/fee-estimates.hooks';
import { useCurrentAccountBtcAddressState } from '@app/store/accounts/account.hooks';

import { AmountField } from '../../components/amount-field';
import { FormErrors } from '../../components/form-errors';
import { FormFieldsLayout } from '../../components/form-fields.layout';
import { MemoField } from '../../components/memo-field';
import { PreviewButton } from '../../components/preview-button';
import { RecipientField } from '../../components/recipient-field';
import { SelectedAssetField } from '../../components/selected-asset-field';
import { SendAllButton } from '../../components/send-all-button';
import { createDefaultInitialFormValues } from '../../form-utils';

interface BtcCryptoCurrencySendFormProps {}
export function BtcCryptoCurrencySendForm({}: BtcCryptoCurrencySendFormProps) {
  const navigate = useNavigate();
  const currentAccountBtcAddress = useCurrentAccountBtcAddressState();
  const btcCryptoCurrencyAssetBalance =
    useBitcoinCryptoCurrencyAssetBalance(currentAccountBtcAddress);
  /*
    TODO: Replace hardcoded median (226) with the tx byte length?
    Median source: https://github.com/bitcoinbook/bitcoinbook/blob/develop/ch06.asciidoc#transaction-fees
    tx size = in*180 + out*34 + 10 plus or minus 'in'
  */
  const { data: btcFees } = useBitcoinFees(226);

  logger.debug('btc balance', btcCryptoCurrencyAssetBalance);
  logger.debug('btc fees', btcFees);

  const initialValues = createDefaultInitialFormValues({
    memo: '',
    fee: '',
    feeType: FeeTypes.Unknown,
  });

  function onSubmit() {
    logger.debug('form submit');
  }

  const validationSchema = yup.object({
    amount: btcAmountValidator(formatPrecisionError(btcCryptoCurrencyAssetBalance.balance)),
    recipient: btcAddressValidator(),
    fee: btcFeeValidator(btcCryptoCurrencyAssetBalance.balance),
  });

  return (
    <Formik
      initialValues={initialValues}
      onSubmit={onSubmit}
      validateOnBlur={false}
      validateOnChange={false}
      validateOnMount={false}
      validationSchema={validationSchema}
    >
      <Form>
        <AmountField symbol="BTC" rightInputOverlay={<SendAllButton />} />
        <FormFieldsLayout>
          <SelectedAssetField
            icon={<BtcIcon />}
            name={btcCryptoCurrencyAssetBalance.asset.name}
            onClickAssetGoBack={() => navigate(RouteUrls.SendCryptoAsset)}
            symbol="BTC"
          />
          <RecipientField />
          <MemoField lastChild />
        </FormFieldsLayout>
        <FeesRow fees={btcFees} isSponsored={false} mt="base" />
        <FormErrors />
        <PreviewButton />
      </Form>
    </Formik>
  );
}
