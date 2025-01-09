import { MaterialReactTable } from 'material-react-table';
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useState } from 'react';

const queryClient = new QueryClient();

const fetchUsers = async ({ pageSize, cursor }) => {
  const query = `
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

  const response = await axios.post('http://localhost:4000/graphql', {
    query,
    variables: {
      first: pageSize,
      after: cursor
    }
  });

  return response.data.data.users;
};

const UsersTable = () => {
  const [cursor, setCursor] = useState(null);
  const [pageSize, setPageSize] = useState(10);

  const { data, isError, isFetching } = useQuery({
    queryKey: ['users', cursor, pageSize],
    queryFn: () => fetchUsers({ pageSize, cursor }),
    keepPreviousData: true
  });

  const columns = [
    {
      accessorKey: 'id',
      header: 'ID'
    },
    {
      accessorKey: 'name',
      header: 'Name'
    },
    {
      accessorKey: 'age',
      header: 'Age'
    },
    {
      accessorKey: 'city',
      header: 'City'
    }
  ];

  return (
    <MaterialReactTable
      columns={columns}
      data={data?.edges.map(edge => edge.node) ?? []}
      enablePagination
      manualPagination
      rowCount={100000} // Set to a high number since we're using cursor-based pagination
      state={{
        pagination: {
          pageSize,
          pageIndex: 0 // Always 0 since we're using cursor-based pagination
        },
        isLoading: isFetching
      }}
      onPaginationChange={(updater) => {
        const newPagination = updater({
          pageSize,
          pageIndex: 0
        });
        setPageSize(newPagination.pageSize);
        if (data?.pageInfo.endCursor) {
          setCursor(data.pageInfo.endCursor);
        }
      }}
      enableRowSelection={false}
      enableMultiSort={false}
      enableGlobalFilter={false}
      muiTablePaginationProps={{
        rowsPerPageOptions: [5, 10, 20],
        showFirstButton: false,
        showLastButton: false,
      }}
    />
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <div style={{ padding: '20px' }}>
        <h1>Users List</h1>
        <UsersTable />
      </div>
    </QueryClientProvider>
  );
};

export default App;