/**
 * Inpage Script (Stacks Provider) <-> Content Script
 */
export enum DomEventName {
  authenticationRequest = 'stacksAuthenticationRequest',
  signatureRequest = 'signatureRequest',
  structuredDataSignatureRequest = 'structuredDataSignatureRequest',
  transactionRequest = 'stacksTransactionRequest',
  profileUpdateRequest = 'profileUpdateRequest',
}

export interface AuthenticationRequestEventDetails {
  authenticationRequest: string;
}

export type AuthenticationRequestEvent = CustomEvent<AuthenticationRequestEventDetails>;

export interface SignatureRequestEventDetails {
  signatureRequest: string;
}

export type SignatureRequestEvent = CustomEvent<SignatureRequestEventDetails>;

export interface TransactionRequestEventDetails {
  transactionRequest: string;
}

export type TransactionRequestEvent = CustomEvent<TransactionRequestEventDetails>;

export interface ProfileUpdateRequestEventDetails {
  profileUpdateRequest: string;
}

export type ProfileUpdateRequestEvent = CustomEvent<ProfileUpdateRequestEventDetails>;
