import { Map, Record, Set } from 'immutable';

export const License = Record({
    parent: '2',
    id: '4'
});

export const LicenseDescription = Record({
    description: [],
    id: null,
    label: null,
    parent: null,
});

export const LicenseState = Record({
    allIds: new Set(),
    byId: new Map(),
});
