const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull,
  GraphQLBoolean
} = require('graphql');
const cors = require('cors');

const generateUsers = (count) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `user${index + 1}`,
    name: `User ${index + 1}`,
    age: 20 + Math.floor(Math.random() * 40),
    city: ['New York', 'London', 'Tokyo', 'Paris', 'Berlin'][Math.floor(Math.random() * 5)]
  }));
};

const users = generateUsers(1000);

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLNonNull(GraphQLString) },
    age: { type: GraphQLNonNull(GraphQLInt) },
    city: { type: GraphQLNonNull(GraphQLString) }
  }
});

const PageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    hasNextPage: { type: GraphQLNonNull(GraphQLBoolean) },
    hasPreviousPage: { type: GraphQLNonNull(GraphQLBoolean) },
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString }
  }
});

const UserEdgeType = new GraphQLObjectType({
  name: 'UserEdge',
  fields: {
    node: { type: GraphQLNonNull(UserType) },
    cursor: { type: GraphQLNonNull(GraphQLString) }
  }
});

const UserConnectionType = new GraphQLObjectType({
  name: 'UserConnection',
  fields: {
    edges: { type: GraphQLNonNull(GraphQLList(GraphQLNonNull(UserEdgeType))) },
    pageInfo: { type: GraphQLNonNull(PageInfoType) },
    totalCount: { type: GraphQLNonNull(GraphQLInt) }
  }
});

const encodeCursor = (value) => Buffer.from(value.toString()).toString('base64');
const decodeCursor = (cursor) => parseInt(Buffer.from(cursor, 'base64').toString('ascii'), 10);

const validatePaginationArgs = (args) => {
  const { first, last, after, before } = args;

  if (first != null && last != null) {
    throw new Error('Cannot specify both first and last.');
  }

  if (first != null && first < 0) {
    throw new Error('First must be a non-negative integer.');
  }

  if (last != null && last < 0) {
    throw new Error('Last must be a non-negative integer.');
  }
};

const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      users: {
        type: UserConnectionType,
        args: {
          first: { type: GraphQLInt },
          after: { type: GraphQLString },
          last: { type: GraphQLInt },
          before: { type: GraphQLString }
        },
        resolve: (parent, args) => {
          validatePaginationArgs(args);
          const { first, after, last, before } = args;

          let startIndex = 0;
          let endIndex = users.length;

          // Handle cursors
          if (after) {
            startIndex = decodeCursor(after) + 1;
          }
          if (before) {
            endIndex = decodeCursor(before);
          }

          // Calculate slice ranges
          let sliceStart = startIndex;
          let sliceEnd = endIndex;

          if (first) {
            sliceEnd = Math.min(startIndex + first, endIndex);
          }
          if (last) {
            sliceStart = Math.max(endIndex - last, startIndex);
            sliceEnd = endIndex;
          }

          // Get selected users
          const selectedUsers = users.slice(sliceStart, sliceEnd);

          // Create edges with cursors
          const edges = selectedUsers.map((user, index) => ({
            node: user,
            cursor: encodeCursor(sliceStart + index)
          }));

          // Calculate page info
          const pageInfo = {
            hasNextPage: first ? sliceEnd < endIndex : false,
            hasPreviousPage: last ? sliceStart > startIndex : startIndex > 0,
            startCursor: edges.length > 0 ? edges[0].cursor : null,
            endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
          };

          return {
            edges,
            pageInfo,
            totalCount: users.length
          };
        }
      }
    }
  })
});

const app = express();
app.use(cors());

app.use('/graphql', graphqlHTTP({
  schema,
  graphiql: true
}));

const PORT = 4000;
app.listen(PORT, () => {
  console.log(`GraphQL server running at http://localhost:${PORT}/graphql`);
});