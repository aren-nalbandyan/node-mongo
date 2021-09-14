const { MongoClient } = require('mongodb');

async function main() {
    const uri = "mongodb+srv://Test:passpass2021@cluster0.mwv7a.mongodb.net/sample_airbnb?retryWrites=true&w=majority";

    const client = new MongoClient(uri);

    try {
        await client.connect();

        async function createReservation(client, userEmail, nameOfListing, reservationDates, reservationDetails) {

            const listingsAndReviewsCollection = client.db("sample_airbnb").collection("listingsAndReviews");

            const session = client.startSession();

            const transactionOptions = {
                readPreference: 'primary',
                readConcern: { level: 'local' },
                writeConcern: { w: 'majority' }
            };

            try {
                const transactionResults = await session.withTransaction(async () => {
                    const isListingReservedResults = await listingsAndReviewsCollection.findOne(
                        { name: nameOfListing, datesReserved: { $in: reservationDates } },
                        { session });
                    if (isListingReservedResults) {
                        await session.abortTransaction();
                        console.error("This listing is already reserved for at least one of the given dates. The reservation could not be created.");
                        console.error("Any operations that already occurred as part of this transaction will be rolled back.");
                        return;
                    } else {
                        await listingsAndReviewsCollection.insertOne(reservationDetails);
                    }

                    const listingsAndReviewsUpdateResults = await listingsAndReviewsCollection.updateOne(
                        { name: nameOfListing },
                        { $addToSet: { datesReserved: { $each: reservationDates } } },
                        { session });
                    console.log(`${listingsAndReviewsUpdateResults.matchedCount} document(s) found in the listingsAndReviews collection with the name ${nameOfListing}.`);
                    console.log(`${listingsAndReviewsUpdateResults.modifiedCount} document(s) was/were updated to include the reservation dates.`);
                }, transactionOptions);

                if (transactionResults) {
                    console.log("The reservation was successfully created.");
                } else {
                    console.log("The transaction was intentionally aborted.");
                }

            } catch(e){
                console.log("The transaction was aborted due to an unexpected error: " + e);

            } finally {
                await session.endSession();

            }
        }
        await createReservation(client,
            "leslie@example.com",
            "Infinite Views",
            [new Date("2021-09-13"), new Date("2021-10-01")],
            {
                _id: 1234567890,
                name: 'Test name',
                listing_url: 'https://www.airbnb.com/rooms/10006546',
                summary: 'Test summary',
                space: 'test space',
                description: 'test description',
                neighborhood_overview: 'test neighborhood_overview',
                notes: 'test notes',
                transit: 'test transit',
                access: 'test access',
                interaction: 'test interaction',
                house_rules: 'test house_rules',
                property_type: 'test property_type',
                room_type: 'test room_type',
                bed_type: 'test bed_type',
                minimum_nights: 'test minimum_nights',
                maximum_nights: 'test maximum_nights',
                cancellation_policy: 'test cancellation_policy',
                last_scraped: '2021-09-16T05:00:00.000+00:00',
                calendar_last_scraped: '2021-09-16T05:00:00.000+00:00',
                first_review: '2021-09-16T05:00:00.000+00:00',
                last_review: '2021-09-16T05:00:00.000+00:00',
                accommodates: '8',
                bedrooms: '2',
                beds: '4',
            });
    } finally {
        // Close the connection to the MongoDB cluster
        await client.close();
    }
}

main().catch(console.error);

// Add functions that make DB calls here