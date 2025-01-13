import { useEffect, useMemo, useState } from 'react';
import { MaterialReactTable } from 'material-react-table';
import { useQuery, gql } from '@apollo/client';
import { Box, Button } from '@mui/material';
import { FirstPage, LastPage } from '@mui/icons-material';

const GET_USERS = gql`
  query GetUsers(
    $first: Int
    $after: String
    $last: Int
    $before: String
  ) {
    users(
      first: $first
      after: $after
      last: $last
      before: $before
    ) {
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
        hasPreviousPage
        startCursor
        endCursor
      }
      totalCount
    }
  }
`;

const App = () => {
  const [currentCursor, setCurrentCursor] = useState(null);
  const [pagination, setPagination] = useState({
    pageIndex: 0,
    pageSize: 10,
  });

  const { loading, error, data, fetchMore } = useQuery(GET_USERS, {
    variables: {
      first: pagination.pageSize,
      after: null,
    },
    notifyOnNetworkStatusChange: true,
  });

  const handlePaginationChange = async (updater) => {
    const newPagination = typeof updater === 'function' ? updater(pagination) : updater;

    if (newPagination.pageSize !== pagination.pageSize) {
      setPagination({ pageIndex: 0, pageSize: newPagination.pageSize });
      setCurrentCursor(null);
      await fetchMore({
        variables: {
          first: newPagination.pageSize,
          after: null
        }
      });
    } else if (newPagination.pageIndex !== pagination.pageIndex) {
      const isForward = newPagination.pageIndex > pagination.pageIndex;

      await fetchMore({
        variables: {
          first: isForward ? pagination.pageSize : undefined,
          after: isForward ? data?.users?.pageInfo?.endCursor : undefined,
          last: !isForward ? pagination.pageSize : undefined,
          before: !isForward ? currentCursor : undefined,
        },
        updateQuery: (prev, { fetchMoreResult }) => fetchMoreResult
      });

      setCurrentCursor(data?.users?.pageInfo?.endCursor);
      setPagination(prev => ({ ...prev, pageIndex: newPagination.pageIndex }));
    }
  };

  const handleFirstPage = async () => {
    setPagination(prev => ({ ...prev, pageIndex: 0 }));
    setCurrentCursor(null);
    await fetchMore({
      variables: {
        first: pagination.pageSize,
        after: null
      },
      updateQuery: (prev, { fetchMoreResult }) => fetchMoreResult
    });
  };

  const handleLastPage = async () => {
    const totalPages = Math.ceil((data?.users?.totalCount ?? 0) / pagination.pageSize);
    setPagination(prev => ({ ...prev, pageIndex: totalPages - 1 }));

    await fetchMore({
      variables: {
        last: pagination.pageSize
      },
      updateQuery: (prev, { fetchMoreResult }) => fetchMoreResult
    });
  };

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
    onPaginationChange: handlePaginationChange,
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
    renderTopToolbarCustomActions: () => (
      <Box sx={{ display: 'flex', gap: '1rem' }}>
        <Button
          onClick={handleFirstPage}
          disabled={pagination.pageIndex === 0}
          startIcon={<FirstPage />}
        >
          First Page
        </Button>
        <Button
          onClick={handleLastPage}
          disabled={pagination.pageIndex === Math.ceil((data?.users?.totalCount ?? 0) / pagination.pageSize) - 1}
          startIcon={<LastPage />}
        >
          Last Page
        </Button>
      </Box>
    ),
  };

  return <MaterialReactTable {...table} />;
};

export default App;