// main.jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import { ApolloClient, InMemoryCache, ApolloProvider } from '@apollo/client'
import App from './App'

const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache({
    typePolicies: {
      Query: {
        fields: {
          users: {
            // Merge function for cursor-based pagination
            keyArgs: [],
            merge(existing, incoming, { args: { after } }) {
              if (!existing) return incoming;
              if (!after) return incoming;

              return {
                ...incoming,
                edges: [...existing.edges, ...incoming.edges],
              };
            }
          }
        }
      }
    }
  })
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <ApolloProvider client={client}>
      <App />
    </ApolloProvider>
  </React.StrictMode>
)