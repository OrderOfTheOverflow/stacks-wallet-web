import { memo } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';

import { Flex, Stack } from '@stacks/ui';
import { Formik } from 'formik';
import get from 'lodash.get';
import * as yup from 'yup';

import { FeeTypes } from '@shared/models/fees/_fees.model';
import { TransactionFormValues } from '@shared/models/form.model';
import { RouteUrls } from '@shared/route-urls';

import { useAnalytics } from '@app/common/hooks/analytics/use-analytics';
import { LoadingKeys, useLoading } from '@app/common/hooks/use-loading';
import { useOnMount } from '@app/common/hooks/use-on-mount';
import { useRouteHeader } from '@app/common/hooks/use-route-header';
import { useWalletType } from '@app/common/use-wallet-type';
import { stxFeeValidator } from '@app/common/validation/forms/fee-validators';
import { nonceValidator } from '@app/common/validation/nonce-validators';
import { EditNonceButton } from '@app/components/edit-nonce-button';
import { NonceSetter } from '@app/components/nonce-setter';
import { PopupHeader } from '@app/features/current-account/popup-header';
import { RequestingTabClosedWarningMessage } from '@app/features/errors/requesting-tab-closed-error-msg';
import { HighFeeDrawer } from '@app/features/high-fee-drawer/high-fee-drawer';
import { useLedgerNavigate } from '@app/features/ledger/hooks/use-ledger-navigate';
import { ContractCallDetails } from '@app/pages/transaction-request/components/contract-call-details/contract-call-details';
import { ContractDeployDetails } from '@app/pages/transaction-request/components/contract-deploy-details/contract-deploy-details';
import { PageTop } from '@app/pages/transaction-request/components/page-top';
import { PostConditionModeWarning } from '@app/pages/transaction-request/components/post-condition-mode-warning';
import { PostConditions } from '@app/pages/transaction-request/components/post-conditions/post-conditions';
import { StxTransferDetails } from '@app/pages/transaction-request/components/stx-transfer-details/stx-transfer-details';
import { TransactionError } from '@app/pages/transaction-request/components/transaction-error/transaction-error';
import { useCurrentStacksAccountAnchoredBalances } from '@app/query/stacks/balance/balance.hooks';
import { useStacksFeeEstimations } from '@app/query/stacks/fees/fees-legacy';
import { useNextNonce } from '@app/query/stacks/nonce/account-nonces.hooks';
import { useTransactionRequestState } from '@app/store/transactions/requests.hooks';
import {
  useGenerateUnsignedStacksTransaction,
  useSoftwareWalletTransactionRequestBroadcast,
  useTxRequestEstimatedUnsignedTxByteLengthState,
  useTxRequestSerializedUnsignedTxPayloadState,
} from '@app/store/transactions/transaction.hooks';

import { FeeForm } from './components/fee-form';
import { SubmitAction } from './components/submit-action';

function TransactionRequestBase() {
  const transactionRequest = useTransactionRequestState();
  const { setIsLoading, setIsIdle } = useLoading(LoadingKeys.SUBMIT_TRANSACTION);
  const handleBroadcastTransaction = useSoftwareWalletTransactionRequestBroadcast();
  const txByteLength = useTxRequestEstimatedUnsignedTxByteLengthState();
  const txPayload = useTxRequestSerializedUnsignedTxPayloadState();
  const feeEstimations = useStacksFeeEstimations(txByteLength, txPayload);
  const analytics = useAnalytics();
  const { walletType } = useWalletType();
  const generateUnsignedTx = useGenerateUnsignedStacksTransaction();
  const { data: stacksBalances } = useCurrentStacksAccountAnchoredBalances();
  const ledgerNavigate = useLedgerNavigate();
  const { data: nextNonce } = useNextNonce();
  const navigate = useNavigate();

  useRouteHeader(<PopupHeader />);

  useOnMount(() => {
    void analytics.track('view_transaction_signing'), [analytics];
  });

  const onSubmit = async (values: TransactionFormValues) => {
    if (walletType === 'ledger') {
      const tx = await generateUnsignedTx(values);
      if (!tx) return;
      ledgerNavigate.toConnectAndSignTransactionStep(tx);
      return;
    }
    setIsLoading();

    try {
      await handleBroadcastTransaction(values);
      setIsIdle();
    } catch (e) {
      navigate(RouteUrls.TransactionBroadcastError, { state: { message: get(e, 'message') } });
      return;
    }

    void analytics.track('submit_fee_for_transaction', {
      calculation: feeEstimations.calculation,
      fee: values.fee,
      type: values.feeType,
    });
  };

  if (!transactionRequest) return null;

  const validationSchema = !transactionRequest.sponsored
    ? yup.object({
        fee: stxFeeValidator(stacksBalances?.stx.availableStx),
        nonce: nonceValidator,
      })
    : null;

  const initialValues: TransactionFormValues = {
    fee: '',
    feeType: FeeTypes[FeeTypes.Middle],
    nonce: nextNonce?.nonce,
  };

  return (
    <Flex alignItems="center" flexDirection="column" width="100%">
      <Stack px="loose" spacing="loose">
        <PageTop />
        <RequestingTabClosedWarningMessage />
        <PostConditionModeWarning />
        <TransactionError />
        <PostConditions />
        {transactionRequest.txType === 'contract_call' && <ContractCallDetails />}
        {transactionRequest.txType === 'token_transfer' && <StxTransferDetails />}
        {transactionRequest.txType === 'smart_contract' && <ContractDeployDetails />}
        <Formik
          initialValues={initialValues}
          onSubmit={onSubmit}
          validateOnChange={false}
          validateOnBlur={false}
          validateOnMount={false}
          validationSchema={validationSchema}
        >
          {() => (
            <>
              <NonceSetter>
                <FeeForm feeEstimations={feeEstimations.estimates} />
                <SubmitAction />
                <EditNonceButton onEditNonce={() => navigate(RouteUrls.EditNonce)} />
                <HighFeeDrawer />
              </NonceSetter>
              <Outlet />
            </>
          )}
        </Formik>
      </Stack>
    </Flex>
  );
}

export const TransactionRequest = memo(TransactionRequestBase);
