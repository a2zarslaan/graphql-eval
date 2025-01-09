const express = require('express');
const { graphqlHTTP } = require('express-graphql');
const {
  GraphQLSchema,
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLList,
  GraphQLNonNull
} = require('graphql');
const cors = require('cors');


// Mock data generator
const generateUsers = (count) => {
  return Array.from({ length: count }, (_, index) => ({
    id: `user_${index + 1}`,
    name: `User ${index + 1}`,
    age: 20 + Math.floor(Math.random() * 40),
    city: ['New York', 'London', 'Tokyo', 'Paris', 'Berlin'][Math.floor(Math.random() * 5)]
  }));
};

// Generate 1000 users for testing
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

// Define PageInfo Type
const PageInfoType = new GraphQLObjectType({
  name: 'PageInfo',
  fields: {
    hasNextPage: { type: GraphQLNonNull(GraphQLString) },
    endCursor: { type: GraphQLString }
  }
});

// Define UserConnection Type
const UserConnectionType = new GraphQLObjectType({
  name: 'UserConnection',
  fields: {
    edges: {
      type: GraphQLNonNull(GraphQLList(GraphQLNonNull(new GraphQLObjectType({
        name: 'UserEdge',
        fields: {
          node: { type: GraphQLNonNull(UserType) },
          cursor: { type: GraphQLNonNull(GraphQLString) }
        }
      }))))
    },
    pageInfo: { type: GraphQLNonNull(PageInfoType) }
  }
});

// Create Schema
const schema = new GraphQLSchema({
  query: new GraphQLObjectType({
    name: 'Query',
    fields: {
      users: {
        type: UserConnectionType,
        args: {
          first: { type: GraphQLInt },
          after: { type: GraphQLString }
        },
        resolve: (parent, args) => {
          const { first = 10, after } = args;

          let startIndex = 0;
          if (after) {
            const decodedCursor = Buffer.from(after, 'base64').toString('ascii');
            startIndex = parseInt(decodedCursor) + 1;
          }

          const selectedUsers = users.slice(startIndex, startIndex + first);

          const edges = selectedUsers.map((user, index) => ({
            node: user,
            cursor: Buffer.from(`${startIndex + index}`).toString('base64')
          }));

          return {
            edges,
            pageInfo: {
              hasNextPage: startIndex + first < users.length ? "true" : "false",
              endCursor: edges.length > 0
                ? edges[edges.length - 1].cursor
                : null
            }
          };
        }
      }
    }
  })
});

// Create Express server
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