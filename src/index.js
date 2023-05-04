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
      try {
        const collection = db.collection('slides');

        const slide = await collection.findOne({ _id: new ObjectId(slideId) });

        if (slide) {
          return slide;
        } else {
          throw new Error('Slide not found');
        }
      } catch (error) {
        console.error('Error reading slide:', error);
        throw new Error('Internal server error');
      }
    },
  },
};

const startServer = async () => {
  try {
    const client = new MongoClient('mongodb+srv://LMDmax-dev:admin@cluster0.6m6yw.mongodb.net');
    await client.connect();
    const db = client.db('new-viewer');

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
  } catch (error) {
    console.error('Error starting server:', error);
  }
};

startServer();
