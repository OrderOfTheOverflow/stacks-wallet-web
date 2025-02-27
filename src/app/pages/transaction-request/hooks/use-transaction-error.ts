import { useMemo } from 'react';

import { ContractCallPayload, TransactionTypes } from '@stacks/connect';
import BigNumber from 'bignumber.js';

import { useDefaultRequestParams } from '@app/common/hooks/use-default-request-search-params';
import { microStxToStx } from '@app/common/money/unit-conversion';
import { validateStacksAddress } from '@app/common/stacks-utils';
import { TransactionErrorReason } from '@app/pages/transaction-request/components/transaction-error/transaction-error';
import { useCurrentStacksAccountAnchoredBalances } from '@app/query/stacks/balance/balance.hooks';
import { useContractInterface } from '@app/query/stacks/contract/contract.hooks';
import { useCurrentAccount } from '@app/store/accounts/account.hooks';
import { useTransactionRequestState } from '@app/store/transactions/requests.hooks';

export function useTransactionError() {
  const transactionRequest = useTransactionRequestState();
  const contractInterface = useContractInterface(transactionRequest as ContractCallPayload);
  const { origin } = useDefaultRequestParams();

  const currentAccount = useCurrentAccount();
  const { data: balances } = useCurrentStacksAccountAnchoredBalances();

  return useMemo<TransactionErrorReason | void>(() => {
    if (!origin) return TransactionErrorReason.ExpiredRequest;

    if (!transactionRequest || !balances || !currentAccount) {
      return TransactionErrorReason.Generic;
    }

    if (transactionRequest.txType === TransactionTypes.ContractCall) {
      if (!validateStacksAddress(transactionRequest.contractAddress))
        return TransactionErrorReason.InvalidContractAddress;
      if (contractInterface?.isError) return TransactionErrorReason.NoContract;
    }

    if (balances) {
      const zeroBalance = balances?.stx.availableStx.amount.toNumber() === 0;

      if (transactionRequest.txType === TransactionTypes.STXTransfer) {
        if (zeroBalance) return TransactionErrorReason.StxTransferInsufficientFunds;

        const transferAmount = new BigNumber(transactionRequest.amount);
        if (transferAmount.gte(balances?.stx.availableStx.amount))
          return TransactionErrorReason.StxTransferInsufficientFunds;
      }

      if (!transactionRequest.sponsored) {
        if (zeroBalance) return TransactionErrorReason.FeeInsufficientFunds;

        if (transactionRequest.fee) {
          const feeValue = microStxToStx(transactionRequest.fee);
          if (feeValue.gte(balances?.stx.availableStx.amount))
            return TransactionErrorReason.FeeInsufficientFunds;
        }
      }
    }
    return;
  }, [contractInterface, balances, currentAccount, transactionRequest, origin]);
}
