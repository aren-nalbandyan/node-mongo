const { MongoClient } = require('mongodb');

async function main() {

    const uri = "mongodb+srv://Test:passpass2021@cluster0.mwv7a.mongodb.net/sample_airbnb?retryWrites=true&w=majority";

    const client = new MongoClient(uri);

    try {
        // Connect to the MongoDB cluster
        await client.connect();

        // Create new users in the users collection
        await createMultipleUsers(client, [
            {
                email: "user1@example.com",
                name: "User one"
            },
            {
                email: "user2@example.com",
                name: "User two"
            },
            {
                email: "user3@example.com",
                name: "User three"
            }
        ]);

        // Create a unique index on the email field in the users collection.
        const createIndexResults = await client.db("sample_airbnb").collection("users").createIndex({ "email": 1 }, { unique: true });
        console.log(`Users successfully created: ${createIndexResults}`);

    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

async function createMultipleUsers(client, newUsers) {
    const result = await client.db("sample_airbnb").collection("users").insertMany(newUsers);
    console.log(`${result.insertedCount} new user(s) created with the following id(s):`);
}