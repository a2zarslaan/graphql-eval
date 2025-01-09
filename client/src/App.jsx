import { useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { ApolloClient, InMemoryCache, gql, useQuery } from '@apollo/client';
import { Box } from '@mui/material';

// Apollo Client setup
const client = new ApolloClient({
  uri: 'http://localhost:4000/graphql',
  cache: new InMemoryCache()
});

// GraphQL query
const GET_USERS = gql`
  query GetUsers($first: Int, $after: String) {
    users(first: $first, after: $after) {
      edges {
        node {
          id
          name
          age
          city
        }
        cursor
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PAGE_SIZE = 10;

const App = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: PAGE_SIZE,
  });

  const { data, loading, error } = useQuery(GET_USERS, {
    variables: {
      first: pagination.pageSize,
      after: pagination.pageIndex > 0 ?
        btoa(String((pagination.pageIndex * pagination.pageSize) - 1)) : null
    },
    client
  });

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID',
    },
    {
      accessorKey: 'name',
      header: 'Name',
    },
    {
      accessorKey: 'age',
      header: 'Age',
    },
    {
      accessorKey: 'city',
      header: 'City',
    },
  ];

  if (error) return <div>Error: {error.message}</div>;

  return (
    <MaterialReactTable
      columns={columns}
      data={data?.users?.edges?.map(edge => edge.node) ?? []}
      initialState={{ density: 'compact' }}
      manualPagination
      onPaginationChange={setPagination}
      state={{
        pagination,
        isLoading: loading,
      }}
      pageCount={100} // Total pages estimation (1000 records / 10 per page)
      renderTopToolbarCustomActions={() => (
        <Box sx={{ pl: 2 }}>User Data Table</Box>
      )}
      muiLinearProgressProps={{
        sx: {
          display: loading ? 'block' : 'none',
        },
      }}
    />
  );
};

export default App;