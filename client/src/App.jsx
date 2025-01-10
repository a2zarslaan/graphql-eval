import { useEffect, useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { useQuery, gql } from '@apollo/client';

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
      totalCount
    }
  }
`;

const App = () => {
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { loading, error, data, refetch } = useQuery(GET_USERS, {
    variables: {
      first: pagination.pageSize,
      after: null,
    },
    notifyOnNetworkStatusChange: true,
  });

  useEffect(() => {
    refetch({
      first: pagination.pageSize,
      after: pagination.pageIndex > 0 ? data?.users?.pageInfo?.endCursor : null,
    });
  }, [pagination.pageIndex, pagination.pageSize]);

  const columns = useMemo(
    () => [
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
    ],
    []
  );

  const tableData = useMemo(() => {
    if (!data?.users?.edges) return [];
    return data.users.edges.map(({ node }) => node);
  }, [data]);

  const table = {
    columns,
    data: tableData,
    manualPagination: true,
    muiToolbarAlertBannerProps: error
      ? {
        color: 'error',
        children: 'Error loading data',
      }
      : undefined,
    onPaginationChange: setPagination,
    rowCount: data?.users?.totalCount ?? 0,
    state: {
      isLoading: loading,
      pagination,
      showAlertBanner: Boolean(error),
      showProgressBars: loading,
    },
    getRowId: (row) => row.id,
    initialState: {
      density: 'comfortable',
      pagination: { pageSize: 10, pageIndex: 0 }
    },
  };

  return <MaterialReactTable {...table} />;
};

export default App;