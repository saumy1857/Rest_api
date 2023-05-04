const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { MongoClient, ObjectId } = require('mongodb');

const app = express();
const port = 3000;

const typeDefs = gql`
  type Slide {
    _id: ID!
    slideName: String!
    awsImageBucketUrl: String!
    originalFileUrl: String!
  }

  type Query {
    slide(slideId: ID!): Slide
  }
`;

const resolvers = {
  Query: {
    slide: async (_, { slideId }, { db }) => {
      const collection = db.collection('slides');

      const slide = await collection.findOne({ _id: new ObjectId(slideId) });

      return slide;
    },
  },
};

const startServer = async () => {
  const client = new MongoClient('mongodb://localhost:27017');
  await client.connect();
  const db = client.db('students_api'); // Replace with your database name

  const server = new ApolloServer({
    typeDefs,
    resolvers,
    context: { db },
  });

  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port }, () => {
    console.log(`Server listening on port ${port}`);
  });
};

startServer();
