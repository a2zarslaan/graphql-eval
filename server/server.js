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


// Mock data generator
const generateUsers = (count) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `user${index + 1}`,
    name: `User ${index + 1}`,
    age: 20 + Math.floor(Math.random() * 40),
    city: ['New York', 'London', 'Tokyo', 'Paris', 'Berlin'][Math.floor(Math.random() * 5)]
  }));
};

const users = generateUsers(1000);

// Define User Type
const UserType = new GraphQLObjectType({
  name: 'User',
  fields: {
    id: { type: GraphQLNonNull(GraphQLString) },
    name: { type: GraphQLNonNull(GraphQLString) },
    age: { type: GraphQLNonNull(GraphQLInt) },
    city: { type: GraphQLNonNull(GraphQLString) }
  }
});

// Define PageInfo Type (Fixed boolean type)
const PageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    hasNextPage: { type: GraphQLNonNull(GraphQLBoolean) },
    hasPreviousPage: { type: GraphQLNonNull(GraphQLBoolean) },
    startCursor: { type: GraphQLString },
    endCursor: { type: GraphQLString }
  }
});

// Define UserEdge Type
const UserEdgeType = new GraphQLObjectType({
  name: 'UserEdge',
  fields: {
    node: { type: GraphQLNonNull(UserType) },
    cursor: { type: GraphQLNonNull(GraphQLString) }
  }
});

// Define UserConnection Type
const UserConnectionType = new GraphQLObjectType({
  name: 'UserConnection',
  fields: {
    edges: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(UserEdgeType)))
    },
    pageInfo: {
      type: GraphQLNonNull(PageInfoType)
    },
    totalCount: {
      type: GraphQLNonNull(GraphQLInt)
    }
  }
});

// Cursor handling functions
const toCursor = (index) => Buffer.from(`cursor:${index}`).toString('base64');
const fromCursor = (cursor) => {
  const value = Buffer.from(cursor, 'base64').toString('ascii');
  return parseInt(value.split(':')[1], 10);
};

// Create Schema
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
          const { first, after, last, before } = args;

          if (first && last) {
            throw new Error('Cannot specify both first and last');
          }

          let startIndex = 0;
          let endIndex = users.length;

          if (after) {
            startIndex = fromCursor(after) + 1;
          }

          if (before) {
            endIndex = fromCursor(before);
          }

          if (first) {
            endIndex = Math.min(startIndex + first, endIndex);
          }

          if (last) {
            startIndex = Math.max(endIndex - last, startIndex);
          }

          const selectedUsers = users.slice(startIndex, endIndex);

          const edges = selectedUsers.map((user, index) => ({
            node: user,
            cursor: toCursor(startIndex + index)
          }));

          return {
            edges,
            pageInfo: {
              hasNextPage: endIndex < users.length,
              hasPreviousPage: startIndex > 0,
              startCursor: edges.length > 0 ? edges[0].cursor : null,
              endCursor: edges.length > 0 ? edges[edges.length - 1].cursor : null
            },
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