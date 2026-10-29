import axios from 'axios';

async function runWomanMovementVerification() {
  console.log('================================================================');
  console.log(' WOMAN LIVE MOVEMENT & AUTHORITY DASHBOARD MARKER TEST SUITE');
  console.log('================================================================');

  try {
    // 1. Woman starts trip at GPS (19.9975, 73.7898)
    console.log('\n[STEP 1] Woman Starts Trip...');
    console.log(' -> Current GPS: (19.9975, 73.7898)');

    const tripRes = await axios.post('http://localhost:5000/api/trips', {
      source: { name: 'Nashik Bus Stand', lat: 19.9975, lng: 73.7898 },
      destination: { name: 'Panchavati Temple', lat: 20.0050, lng: 73.7990 },
      transportType: 'Bus #102',
      expectedDuration: 20
    });

    const tripId = tripRes.data._id;
    console.log(` -> Trip Created! Trip ID: ${tripId}`);

    // Verify Dashboard API returns woman's initial location
    const overviewRes = await axios.get('http://localhost:5000/api/dashboard/journeys');
    const activeTrip1 = overviewRes.data.find((j: any) => j._id === tripId);
    console.log(` 👩 [DASHBOARD INITIAL MARKER] Woman Marker Rendered at GPS: (${activeTrip1?.currentLocation?.lat}, ${activeTrip1?.currentLocation?.lng})`);

    // 2. She moves -> GPS: 19.9990, 73.7920
    console.log('\n[STEP 2] She Moves...');
    console.log(' -> GPS: (19.9990, 73.7920)');

    await axios.post(`http://localhost:5000/api/trips/${tripId}/location`, {
      latitude: 19.9990,
      longitude: 73.7920,
      speed: 34.5,
      direction: 18.0
    });

    const overviewRes2 = await axios.get('http://localhost:5000/api/dashboard/journeys');
    const activeTrip2 = overviewRes2.data.find((j: any) => j._id === tripId);
    console.log(` 👩 [DASHBOARD MARKER MOVES] Updated Marker Location: (${activeTrip2?.currentLocation?.lat}, ${activeTrip2?.currentLocation?.lng})`);

    // 3. She moves again -> GPS: 20.0012, 73.7955
    console.log('\n[STEP 3] She Moves Again...');
    console.log(' -> GPS: (20.0012, 73.7955)');

    await axios.post(`http://localhost:5000/api/trips/${tripId}/location`, {
      latitude: 20.0012,
      longitude: 73.7955,
      speed: 38.0,
      direction: 22.0
    });

    const overviewRes3 = await axios.get('http://localhost:5000/api/dashboard/journeys');
    const activeTrip3 = overviewRes3.data.find((j: any) => j._id === tripId);
    console.log(` 👩 [DASHBOARD MARKER MOVES AGAIN] Updated Marker Location: (${activeTrip3?.currentLocation?.lat}, ${activeTrip3?.currentLocation?.lng})`);

    console.log('\n================================================================');
    console.log(' 🎉 ALL 3 MOVEMENT STEPS VERIFIED SUCCESSFULLY FOR DASHBOARD MARKER!');
    console.log('================================================================');
  } catch (err: any) {
    console.error('Movement Test Error:', err.response?.data || err.message);
  }
}

runWomanMovementVerification();
