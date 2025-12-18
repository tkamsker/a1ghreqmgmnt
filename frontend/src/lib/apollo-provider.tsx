'use client';

import { ApolloProvider as ApolloProviderBase } from '@apollo/client';

import client from './apollo-client';

export function ApolloProvider({ children }: { children: React.ReactNode }) {
  return <ApolloProviderBase client={client}>{children}</ApolloProviderBase>;
}
