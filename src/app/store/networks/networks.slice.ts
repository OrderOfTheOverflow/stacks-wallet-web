import { EntityId, PayloadAction, createEntityAdapter, createSlice } from '@reduxjs/toolkit';

import { DefaultNetworkConfigurationIds, NetworkConfiguration } from '@shared/constants';

const defaultCurrentNetworkId = DefaultNetworkConfigurationIds.mainnet as EntityId;

// Creates type that replicates network store before addition of Bitcoin.
// Current implementation uses a static btc config, based on stx config, so
// persisted store changes requiring migration aren't necessary
export type PersistedNetworkConfiguration = Omit<
  Pick<NetworkConfiguration, 'chain'>['chain']['stacks'],
  'blockchain'
> &
  Pick<NetworkConfiguration, 'id' | 'name'>;

export const networksAdapter = createEntityAdapter<PersistedNetworkConfiguration>();

const initialNetworksState = networksAdapter.getInitialState({
  currentNetworkId: defaultCurrentNetworkId,
});

export const networksSlice = createSlice({
  name: 'networks',
  initialState: initialNetworksState,
  reducers: {
    addNetwork(state, action: PayloadAction<PersistedNetworkConfiguration>) {
      networksAdapter.addOne(state, action.payload);
    },
    changeNetwork(state, action: PayloadAction<EntityId>) {
      state.currentNetworkId = action.payload;
    },
    removeNetwork(state, action: PayloadAction<EntityId>) {
      networksAdapter.removeOne(state, action.payload);
    },
  },
});
