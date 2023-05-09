const express = require('express');
const { ApolloServer, gql } = require('apollo-server-express');
const { MongoClient, ObjectId } = require('mongodb');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const AWS = require('aws-sdk');
const s3 = new AWS.S3({
  accessKeyId: 'AKIAZN6QGFQY2OWXGF55',
  secretAccessKey: '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',
  region: 'eu-north-1'
});


const app = express();
const port = 3000;

const typeDefs = gql`
  type Slide {
    _id: ID!
    slideName: String!
    awsImageBucketUrl: String!
    originalFileUrl: String!
  }

  type ConversionResponse {
    success: Boolean!
    data: ConversionData!
  }

  type ConversionData {
    slide_id: ID!
    status: String!
    viewer_url: String!
  }

  type Query {
    slide(slideId: ID!): Slide
  }

  type Mutation {
    createSlideAndConvert(svsFilePath: String!): ConversionResponse
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
Mutation: {
    //svsFilePath: url of already uploaded file on s3
  createSlideAndConvert: async (_, { svsFilePath }, { db }) => {
    try{
    // Create a database entry for the request
    const result = await db.collection('slides').insertOne({
      originalFileUrl:svsFilePath,
      timestamp: new Date(),
      status: 'in-process',
      awsImageBucketUrl:'',
    });
      const svsFileName = svsFilePath.split('/').pop();
      const bucket = svsFilePath.split("s3://")[1].split("/")[0];
      const outputPrefix = `slides/${path.dirname(svsFilePath)}`;
      const dziFilePath = `slides/${svsFileName}.dzi`;
      const components = svsFilePath.split('/');
      const fileName = components.slice(3).join('/');
      const existInS3 = await fileExistsInS3(bucket,dziFilePath);
      if(!existInS3){
      const params = {
        Bucket: bucket,
        Key: fileName,
      };

      const svsFileData = await s3.getObject(params).promise();
      
      const tmpFilePath = `C:\\tmp\\${encodeURIComponent(svsFilePath.split('/').pop())}`;

      fs.writeFileSync(tmpFilePath, svsFileData.Body);

      await convertSvsToDzi(s3, bucket, svsFilePath, outputPrefix, dziFilePath);
    }
      const dziURL = `https://${bucket}/${dziFilePath}`;

   // const expiryTimestamp = Math.floor(Date.now() / 1000) + 3 * 60 * 60;

   const slideId = result.insertedId.toString(); 

    await db.collection('slides').updateOne(
      { _id: result.insertedId },
      { $set: { status: 'completed',awsImageBucketUrl: dziURL} }
    );

    // Generate the viewer URL
    const viewerURL = `https://viewer.prr.ai/slide/${slideId}`;

    // Return the response object
    return {
      success: true,
      data: {
        slide_id: slideId,
        status: 'completed',
        viewer_url: viewerURL,
      },
    };
  } catch (error) {
    console.error(error);
    throw new Error('An error occurred during the slide conversion process.');
      }
    },
  },
};
async function convertSvsToDzi(s3,bucket, svsFilePath, outputPrefix, dziFilePath) {
  
  const files = fs.readdirSync('C:\\tmp');
  
  const svsFileName = svsFilePath.split('/').pop();
  
  // Find the SVS file in the temporary directory
  const svsFile = files.find((file) => decodeURIComponent(file) === svsFileName);

  if (!svsFile) {
    throw new Error('SVS file not found in the temporary directory.');
  }

  // Create a directory for the output files
  const sanitizedOutputPrefix = outputPrefix.replace(/[\/:*?"<>|]/g, '_');
  fs.mkdirSync(`C:\\tmp\\${sanitizedOutputPrefix}`);

  // Perform the SVS to DZI conversion using sharp
  await sharp(`C:\\tmp\\${svsFile}`)
  .withMetadata()
  .jpeg()
  .tile({
    size: 512,
  })
  .toFile(`C:\\tmp\\${sanitizedOutputPrefix}\\output.dz`);
  console.log("converted");
// Upload the DZI file to S3
const dziFile = fs.readFileSync(`C:\\tmp\\${sanitizedOutputPrefix}\\output.dzi`);

  const options = {
    Bucket: bucket,
    Key: dziFilePath,
    Body: dziFile,
    ACL: 'private',
  };

  await s3.putObject(options).promise();
  fs.rmdirSync(`C:\\tmp\\${sanitizedOutputPrefix}`, { recursive: true });
}

// Function to check if a file exists in S3
async function fileExistsInS3(bucket, key) {
  try {
    await s3.headObject({ Bucket: bucket, Key: key }).promise();
    return true; // File exists
  } catch (error) {
    if (error.code === "NotFound") {
      return false; // File does not exist
    }
    throw error; // Other error occurred
  }
}


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
